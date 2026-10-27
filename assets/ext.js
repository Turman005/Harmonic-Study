/* Núcleo dos módulos novos (Hoje, Canto, Prova de nível, Meu plano).
   Carregado antes do engine.js: apenas registra funções; o motor é acessado sob demanda por window.__mus. */
(() => {
  'use strict';
  const X = window.__musExt = window.__musExt || {};
  const core = X.core = {};
  const $ = core.$ = (s, r = document) => r.querySelector(s);
  core.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  core.esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  core.attr = obj => core.esc(JSON.stringify(obj));
  core.mus = () => window.__mus;
  /* Armazenamento local com tolerância a bloqueio (modo privado, cotas). */
  const memory = {};
  core.load = (key, fallback) => {
    try { const raw = localStorage.getItem(key); if (raw) { const v = JSON.parse(raw); if (v && typeof v === 'object') return v; } } catch {}
    return memory[key] ? JSON.parse(memory[key]) : (typeof fallback === 'function' ? fallback() : JSON.parse(JSON.stringify(fallback)));
  };
  core.save = (key, value) => { const raw = JSON.stringify(value); memory[key] = raw; try { localStorage.setItem(key, raw); } catch {} };
  /* Notas. */
  const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const SOLF = ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'];
  core.SHARP = SHARP;
  core.noteName = (midi, mode) => {
    const m = Math.round(midi), pc = ((m % 12) + 12) % 12, oct = Math.floor(m / 12) - 1;
    const nom = mode || core.mus()?.S?.nom || 'cifra';
    const cifra = SHARP[pc].replace('#', '♯') + oct, solf = SOLF[pc] + oct;
    return nom === 'solfejo' ? solf : nom === 'ambos' ? `${solf} (${cifra})` : cifra;
  };
  core.pretty = s => String(s).replace(/#/g, '♯').replace(/([A-G])b/g, '$1♭').replace(/\(b(\d+)\)/g, '(♭$1)');
  core.midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);
  core.freqToMidi = f => 69 + 12 * Math.log2(f / 440);
  core.dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  core.fmtDate = iso => { try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return iso; } };
  core.shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  core.pick = a => a[Math.floor(Math.random() * a.length)];
  core.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  core.LEVELS = ['Iniciante', 'Básico', 'Intermediário', 'Avançado'];
  core.INSTRUMENTS = { piano: 'Piano', violao: 'Violão / Guitarra', baixo: 'Baixo', ukulele: 'Ukulele', cavaquinho: 'Cavaquinho' };
  let toastTimer;
  core.toast = msg => { const t = $('#toast'); if (!t) return; t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 5000); };
  core.setFocus = text => { X.focusText = text || ''; const el = $('#transport-focus'); if (el && document.body.classList.contains('ext-sec')) el.textContent = text || 'Pronto para ouvir'; };
  /* Áudio: reutiliza o AudioContext, a saída e o sintetizador do motor original. */
  core.unlock = () => { try { core.mus()?.unlock(); } catch {} };
  core.ctx = () => { try { return core.mus()?.ctx() || null; } catch { return null; } };
  core.audioOk = () => { const c = core.ctx(); return !!c && c.state !== 'closed'; };
  core.note = (midi, delay = 0, dur = 1, vel = .8) => { try { core.mus().note(midi, Math.max(0, delay), dur, vel); } catch {} };
  core.chord = (midis, delay = 0, dur = 1.4) => midis.forEach(m => core.note(m, delay, dur, .55));
  core.click = (delay = 0, accent = false) => { try { core.mus().click(Math.max(0, delay), accent); } catch {} };
  /* Tom guia sustentado (sirenes, messa di voce): osciladores próprios ligados à saída do motor. */
  const tones = new Set();
  core.tone = ({ midi, to = null, delay = 0, dur = 1, vel = .5, shape = 'flat' }) => {
    const c = core.ctx(); if (!c) return;
    try {
      const out = core.mus().out() || c.destination;
      const t0 = c.currentTime + .03 + Math.max(0, delay), t1 = t0 + dur;
      const g = c.createGain(), f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 2400;
      const peak = .16 * vel;
      g.gain.setValueAtTime(1e-4, t0);
      if (shape === 'messa') { g.gain.exponentialRampToValueAtTime(peak * .25, t0 + .08); g.gain.linearRampToValueAtTime(peak, t0 + dur * .5); g.gain.linearRampToValueAtTime(peak * .2, t1 - .05); }
      else { g.gain.exponentialRampToValueAtTime(peak, t0 + .06); g.gain.setValueAtTime(peak, t1 - .12); }
      g.gain.exponentialRampToValueAtTime(1e-4, t1);
      [['triangle', 1, 1], ['sine', 2, .25]].forEach(([type, mult, amp]) => {
        const o = c.createOscillator(), og = c.createGain();
        o.type = type; og.gain.value = amp;
        o.frequency.setValueAtTime(core.midiToFreq(midi) * mult, t0);
        if (to != null) o.frequency.exponentialRampToValueAtTime(core.midiToFreq(to) * mult, t1);
        o.connect(og); og.connect(f); o.start(t0); o.stop(t1 + .02);
        tones.add(o); o.onended = () => tones.delete(o);
      });
      f.connect(g); g.connect(out);
    } catch {}
  };
  core.stopTones = () => { tones.forEach(o => { try { o.stop(); } catch {} }); tones.clear(); };
  core.stopAll = (opts = {}) => { X.keepMic = !!opts.keepMic; try { core.mus().stop(); } catch { core.stopTones(); } X.keepMic = false; };
  /* Navegação com predefinições: abre um módulo já configurado. */
  const ENGINE_KEYS = { pc: v => Number.isInteger(v) && v >= 0 && v < 12, ktype: v => ['maior', 'menor'].includes(v), scaleId: v => typeof v === 'string', modeIdx: v => Number.isInteger(v) && v >= 0 && v < 7, fieldType: v => ['maior', 'menor', 'harm', 'mel'].includes(v), fieldSize: v => [3, 4].includes(v), chordType: v => typeof v === 'string', inst: v => v in core.INSTRUMENTS, bpm: v => Number.isInteger(v) && v >= 40 && v <= 240 };
  const SECTIONS = ['hoje', 'tom', 'esc', 'mod', 'campo', 'acd', 'int', 'prog', 'glos', 'vocal', 'prova', 'plano'];
  core.go = (sec, preset = {}) => {
    const mus = core.mus(); if (!mus || !SECTIONS.includes(sec)) return;
    const S = mus.S;
    if (preset.scaleId && !mus.scales().some(s => s.id === preset.scaleId)) delete preset.scaleId;
    for (const [k, ok] of Object.entries(ENGINE_KEYS)) if (k in preset && ok(preset[k])) S[k] = preset[k];
    if ('chordType' in preset) S.chordPc = null;
    if (preset.inst || preset.dock) S.dock = true;
    document.body.classList.toggle('nodock', !S.dock);
    for (const mod of Object.values(X)) if (mod && typeof mod.preset === 'function') mod.preset(sec, preset);
    core.stopAll();
    S.sec = sec;
    mus.setKey(S.pc, S.ktype);
    window.dispatchEvent(new Event('music:dock'));
    requestAnimationFrame(() => {
      if (preset.dock || preset.inst) $('#dock')?.scrollIntoView({ block: 'start' });
      if (preset.ear) $('.ear')?.scrollIntoView({ block: 'start' });
      if (preset.metro) $('#transport-metro')?.click();
    });
  };
  document.addEventListener('click', event => {
    const b = event.target.closest('[data-go]');
    if (!b) return;
    let preset = {};
    try { preset = b.dataset.goPreset ? JSON.parse(b.dataset.goPreset) : {}; } catch {}
    core.unlock();
    core.go(b.dataset.go, preset);
    document.body.classList.remove('menu-open');
  });
  window.addEventListener('music:stop', () => core.stopTones());
  /* Utilitário de interface: grupo de opções (radio) com botões grandes para toque. */
  core.options = (name, opts, selected, cls = '') => `<div class="ext-options ${cls}" role="radiogroup">${opts.map(([v, label, sub]) => `<button type="button" role="radio" aria-checked="${String(selected === v)}" class="ext-opt${selected === v ? ' on' : ''}" data-opt="${core.esc(name)}" data-optv="${core.esc(v)}"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</button>`).join('')}</div>`;
  core.levelTag = lvl => `<span class="lvl lvl-${lvl}">${core.LEVELS[lvl]}</span>`;
})();
