/* Detecção de altura (YIN) e microfone. Implementação local, sem bibliotecas externas.
   Também pode ser carregado no Node para testes: module.exports = pitch. */
(function (root) {
  'use strict';
  const pitch = {};
  /* YIN (de Cheveigné & Kawahara, 2002): diferença, média cumulativa normalizada,
     limiar absoluto e interpolação parabólica. Retorna { freq, clarity } ou null. */
  pitch.yin = (buf, sampleRate, opts = {}) => {
    const threshold = opts.threshold ?? 0.12, minF = opts.minFreq ?? 65, maxF = opts.maxFreq ?? 1400;
    const tauMin = Math.max(2, Math.floor(sampleRate / maxF)), tauMax = Math.min(Math.floor(sampleRate / minF), Math.floor(buf.length / 2));
    const W = buf.length - tauMax;
    if (W < 32 || tauMax <= tauMin) return null;
    const d = new Float32Array(tauMax + 1);
    for (let tau = 1; tau <= tauMax; tau++) {
      let sum = 0;
      for (let i = 0; i < W; i++) { const x = buf[i] - buf[i + tau]; sum += x * x; }
      d[tau] = sum;
    }
    const cmnd = new Float32Array(tauMax + 1); cmnd[0] = 1;
    let running = 0;
    for (let tau = 1; tau <= tauMax; tau++) { running += d[tau]; cmnd[tau] = running ? d[tau] * tau / running : 1; }
    let tau = -1;
    for (let t = tauMin; t <= tauMax; t++) {
      if (cmnd[t] < threshold) { while (t + 1 <= tauMax && cmnd[t + 1] < cmnd[t]) t++; tau = t; break; }
    }
    if (tau < 0) return null;
    let better = tau;
    if (tau > 1 && tau < tauMax) {
      const a = cmnd[tau - 1], b = cmnd[tau], c = cmnd[tau + 1], den = a - 2 * b + c;
      if (den) better = tau + (a - c) / (2 * den);
    }
    return { freq: sampleRate / better, clarity: 1 - cmnd[tau] };
  };
  pitch.rms = buf => { let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); };
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  /* Converte frequência em nota MIDI, nome (ex.: A4) e desvio em cents (−50 a +50). */
  pitch.analyze = freq => {
    const midiF = 69 + 12 * Math.log2(freq / 440), midi = Math.round(midiF);
    return { freq, midiF, midi, name: NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1), cents: Math.round((midiF - midi) * 100) };
  };
  /* Desvio em cents até o alvo, dobrando oitavas (cantar uma oitava acima/abaixo conta como mesma nota). */
  pitch.centsTo = (midiF, target, foldOctave = true) => {
    let c = (midiF - target) * 100;
    if (foldOctave) { c = ((c % 1200) + 1200) % 1200; if (c > 600) c -= 1200; }
    return c;
  };
  pitch.median = arr => { if (!arr.length) return null; const a = arr.slice().sort((x, y) => x - y), m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };

  /* Microfone: getUserMedia exige HTTPS ou localhost e um gesto do usuário (iOS/Safari). */
  pitch.Mic = class {
    constructor() { this.stream = null; this.raf = 0; this.active = false; this.listeners = new Set(); this.last = null; }
    static supported() { return !!(root.navigator && root.navigator.mediaDevices && root.navigator.mediaDevices.getUserMedia); }
    static explain(err) {
      const n = err && (err.name || err.message || err);
      if (n === 'insecure') return 'O microfone só funciona em endereço HTTPS ou em localhost. Use o modo sem microfone ou abra a versão publicada.';
      if (n === 'unsupported') return 'Este navegador não oferece acesso ao microfone. Use o modo sem microfone.';
      if (n === 'noaudio') return 'O áudio do navegador não está disponível. Use o modo sem microfone.';
      if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') return 'Permissão do microfone negada. Libere o microfone nas configurações do navegador (no iPhone: Ajustes › Safari › Microfone) ou continue sem microfone.';
      if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError') return 'Nenhum microfone foi encontrado. Conecte um microfone ou continue sem microfone.';
      if (n === 'NotReadableError' || n === 'AbortError') return 'O microfone está em uso por outro aplicativo. Feche-o e tente novamente.';
      return 'Não foi possível usar o microfone. Continue sem microfone.';
    }
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    async start(ctx) {
      if (this.active) return;
      if (!pitch.Mic.supported()) throw { name: 'unsupported' };
      if (root.isSecureContext === false) throw { name: 'insecure' };
      if (!ctx) throw { name: 'noaudio' };
      this.stream = await root.navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      if (ctx.state !== 'running') { try { await ctx.resume(); } catch {} }
      this.ctx = ctx;
      this.source = ctx.createMediaStreamSource(this.stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.source.connect(this.analyser); /* não conecta à saída: evita microfonia */
      this.buf = new Float32Array(this.analyser.fftSize);
      this.bytes = new Uint8Array(this.analyser.fftSize);
      this.active = true;
      let lastT = 0;
      const loop = now => {
        if (!this.active) return;
        this.raf = root.requestAnimationFrame(loop);
        if (now - lastT < 30) return; /* ~30 análises por segundo */
        lastT = now;
        if (this.analyser.getFloatTimeDomainData) this.analyser.getFloatTimeDomainData(this.buf);
        else { this.analyser.getByteTimeDomainData(this.bytes); for (let i = 0; i < this.bytes.length; i++) this.buf[i] = (this.bytes[i] - 128) / 128; }
        const level = pitch.rms(this.buf);
        let frame = { t: now / 1000, level, voiced: false };
        if (level > 0.01) {
          const r = pitch.yin(this.buf, ctx.sampleRate);
          if (r && r.clarity > 0.8 && r.freq > 65 && r.freq < 1400) frame = Object.assign(frame, pitch.analyze(r.freq), { voiced: true, clarity: r.clarity });
        }
        this.last = frame;
        this.listeners.forEach(fn => { try { fn(frame); } catch {} });
      };
      this.raf = root.requestAnimationFrame(loop);
    }
    stop() {
      this.active = false;
      if (this.raf) root.cancelAnimationFrame(this.raf);
      try { this.source && this.source.disconnect(); } catch {}
      if (this.stream) this.stream.getTracks().forEach(t => t.stop());
      this.stream = null; this.source = null; this.last = null;
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = pitch;
  else {
    const X = root.__musExt = root.__musExt || {};
    X.pitch = pitch;
    X.mic = new pitch.Mic();
    /* Libera o microfone ao parar, ocultar ou sair da página. */
    root.addEventListener('music:stop', () => { if (!X.keepMic) X.mic.stop(); });
    root.addEventListener('pagehide', () => X.mic.stop());
  }
})(typeof window !== 'undefined' ? window : globalThis);
