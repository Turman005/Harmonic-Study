/* Módulo Canto: técnica, biblioteca de aquecimentos, rotinas e modelo de demonstração
   (piano-roll animado, guia sonoro com o sintetizador do motor, respiração animada e microfone opcional). */
(() => {
  'use strict';
  const X = window.__musExt = window.__musExt || {};
  const C = X.core, D = X.vocalData;
  const { esc, $, $$ } = C;
  const KEY = 'estudoMusicalVocal';
  const defaults = { tab: 'exercicios', cat: 'todos', ex: 'lip-trill', voice: 'media', low: 57, high: 74, bpm: {}, start: {}, reps: 8, dir: 'sobe-desce', loop: false, cue: true, scores: {}, routine: null, rotLevel: 0, rotMin: 10 };
  const st = Object.assign({}, defaults, C.load(KEY, {}));
  if (!D.byId(st.ex)) st.ex = defaults.ex;
  if (!(st.voice in D.VOICES) && st.voice !== 'prova') st.voice = 'media';
  st.low = C.clamp(Number(st.low) || 57, 36, 84); st.high = C.clamp(Number(st.high) || 74, st.low + 7, 96);
  const save = () => C.save(KEY, st);
  const NIVEL = ['Iniciante', 'Básico', 'Intermediário', 'Avançado'];
  const span = ex => { const p = ex.tipo === 'glide' ? ex.segs.flatMap(s => [s[0], s[1]]) : ex.pattern; return [Math.min(...p), Math.max(...p)]; };
  const exBpm = ex => st.bpm[ex.id] || ex.bpm || 90;
  const exStart = ex => {
    const [lo, hi] = span(ex), def = (ex.dir || st.dir) === 'desce' ? st.high - hi - 2 : st.low - lo + 2;
    const s = st.start[ex.id] ?? def;
    return C.clamp(s, st.low - lo, Math.max(st.low - lo, st.high - hi));
  };

  /* Linha do tempo de um exercício transposto por semitons dentro dos limites da voz. */
  function timeline(ex, cfg) {
    const beat = 60 / cfg.bpm, [lo, hi] = span(ex), events = [], blocks = [];
    const dir = ex.dir || cfg.dir, roots = [];
    const fits = r => r + lo >= cfg.low && r + hi <= cfg.high;
    let r = cfg.start;
    const step = dir === 'desce' ? -1 : 1;
    while (roots.length < cfg.reps && (fits(r) || roots.length === 0)) { roots.push(r); r += step; if (!fits(r)) break; }
    if (dir === 'sobe-desce') for (let i = roots.length - 2; i >= 0; i--) roots.push(roots[i]);
    let t = 0;
    roots.forEach((root, k) => {
      const b = { root, t0: t, k };
      if (cfg.cue) { events.push({ kind: 'cue', t, d: beat, midis: [root, root + 4, root + 7], root }); t += 2 * beat; }
      if (ex.tipo === 'glide') ex.segs.forEach(([a, z, beats]) => { events.push({ kind: 'glide', t, d: beats * beat, from: root + a, to: root + z, syl: ex.syl, k }); t += beats * beat; });
      else ex.pattern.forEach((p, i) => {
        const syl = Array.isArray(ex.syl) ? ex.syl[i] : ex.syl;
        events.push({ kind: ex.tipo === 'sustain' ? 'sustain' : 'note', t, d: ex.dur[i] * beat, midi: root + p, syl, artic: ex.artic || 1, k });
        t += ex.dur[i] * beat;
      });
      t += beat;
      b.t1 = t; blocks.push(b);
    });
    let min = Infinity, max = -Infinity;
    events.forEach(e => { const ms = e.kind === 'cue' ? [e.root] : e.kind === 'glide' ? [e.from, e.to] : [e.midi]; ms.forEach(m => { min = Math.min(min, m); max = Math.max(max, m); }); });
    return { events, blocks, roots, total: t, min, max, beat };
  }

  /* ---------- Player do modelo de demonstração ---------- */
  class Player {
    constructor(ex) { this.ex = ex; this.playing = false; this.hist = []; this.stats = {}; this.raf = 0; this.timer = 0; this.build(); }
    build() { this.tl = timeline(this.ex, { bpm: exBpm(this.ex), start: exStart(this.ex), low: st.low, high: st.high, reps: st.reps, dir: st.dir, cue: st.cue }); }
    bind() {
      this.canvas = $('#vx-canvas');
      if (this.canvas) { this.g = this.canvas.getContext('2d'); this.resize(); }
      this.draw(this.playing ? this.now() : -0.0001);
    }
    resize() {
      if (!this.canvas) return;
      const w = this.canvas.clientWidth || 600, h = this.canvas.clientHeight || 220, dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr); this.w = w; this.h = h;
      this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    now() { return performance.now() / 1000 - this.t0; }
    start() {
      C.unlock(); C.stopAll({ keepMic: true }); this.build();
      const beat = this.tl.beat, count = 3;
      this.t0 = performance.now() / 1000 + count * beat + .15;
      for (let i = 0; i < count; i++) C.click(.15 + i * beat, i === 0);
      this.scheduled = new Set(); this.playing = true; this.started = performance.now() / 1000; this.hist = []; this.stats = {}; this.done = false;
      this.timer = setInterval(() => this.tick(), 40);
      const loop = () => { if (!this.playing) return; this.draw(this.now()); this.info(); this.raf = requestAnimationFrame(loop); };
      this.raf = requestAnimationFrame(loop);
      document.body.classList.add('vx-playing');
      C.setFocus(`Canto · ${this.ex.nome}`);
      updateButtons();
    }
    tick() {
      const now = this.now(), tl = this.tl;
      tl.events.forEach((e, i) => {
        if (this.scheduled.has(i) || e.t > now + .3 || e.t + e.d < now) return;
        this.scheduled.add(i);
        const delay = e.t - now;
        if (e.kind === 'cue') C.chord(e.midis, delay, e.d * 1.2);
        else if (e.kind === 'note') C.note(e.midi, delay, Math.max(.12, e.d * e.artic * .95), .75);
        else if (e.kind === 'glide') C.tone({ midi: e.from, to: e.to, delay, dur: e.d, vel: .9 });
        else if (e.kind === 'sustain') { C.note(e.midi, delay, .6, .6); C.tone({ midi: e.midi, delay, dur: e.d, vel: 1, shape: 'messa' }); }
      });
      const limit = st.routine ? st.routine.limit : 0, elapsed = performance.now() / 1000 - this.started;
      if (now > tl.total) {
        if ((st.loop || limit) && !(limit && elapsed >= limit)) { this.t0 += tl.total; this.scheduled = new Set(); }
        else this.finish(true);
      }
    }
    stop() {
      if (!this.playing) return;
      this.playing = false; clearInterval(this.timer); cancelAnimationFrame(this.raf);
      document.body.classList.remove('vx-playing');
      this.draw(this.now()); updateButtons();
    }
    finish(natural) {
      this.stop(); C.stopTones();
      const s = this.score();
      if (s) { const prev = st.scores[this.ex.id] || {}; st.scores[this.ex.id] = { last: s.pct, best: Math.max(prev.best || 0, s.pct), cents: s.cents, date: new Date().toISOString() }; save(); }
      const el = $('#vx-score'); if (el) el.innerHTML = s ? scoreHtml(s) : '<span class="muted">Exercício concluído. Ative o microfone para receber uma pontuação de afinação.</span>';
      $('#vx-now') && ($('#vx-now').textContent = 'Concluído ✓');
      if (natural && st.routine) setTimeout(() => { if (document.body.dataset.sec === 'vocal' && st.routine) nextRoutine(true); }, 2500);
    }
    current(now) { return this.tl.events.find(e => e.kind !== 'cue' && now >= e.t && now < e.t + e.d) || null; }
    target(e, now) { if (!e) return null; if (e.kind === 'glide') return e.from + (e.to - e.from) * ((now - e.t) / e.d); return e.midi; }
    onMic(frame) {
      if (!this.playing) return;
      const now = this.now();
      if (frame.voiced) this.hist.push({ t: now, m: frame.midiF }); else this.hist.push({ t: now, m: null });
      while (this.hist.length && this.hist[0].t < now - 8) this.hist.shift();
      const e = this.current(now), tgt = this.target(e, now), live = $('#vx-live');
      if (e && now > e.t + .12 && now < e.t + e.d - .05) {
        const key = this.tl.events.indexOf(e), s = this.stats[key] || (this.stats[key] = { n: 0, voiced: 0, ok: 0, abs: 0 });
        s.n++;
        if (frame.voiced) { const c = X.pitch.centsTo(frame.midiF, tgt); s.voiced++; s.abs += Math.abs(c); if (Math.abs(c) <= 50) s.ok++; }
      }
      if (live) {
        if (!frame.voiced) live.innerHTML = '<span class="muted">Microfone ativo · cante para ver sua linha de afinação</span>';
        else {
          const c = tgt != null ? Math.round(X.pitch.centsTo(frame.midiF, tgt)) : null;
          live.innerHTML = `Você: <b>${C.noteName(frame.midi)}</b> ${frame.cents >= 0 ? '+' : ''}${frame.cents} cents${c != null ? ` · alvo ${C.noteName(Math.round(tgt))}: <b class="${Math.abs(c) <= 25 ? 'good' : Math.abs(c) <= 50 ? 'warn' : 'bad'}">${c >= 0 ? '+' : ''}${c} cents</b>` : ''}`;
        }
      }
    }
    score() {
      const all = Object.values(this.stats); if (!all.length) return null;
      const n = all.reduce((a, s) => a + s.n, 0), v = all.reduce((a, s) => a + s.voiced, 0), ok = all.reduce((a, s) => a + s.ok, 0), abs = all.reduce((a, s) => a + s.abs, 0);
      if (!v) return { pct: 0, cents: null, coverage: 0 };
      return { pct: Math.round(100 * ok / v), cents: Math.round(abs / v), coverage: Math.round(100 * v / n) };
    }
    info() {
      const now = this.now(), tl = this.tl, e = this.current(now), el = $('#vx-now'), sy = $('#vx-syl'), key = $('#vx-key');
      const blk = tl.blocks.find(b => now >= b.t0 && now < b.t1) || (now < 0 ? tl.blocks[0] : tl.blocks[tl.blocks.length - 1]);
      if (sy) sy.textContent = now < 0 ? String(Math.ceil(-now / tl.beat)) : e ? e.syl : 'respire';
      if (el) el.textContent = now < 0 ? 'Prepare-se…' : e ? `Alvo: ${C.noteName(Math.round(this.target(e, now)))}` : 'Pausa para respirar';
      if (key && blk) {
        let txt = `Tom: ${C.noteName(blk.root)} · ${blk.k + 1}/${tl.blocks.length}`;
        if (st.routine) { const el2 = performance.now() / 1000 - this.started; txt += ` · ${fmt(el2)} de ${fmt(st.routine.limit)}`; }
        key.textContent = txt;
      }
    }
    draw(now) {
      const g = this.g; if (!g) return;
      const W = this.w, H = this.h, tl = this.tl, gut = 46, win = W < 500 ? 4.5 : 6.5, pps = (W - gut) / win, ph = gut + (W - gut) * .26;
      const lo = tl.min - 2, hi = Math.max(tl.max + 2, lo + 12), rows = hi - lo + 1, top = 8, rh = (H - 16) / rows;
      const y = m => top + (hi - m) * rh + rh / 2, x = t => ph + (t - now) * pps;
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#fcfdfb'; g.fillRect(0, 0, W, H);
      for (let m = lo; m <= hi; m++) {
        const pc = ((m % 12) + 12) % 12;
        if ([1, 3, 6, 8, 10].includes(pc)) { g.fillStyle = '#f2f5f0'; g.fillRect(gut, y(m) - rh / 2, W - gut, rh); }
        if (pc === 0) { g.strokeStyle = '#dfe7dc'; g.beginPath(); g.moveTo(gut, y(m) + rh / 2); g.lineTo(W, y(m) + rh / 2); g.stroke(); }
        if (pc === 0 || (rh >= 11 && ![1, 3, 6, 8, 10].includes(pc))) { g.fillStyle = pc === 0 ? '#4f6a48' : '#8b998b'; g.font = `${pc === 0 ? 600 : 400} ${Math.min(11, rh + 2)}px system-ui,sans-serif`; g.textBaseline = 'middle'; g.fillText(C.noteName(m, 'cifra'), 6, y(m)); }
      }
      g.fillStyle = '#e2e7e9'; g.fillRect(gut - 1, 0, 1, H);
      const cur = this.current(now);
      tl.events.forEach(e => {
        if (e.t > now + win || e.t + e.d < now - win) return;
        const x0 = x(e.t), past = e.t + e.d < now, active = e === cur;
        if (e.kind === 'cue') {
          g.fillStyle = past ? '#efe4d2' : '#dcaa67';
          e.midis.forEach(m => { if (m <= hi && m >= lo) { g.beginPath(); g.arc(x0 + 4, y(m), Math.max(2.5, rh * .3), 0, 7); g.fill(); } });
          g.font = '10px system-ui,sans-serif'; g.fillStyle = '#b88b53'; g.textBaseline = 'alphabetic'; g.fillText('piano', x0 - 6, H - 5);
          return;
        }
        const color = active ? '#367454' : past ? '#d5e1d7' : '#9fc0a6';
        if (e.kind === 'glide') {
          g.strokeStyle = color; g.lineWidth = Math.max(5, rh * .7); g.lineCap = 'round';
          g.beginPath(); g.moveTo(x0, y(e.from)); g.lineTo(x(e.t + e.d), y(e.to)); g.stroke(); g.lineWidth = 1;
          if (!past) { g.fillStyle = active ? '#fff' : '#3d5745'; g.font = '600 11px system-ui,sans-serif'; g.fillText(e.syl, x0 + 6, y(e.from) - rh); }
          return;
        }
        const x1 = x(e.t + e.d * (e.artic || 1)) - 2, hgt = Math.max(7, rh * .78), yy = y(e.midi) - hgt / 2;
        g.fillStyle = color;
        if (e.kind === 'sustain') {
          g.beginPath();
          for (let i = 0; i <= 20; i++) { const f = i / 20, th = hgt * (.35 + .9 * Math.sin(Math.PI * f)); g.lineTo(x0 + (x1 - x0) * f, y(e.midi) - th / 2); }
          for (let i = 20; i >= 0; i--) { const f = i / 20, th = hgt * (.35 + .9 * Math.sin(Math.PI * f)); g.lineTo(x0 + (x1 - x0) * f, y(e.midi) + th / 2); }
          g.fill();
        } else { roundRect(g, x0, yy, Math.max(4, x1 - x0), hgt, Math.min(5, hgt / 2)); g.fill(); }
        if (x1 - x0 > 18) { g.fillStyle = active ? '#fff' : past ? '#9aab9d' : '#24432f'; g.font = `600 ${Math.min(11, hgt)}px system-ui,sans-serif`; g.textBaseline = 'middle'; g.fillText(e.syl, x0 + 4, y(e.midi)); }
      });
      /* Linha da voz captada pelo microfone. */
      if (this.hist.length > 1) {
        g.strokeStyle = '#8b6fc0'; g.lineWidth = 2.5; g.lineJoin = 'round'; g.beginPath(); let pen = false;
        this.hist.forEach(p => {
          if (p.m == null) { pen = false; return; }
          let m = p.m, tgt = this.target(this.current(p.t), p.t);
          if (tgt != null) { const c = X.pitch.centsTo(m, tgt); m = tgt + c / 100; }
          const px = x(p.t), py = y(C.clamp(m, lo, hi));
          pen ? g.lineTo(px, py) : g.moveTo(px, py); pen = true;
        });
        g.stroke(); g.lineWidth = 1;
      }
      g.fillStyle = '#dcaa67'; g.fillRect(ph - 1, 0, 2, H);
      if (now < 0 && this.playing) {
        g.fillStyle = '#ffffffcc'; g.fillRect(gut, 0, W - gut, H);
        g.fillStyle = '#367454'; g.font = '700 54px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(Math.ceil(-now / tl.beat)), gut + (W - gut) / 2, H / 2); g.textAlign = 'left';
      }
      this.frame = (this.frame || 0) + 1;
      if (this.canvas) this.canvas.dataset.frame = this.frame;
    }
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const scoreHtml = s => `<div class="vx-scorecard"><b>${s.pct}%</b><span>das amostras afinadas dentro de ±50 cents${s.cents != null ? ` · desvio médio ${s.cents} cents` : ''} · voz detectada em ${s.coverage}% do tempo</span></div>`;

  /* ---------- Respiração animada ---------- */
  class Breath {
    constructor(ex) { this.ex = ex; this.playing = false; }
    bind() { this.circle = $('#br-circle'); this.ring = $('#br-ring'); this.label = $('#br-label'); this.count = $('#br-count'); this.cyc = $('#br-cycle'); this.paint(0, null, 0); }
    total() { return this.ex.fases.reduce((a, f) => a + f[1], 0); }
    start() {
      C.unlock(); C.stopAll({ keepMic: true });
      this.playing = true; this.t0 = performance.now() / 1000 + 3; this.started = performance.now() / 1000; this.lastPhase = -1;
      [0, 1, 2].forEach(i => C.click(i, i === 0));
      document.body.classList.add('vx-playing'); C.setFocus(`Canto · ${this.ex.nome}`); updateButtons();
      const loop = () => {
        if (!this.playing) return;
        const t = performance.now() / 1000 - this.t0, cycleLen = this.total();
        const limit = st.routine ? st.routine.limit : 0, cycles = limit ? Math.max(1, Math.round(limit / cycleLen)) : this.ex.ciclos;
        if (t < 0) { this.paint(0, ['prep', 3, 'Prepare-se'], -t); }
        else {
          const c = Math.floor(t / cycleLen);
          if (c >= cycles) { this.finish(); return; }
          let u = t - c * cycleLen, idx = 0;
          while (u >= this.ex.fases[idx][1]) { u -= this.ex.fases[idx][1]; idx++; }
          const ph = this.ex.fases[idx];
          if (idx !== this.lastPhase) { this.lastPhase = idx; C.click(0, idx === 0); }
          if (ph[0] === 'pulse') { const per = ph[1] / ph[3], k = Math.floor(u / per); if (k !== this.lastPulse) { this.lastPulse = k; if (k > 0) C.click(0, false); } }
          this.paint(u / ph[1], ph, ph[1] - u, c + 1, cycles);
        }
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }
    paint(f, ph, left, cyc, cycles) {
      if (!this.circle) return;
      const kind = ph ? ph[0] : 'idle', ease = v => .5 - Math.cos(Math.PI * v) / 2;
      let s = .55;
      if (kind === 'in') s = .55 + .45 * ease(f);
      else if (kind === 'hold') s = 1;
      else if (kind === 'out') s = 1 - .45 * ease(f);
      else if (kind === 'pulse') { const n = ph[3], p = (f * n) % 1; s = .85 - .05 * Math.floor(f * n) / n - .08 * Math.max(0, 1 - p * 4); }
      this.circle.setAttribute('r', String(Math.round(95 * s * 10) / 10));
      this.circle.setAttribute('class', `br-c br-${kind}`);
      this.ring.style.strokeDashoffset = String(Math.round(678 * (1 - f)));
      this.label.textContent = ph ? ph[2] : 'Toque em Iniciar';
      this.count.textContent = ph ? String(Math.max(1, Math.ceil(left))) : '';
      if (this.cyc) this.cyc.textContent = cyc ? `Ciclo ${cyc} de ${cycles}` : `${this.ex.ciclos} ciclos · ${this.ex.fases.map(p => `${p[2]} ${p[1]} s`).join(' · ')}`;
      $('#br-svg')?.setAttribute('data-phase', kind);
    }
    stop() { if (!this.playing) return; this.playing = false; cancelAnimationFrame(this.raf); document.body.classList.remove('vx-playing'); updateButtons(); }
    finish() { this.stop(); this.paint(0, ['done', 0, 'Concluído ✓'], 0); if (this.count) this.count.textContent = ''; if (st.routine) setTimeout(() => { if (document.body.dataset.sec === 'vocal' && st.routine) nextRoutine(true); }, 2500); }
  }

  let player = null, micOff = null;
  function updateButtons() {
    const on = !!player?.playing;
    $$('[data-vact="play"]').forEach(b => { b.innerHTML = on ? '↺ Recomeçar' : '▶ Demonstrar'; });
    const mic = $('[data-vact="mic"]'); if (mic) { mic.classList.toggle('on', !!X.mic?.active); mic.setAttribute('aria-pressed', String(!!X.mic?.active)); mic.innerHTML = X.mic?.active ? '🎤 Microfone ativo · desligar' : '🎤 Praticar com microfone'; }
  }
  async function toggleMic() {
    const msg = $('#vx-micmsg');
    if (X.mic.active) { X.mic.stop(); micOff?.(); updateButtons(); if (msg) msg.textContent = 'Microfone desligado.'; return; }
    try {
      C.unlock();
      await X.mic.start(C.ctx());
      micOff?.(); micOff = X.mic.on(f => player?.onMic && player.onMic(f));
      if (msg) msg.textContent = 'Microfone ativo. Use fones de ouvido para o guia não interferir na detecção. O áudio não é gravado nem enviado.';
    } catch (err) {
      if (msg) msg.innerHTML = `<span class="warn">${esc(X.pitch.Mic.explain(err))}</span> O exercício continua com guia sonoro e animação.`;
    }
    updateButtons();
  }
  window.addEventListener('music:stop', () => { player?.stop(); });
  window.addEventListener('resize', () => { if (player instanceof Player && player.canvas) { player.resize(); player.draw(player.playing ? player.now() : -1e-4); } });

  /* ---------- Rotinas ---------- */
  function startRoutine(level, min) {
    const list = D.ROT[level][min];
    st.routine = { level, min, idx: 0, limit: list[0][1] * 60 };
    st.ex = list[0][0]; st.tab = 'exercicios'; save();
  }
  function nextRoutine(autoStart, delta = 1) {
    const ro = st.routine; if (!ro) return;
    const list = D.ROT[ro.level][ro.min];
    ro.idx += delta;
    if (ro.idx >= list.length || ro.idx < 0) { st.routine = null; save(); C.toast(ro.idx < 0 ? 'Rotina reiniciada.' : 'Rotina concluída! Bom trabalho. Hidrate-se e descanse a voz.'); window.__mus.render(); X.plano?.logActivity?.('vocal'); return; }
    ro.limit = list[ro.idx][1] * 60; st.ex = list[ro.idx][0]; save();
    window.__mus.render();
    if (autoStart) requestAnimationFrame(() => player?.start());
  }

  /* ---------- Renderização ---------- */
  const tabs = [['exercicios', 'Exercícios e demonstração'], ['rotinas', 'Rotinas prontas'], ['tecnica', 'Técnica vocal'], ['saude', 'Saúde vocal']];
  const noteOpts = (from, to, sel) => { let h = ''; for (let m = from; m <= to; m++) h += `<option value="${m}"${m === sel ? ' selected' : ''}>${C.noteName(m)}</option>`; return h; };
  function voiceBar() {
    const prova = X.prova?.latest?.('vocal');
    const opts = Object.entries(D.VOICES).map(([k, v]) => `<option value="${k}"${st.voice === k ? ' selected' : ''}>${v[0]} (${C.noteName(v[1], 'cifra')}–${C.noteName(v[2], 'cifra')})</option>`).join('') + (prova?.vocal?.low ? `<option value="prova"${st.voice === 'prova' ? ' selected' : ''}>Minha prova (${C.noteName(prova.vocal.low, 'cifra')}–${C.noteName(prova.vocal.high, 'cifra')})</option>` : '');
    return `<div class="card vx-voice"><div class="row"><label class="vx-field">Sua voz<select id="vx-voice">${opts}</select></label><label class="vx-field">Limite grave<select id="vx-low">${noteOpts(36, 79, st.low)}</select></label><label class="vx-field">Limite agudo<select id="vx-high">${noteOpts(45, 91, st.high)}</select></label></div><p class="muted">Os exercícios são transpostos meio tom por vez dentro destes limites. Escolha uma região confortável; não force os extremos.${prova ? '' : ' Faça a <button class="text-button" data-go="prova" data-go-preset=\'{"track":"vocal"}\'>prova vocal</button> para sugerir sua região.'}</p></div>`;
  }
  function render() {
    const tabBar = `<div class="ext-tabs seg" role="tablist" aria-label="Partes do módulo de canto">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${st.tab === k}" class="${st.tab === k ? 'on' : ''}" data-vtab="${k}">${l}</button>`).join('')}</div>`;
    let body = '';
    if (st.tab === 'exercicios') body = voiceBar() + demoCard() + library();
    else if (st.tab === 'rotinas') body = routines();
    else if (st.tab === 'tecnica') body = tecnica();
    else body = saude();
    return `<div class="ext vocal">${tabBar}${body}<p class="ext-disclaimer">Conteúdo educativo. Não substitui a orientação de professor de canto, fonoaudiólogo ou médico. Se sentir dor, pare.</p></div>`;
  }
  function demoCard() {
    const ex = D.byId(st.ex), breath = ex.tipo === 'breath', ro = st.routine;
    const list = ro ? D.ROT[ro.level][ro.min] : null;
    const banner = ro ? `<div class="vx-routine"><div><span class="eyebrow">ROTINA ${ro.min} MIN · ${NIVEL[ro.level].toUpperCase()}</span><b>Passo ${ro.idx + 1} de ${list.length}</b> · ${list[ro.idx][1]} min</div><ol>${list.map(([id, m], i) => `<li class="${i === ro.idx ? 'now' : i < ro.idx ? 'done' : ''}">${esc(D.byId(id).nome)} <small>${m} min</small></li>`).join('')}</ol><div class="row"><button class="pill" data-vact="prev">← Anterior</button><button class="pill" data-vact="next">Próximo →</button><button class="pill" data-vact="exit">Sair da rotina</button></div></div>` : '';
    const sc = st.scores[ex.id];
    const head = `<div class="vx-head"><div><span class="eyebrow">MODELO DE DEMONSTRAÇÃO · ${esc(D.CATS[ex.cat]).toUpperCase()}</span><h2>${esc(ex.nome)}</h2><p>${esc(ex.objetivo)}</p></div><span class="lvl lvl-${ex.nivel}">${NIVEL[ex.nivel]}</span></div>`;
    if (breath) return `<section class="card vx-demo" id="vx-demo" aria-label="Demonstração do exercício">${banner}${head}
      <div class="br-wrap"><svg id="br-svg" viewBox="0 0 240 240" role="img" aria-label="Animação de respiração"><circle cx="120" cy="120" r="108" class="br-track"/><circle id="br-ring" cx="120" cy="120" r="108" class="br-ring" transform="rotate(-90 120 120)"/><circle id="br-circle" cx="120" cy="120" r="52" class="br-c"/><path d="M84 92q36-26 72 0M80 112q40-26 80 0M84 132q36-24 72 0" class="br-ribs"/><text id="br-count" x="120" y="128" text-anchor="middle" class="br-count"></text></svg>
      <div class="br-side"><p id="br-label" class="br-label" aria-live="polite">Toque em Iniciar</p><p id="br-cycle" class="muted"></p><div class="row"><button class="primary-button" data-vact="play">▶ Demonstrar</button><button class="soft-button" data-vact="stop">■ Parar</button></div></div></div>
      ${howTo(ex)}</section>`;
    const s0 = exStart(ex), [lo, hi] = span(ex);
    return `<section class="card vx-demo" id="vx-demo" aria-label="Demonstração do exercício">${banner}${head}
      <div class="vx-stage"><canvas id="vx-canvas" aria-label="Piano-roll com as notas-alvo do exercício" role="img"></canvas><div class="vx-overlay"><span id="vx-syl" class="vx-syl">${esc(Array.isArray(ex.syl) ? ex.syl[0] : ex.syl)}</span><span id="vx-now">Pronto · toque em Demonstrar</span><span id="vx-key" class="muted"></span></div></div>
      <div id="vx-live" class="vx-live" aria-live="polite"></div>
      <div class="row vx-actions"><button class="primary-button" data-vact="play">▶ Demonstrar</button><button class="soft-button" data-vact="stop">■ Parar</button><button class="soft-button" data-vact="mic" aria-pressed="false">🎤 Praticar com microfone</button></div>
      <p id="vx-micmsg" class="muted vx-micmsg">Sem microfone, siga a animação e o guia do piano. Com microfone (HTTPS ou localhost), sua linha de afinação aparece sobre as notas.</p>
      <div class="vx-controls">
        <label class="vx-field">Andamento <span><input id="vx-bpm" type="range" min="40" max="150" step="2" value="${exBpm(ex)}" aria-label="Andamento em BPM"> <b id="vx-bpmv">${exBpm(ex)}</b> BPM</span></label>
        <label class="vx-field">Nota inicial<select id="vx-start">${noteOpts(st.low - lo, Math.max(st.low - lo, st.high - hi), s0)}</select></label>
        <div class="vx-field"><span>Transpor</span><span class="seg"><button data-vact="down" aria-label="Meio tom abaixo">− ½ tom</button><button data-vact="up" aria-label="Meio tom acima">+ ½ tom</button></span></div>
        <label class="vx-field">Tonalidades<select id="vx-reps">${[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24].map(n => `<option${n === st.reps ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="vx-field"><span>Direção</span><span class="seg">${[['sobe', 'Sobe'], ['desce', 'Desce'], ['sobe-desce', 'Sobe e desce']].map(([v, l]) => `<button data-vdir="${v}" class="${(ex.dir || st.dir) === v ? 'on' : ''}"${ex.dir ? ' disabled' : ''}>${l}</button>`).join('')}</span></div>
        <div class="vx-field"><span>Opções</span><span class="seg"><button data-vact="loop" class="${st.loop ? 'on' : ''}" aria-pressed="${st.loop}">↻ Loop</button><button data-vact="cue" class="${st.cue ? 'on' : ''}" aria-pressed="${st.cue}">♫ Acorde guia</button></span></div>
      </div>
      <div id="vx-score">${sc ? `<span class="muted">Última pontuação: ${sc.last}% · melhor: ${sc.best}%</span>` : ''}</div>
      ${howTo(ex)}</section>`;
  }
  const howTo = ex => `<details class="theory vx-how" open><summary>Como fazer</summary><ol>${ex.passos.map(p => `<li>${esc(p)}</li>`).join('')}</ol><p><b>Duração:</b> ${esc(ex.duracao)}</p><p><b>Erros comuns:</b></p><ul>${ex.erros.map(p => `<li>${esc(p)}</li>`).join('')}</ul></details>`;
  function library() {
    const cats = [['todos', 'Todos'], ...Object.entries(D.CATS)];
    const list = D.EX.filter(e => st.cat === 'todos' || e.cat === st.cat);
    return `<section class="card vx-lib" aria-labelledby="vx-lib-t"><h2 id="vx-lib-t">Biblioteca de aquecimentos e exercícios</h2><p class="muted">Cada exercício tem objetivo, passo a passo, duração, erros comuns e nível. Toque em “Demonstrar” para ver e ouvir o modelo.</p>
      <div class="ext-chips">${cats.map(([k, l]) => `<button class="pill${st.cat === k ? ' on' : ''}" data-vcat="${k}">${esc(l)}</button>`).join('')}</div>
      <div class="vx-grid">${list.map(e => `<article class="vx-card${e.id === st.ex ? ' on' : ''}"><div class="vx-card-top"><span class="eyebrow">${esc(D.CATS[e.cat])}</span><span class="lvl lvl-${e.nivel}">${NIVEL[e.nivel]}</span></div><h3>${esc(e.nome)}</h3><p>${esc(e.objetivo)}</p><p class="muted">${esc(e.duracao)}</p><button class="soft-button" data-vex="${e.id}">▶ Demonstrar</button></article>`).join('')}</div></section>`;
  }
  function routines() {
    const lv = st.rotLevel;
    return `<section class="card"><h2>Rotinas de aquecimento prontas</h2><p class="muted">Sequências progressivas: respiração → SOVT → sirenes → vocalizes → desaquecimento. Escolha seu nível e o tempo disponível. Cada passo abre o modelo de demonstração e avança sozinho.</p>
      <div class="ext-chips">${NIVEL.map((n, i) => `<button class="pill${lv === i ? ' on' : ''}" data-vrl="${i}">${n}</button>`).join('')}</div>
      <div class="vx-rot">${[5, 10, 20].map(min => `<article class="vx-card"><span class="eyebrow">${NIVEL[lv].toUpperCase()}</span><h3>${min} minutos</h3><ol>${D.ROT[lv][min].map(([id, m]) => `<li>${esc(D.byId(id).nome)} <small>${m} min</small></li>`).join('')}</ol><button class="primary-button" data-vrot="${lv}:${min}">▶ Iniciar rotina de ${min} min</button></article>`).join('')}</div>
      <p class="muted">Dica: use a rotina de 5 minutos antes de ensaios curtos e a de 20 minutos em dias de estudo técnico. Termine sempre com o desaquecimento.</p></section>`;
  }
  const T = (title, html, open) => `<details class="theory vx-topic"${open ? ' open' : ''}><summary>${title}</summary>${html}</details>`;
  function tecnica() {
    return `<section class="card"><h2>Técnica vocal essencial</h2><p class="muted">Resumo prático dos fundamentos. Toque em cada tema e experimente o exercício indicado.</p>
    ${T('Respiração costo-diafragmática e apoio', `<p>Na inspiração o diafragma desce e as costelas inferiores se expandem para os lados e para trás; o abdômen se projeta levemente. Ombros e peito alto permanecem estáveis.</p><p><b>Apoio</b> é o equilíbrio entre a musculatura que inspira e a que expira, dosando a pressão de ar sob as pregas vocais: mantenha a sensação de costelas abertas enquanto canta, sem empurrar ar e sem endurecer o abdômen.</p><p><button class="pill" data-vex="resp-446">▶ Respiração 4·4·8</button> <button class="pill" data-vex="resp-pulsos">▶ Pulsos “ts”</button></p>`, true)}
    ${T('Postura', '<ul><li>Pés na largura do quadril, joelhos destravados, peso distribuído.</li><li>Coluna alongada, ombros soltos, cabeça equilibrada: queixo paralelo ao chão, sem projetar para a frente nem levantar nos agudos.</li><li>Sentado: na metade da frente da cadeira, pés apoiados, tronco ereto.</li></ul>')}
    ${T('Fonação e ataque vocal', '<ul><li><b>Equilibrado:</b> ar e fechamento das pregas começam juntos; som limpo. É o objetivo no dia a dia.</li><li><b>Soproso (aspirado):</b> o ar sai antes do fechamento (“h” antes da vogal). Som com ar e menos eficiente.</li><li><b>Brusco (golpe de glote):</b> as pregas fecham com força antes do ar, com um estalo. Use apenas como recurso expressivo pontual.</li></ul><p><button class="pill" data-vex="staccato">▶ Staccato leve</button></p>')}
    ${T('Registros: peito, misto, cabeça e falsete', '<ul><li><b>Peito:</b> ajuste com pregas mais espessas, som encorpado, próximo da fala; predomina nos graves.</li><li><b>Voz mista (mix):</b> coordenação que equilibra os ajustes de peito e de cabeça na região de transição; permite agudos com corpo, sem gritar.</li><li><b>Cabeça:</b> pregas mais alongadas e finas, som mais leve; predomina nos agudos.</li><li><b>Falsete:</b> ajuste leve com fechamento incompleto das pregas, som mais soproso; comum como recurso em vozes masculinas.</li></ul><p class="muted">Os nomes variam entre escolas (também se fala em mecanismos M1 e M2). O importante é a transição suave entre eles.</p>')}
    ${T('Passagem (passaggio)', '<p>Região em que o ajuste vocal muda. Sem coordenação, aparece a “quebra”. Valores aproximados: tenores por volta de Ré4–Sol4, barítonos Si3–Mi4; vozes femininas costumam ter transições perto de Mi4–Fá♯4 e de Dó5–Fá♯5. Varia de pessoa para pessoa.</p><p>Como trabalhar: SOVT, sirenes, menos volume ao subir (“mais leve, não mais forte”), vogais mais fechadas (u, ô) e pequenas modificações de vogal.</p><p><button class="pill" data-vex="sirene-oitava">▶ Sirene de oitava</button> <button class="pill" data-vex="canudo">▶ Canudo</button></p>')}
    ${T('Ressonância e colocação', '<p>O som gerado nas pregas é amplificado e filtrado pelo trato vocal (faringe, boca e nariz). “Colocação na máscara” é uma <i>sensação</i> útil (vibração nos lábios e no nariz, como no humming), não um lugar físico para onde o som vai.</p><ul><li>Espaço interno: palato mole elevado, como no início de um bocejo.</li><li>Laringe estável: não force para baixo nem deixe subir muito nos agudos.</li></ul><p><button class="pill" data-vex="humming">▶ Humming</button></p>')}
    ${T('Articulação e dicção', '<ul><li>Mandíbula solta; ponta da língua atrás dos dentes inferiores nas vogais.</li><li>Vogais puras e sustentadas; consoantes rápidas e precisas, sem interromper o fluxo de ar.</li><li>Em português, sustente a vogal principal dos ditongos e das nasais (ã, õ, ão) e articule o final no último instante.</li></ul><p><button class="pill" data-vex="vogais">▶ Vogais</button> <button class="pill" data-vex="consoantes">▶ pa-ta-ka</button></p>')}
    ${T('Afinação', '<p>Depende de ouvir, memorizar a altura e coordenar a voz. Treine com referência (piano), grave-se e use o modo microfone. Desvios de até 10–20 cents costumam passar despercebidos; perto de 50 cents a nota já soa como outra.</p><p>Cansaço, falta de apoio e volume excessivo pioram a afinação.</p><p><button class="pill" data-go="int" data-go-preset=\'{"ear":true}\'>◉ Treino de ouvido</button></p>')}
    ${T('Dinâmica (messa di voce)', '<p>Crescer e diminuir o volume numa mesma nota sem mudar afinação e qualidade. É exigente: faça poucas repetições, na região média.</p><p><button class="pill" data-vex="messa">▶ Messa di voce</button></p>')}
    ${T('Agilidade', '<p>Notas rápidas com precisão (melismas, riffs). Comece devagar com metrônomo e aumente 4 a 8 BPM apenas quando estiver limpo.</p><p><button class="pill" data-vex="agilidade">▶ Agilidade</button></p>')}
    ${T('Extensão e tessitura', '<p><b>Extensão</b> vai da nota mais grave à mais aguda que você emite. <b>Tessitura</b> é a região confortável, onde a voz soa melhor e sem esforço. Repertório e exercícios devem ficar principalmente na tessitura; ampliar a extensão é gradual (meses), sem forçar extremos.</p>')}
    ${T('Classificação vocal aproximada', `<div class="table-scroll"><table class="tbl"><tr><th>Classificação</th><th>Extensão de referência no canto</th><th>Região comum dos exercícios</th></tr>${[['Soprano', 'Dó4–Dó6', 'soprano'], ['Mezzo-soprano', 'Lá3–Lá5', 'mezzo'], ['Contralto', 'Fá3–Fá5', 'contralto'], ['Tenor', 'Dó3–Dó5', 'tenor'], ['Barítono', 'Lá2–Lá4', 'baritono'], ['Baixo', 'Mi2–Mi4', 'baixo']].map(([n, e, k]) => `<tr><td><b>${n}</b></td><td>${e}</td><td>${C.noteName(D.VOICES[k][1], 'cifra')}–${C.noteName(D.VOICES[k][2], 'cifra')}</td></tr>`).join('')}</table></div><p class="muted">A classificação é <b>aproximada</b>. Ela depende do timbre, da tessitura, das regiões de passagem e do conforto, não apenas da extensão. Vozes em desenvolvimento (adolescência) ou em fases de mudança hormonal podem variar. Um professor ou fonoaudiólogo confirma a classificação.</p>`)}
    </section>`;
  }
  function saude() {
    return `<section class="card"><h2>Saúde vocal</h2>
    <div class="grid2 ext-grid"><div><h3>Hábitos que protegem a voz</h3><ul class="ext-list"><li><b>Hidratação:</b> água ao longo do dia; a hidratação das pregas é sistêmica e leva tempo. Ambientes secos pioram.</li><li><b>Descanso:</b> sono adequado e pausas de voz após ensaios longos.</li><li><b>Aqueça e desaqueça</b> sempre, mesmo em 5 minutos.</li><li>Evite gritar, falar alto em locais ruidosos e pigarrear com força (prefira engolir ou beber água).</li><li>Fumo e excesso de álcool ressecam e irritam a mucosa; refluxo também pode afetar a voz.</li><li>Cante em volume moderado e respeite o cansaço: qualidade antes de quantidade.</li></ul></div>
    <div class="ext-alert"><h3>Sinais de alerta</h3><ul class="ext-list"><li>Dor ou ardência ao falar ou cantar.</li><li><b>Rouquidão persistente por mais de 2 semanas.</b></li><li>Perda súbita de extensão, falhas frequentes ou voz “cansada” todos os dias.</li><li>Sensação de corpo estranho, falta de ar ou sangue ao tossir.</li></ul><p><b>Nesses casos, interrompa o treino intenso e procure um médico otorrinolaringologista e um fonoaudiólogo.</b></p></div></div>
    <p class="muted">Conteúdo educativo. Não substitui avaliação profissional.</p></section>`;
  }
  function after() {
    C.setFocus(`Canto · ${D.byId(st.ex).nome}`);
    if (st.tab !== 'exercicios') { player = null; return; }
    const ex = D.byId(st.ex);
    player = ex.tipo === 'breath' ? new Breath(ex) : new Player(ex);
    requestAnimationFrame(() => player?.bind());
    updateButtons();
  }
  const rerender = () => { player?.stop(); window.__mus.render(); };
  function setVoice(v) {
    st.voice = v;
    if (v === 'prova') { const p = X.prova?.latest?.('vocal'); if (p?.vocal?.low) { st.low = p.vocal.low; st.high = Math.max(p.vocal.low + 7, p.vocal.high); } }
    else if (D.VOICES[v]) { st.low = D.VOICES[v][1]; st.high = D.VOICES[v][2]; }
    st.start = {}; save();
  }
  document.addEventListener('click', ev => {
    if (document.body.dataset.sec !== 'vocal') return;
    const b = ev.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (d.vtab) { st.tab = d.vtab; save(); rerender(); }
    else if (d.vcat) { st.cat = d.vcat; save(); rerender(); }
    else if (d.vrl) { st.rotLevel = +d.vrl; save(); rerender(); }
    else if (d.vrot) { const [l, m] = d.vrot.split(':').map(Number); startRoutine(l, m); rerender(); requestAnimationFrame(() => { $('#vx-demo')?.scrollIntoView({ block: 'start' }); player?.start(); }); }
    else if (d.vex) { st.ex = d.vex; st.tab = 'exercicios'; if (st.routine) st.routine = null; save(); rerender(); requestAnimationFrame(() => $('#vx-demo')?.scrollIntoView({ block: 'start' })); }
    else if (d.vdir) { st.dir = d.vdir; save(); rerender(); }
    else if (d.vact) {
      const ex = D.byId(st.ex);
      switch (d.vact) {
        case 'play': player?.start(); break;
        case 'stop': C.stopAll(); break;
        case 'mic': toggleMic(); break;
        case 'loop': st.loop = !st.loop; save(); rerender(); break;
        case 'cue': st.cue = !st.cue; save(); rerender(); break;
        case 'up': case 'down': { const [lo, hi] = span(ex); st.start[ex.id] = C.clamp(exStart(ex) + (d.vact === 'up' ? 1 : -1), st.low - lo, Math.max(st.low - lo, st.high - hi)); save(); rerender(); break; }
        case 'next': nextRoutine(false, 1); break;
        case 'prev': nextRoutine(false, -1); break;
        case 'exit': st.routine = null; save(); rerender(); break;
      }
    }
  });
  document.addEventListener('change', ev => {
    if (document.body.dataset.sec !== 'vocal') return;
    const t = ev.target, ex = D.byId(st.ex);
    if (t.id === 'vx-voice') { setVoice(t.value); rerender(); }
    else if (t.id === 'vx-low' || t.id === 'vx-high') { st[t.id === 'vx-low' ? 'low' : 'high'] = +t.value; if (st.high < st.low + 7) st.high = st.low + 7; st.voice = 'custom'; st.start = {}; save(); rerender(); }
    else if (t.id === 'vx-start') { st.start[ex.id] = +t.value; save(); rerender(); }
    else if (t.id === 'vx-reps') { st.reps = +t.value; save(); rerender(); }
    else if (t.id === 'vx-bpm') { st.bpm[ex.id] = +t.value; save(); rerender(); }
  });
  document.addEventListener('input', ev => { if (ev.target.id === 'vx-bpm') { const v = $('#vx-bpmv'); if (v) v.textContent = ev.target.value; } });

  X.vocal = {
    render, after, timeline, state: st, Player, Breath,
    play: () => { if (player) player.playing ? player.stop() : player.start(); },
    player: () => player,
    preset(sec, p) {
      if (sec !== 'vocal') return;
      if (p.routine) { const [l, m] = String(p.routine).split(':').map(Number); if (D.ROT[l]?.[m]) startRoutine(l, m); }
      else if (p.vx && D.byId(p.vx)) { st.ex = p.vx; st.tab = 'exercicios'; st.routine = null; }
      if (p.vtab) st.tab = p.vtab;
      if (p.voiceFromProva) setVoice('prova');
      save();
    }
  };
  X.vocal.voiceFromProva = () => setVoice('prova');
})();
