/* Estudo Musical — desenhos de acordes reais e tocáveis (violão/guitarra, baixo, ukulele, cavaquinho).
   Estratégia: (1) tabela curada de acordes abertos conferida nota a nota; (2) formas móveis de pestana
   (E e A) e formas C/G/D do CAGED; (3) busca restrita apenas como último recurso.
   Toda forma exibida passa pelas regras de tocabilidade de validate(). Carregado antes de engine.js. */
(function () {
  'use strict';
  const STD = [40, 45, 50, 55, 59, 64];                 /* violão padrão, 6ª corda (Mi grave) primeiro */
  const UKE = [67, 60, 64, 69], CAV = [62, 67, 71, 74];
  const mod = (n, m) => ((n % m) + m) % 12;
  const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const parse = s => (s.includes('-') ? s.split('-') : s.split('')).map(c => (c === 'x' ? -1 : +c));
  const notation = fr => (fr.some(f => f >= 10) ? fr.map(f => (f < 0 ? 'x' : f)).join('-') : fr.map(f => (f < 0 ? 'x' : f)).join(''));

  /* ---------- 1. Tabelas curadas (conferidas por validate() e pelo teste de regressão) ---------- */
  const CUR_GUITAR = {
    maj: { C: ['x32010'], D: ['xx0232'], E: ['022100'], F: ['xx3211'], G: ['320003', '320033'], A: ['x02220'] },
    m: { D: ['xx0231'], E: ['022000'], A: ['x02210'] },
    7: { C: ['x32310'], D: ['xx0212'], E: ['020100', '022130'], G: ['320001'], A: ['x02020', 'x02223'], B: ['x21202'] },
    m7: { D: ['xx0211'], E: ['022030', '020000'], A: ['x02010'], B: ['x20202'] },
    '7M': { C: ['x32000'], D: ['xx0222'], E: ['021100'], F: ['xx3210'], G: ['320002'], A: ['x02120'] },
    sus2: { D: ['xx0230'], A: ['x02200'] },
    sus4: { C: ['x33011'], D: ['xx0233'], E: ['022200'], G: ['330013'], A: ['x02230'] },
    '7sus4': { A: ['x02030'], D: ['xx0213'], E: ['020200'] },
    add9: { C: ['x32030'], E: ['024100'], G: ['320203'], A: ['x02420'] },
    6: { C: ['x32210'], D: ['xx0202'], E: ['022120'], G: ['320000'], A: ['x02222'] },
    m6: { D: ['xx0201'], E: ['022020'], A: ['x02212'] },
    9: { C: ['x32333'], E: ['020102'], G: ['300201'], A: ['x02423'], B: ['x21222'] },
    m7b5: { D: ['xx0111'], E: ['012030'], A: ['x01013'], B: ['x2323x'] },
    dim7: { D: ['xx0101'], E: ['012020'], A: ['x01212'] },
    aug: { C: ['x32110'] }
  };
  const CUR_UKE = {
    maj: { C: ['0003'], D: ['2220'], E: ['1402'], F: ['2010'], G: ['0232'], A: ['2100'], Bb: ['3211'], B: ['4322'] },
    m: { C: ['0333'], D: ['2210'], E: ['0432'], F: ['1013'], G: ['0231'], A: ['2000'], B: ['4222'] },
    7: { C: ['0001'], D: ['2223'], E: ['1202'], F: ['2313'], G: ['0212'], A: ['0100'], B: ['2322'] },
    m7: { D: ['2213'], E: ['0202'], G: ['0211'], A: ['0000'], B: ['2222'] },
    '7M': { C: ['0002'], D: ['2224'], G: ['0222'], A: ['1100'] },
    sus2: { C: ['0233'], D: ['2200'], G: ['0230'] },
    sus4: { C: ['0013'], D: ['0230'], G: ['0233'], A: ['2200'] },
    6: { C: ['0000'], F: ['2213'], G: ['0202'] },
    dim7: { C: ['2323'] }
  };
  const CUR_CAV = {
    maj: { C: ['2012'], D: ['0234'], E: ['2102'], F: ['3213'], G: ['0000'], A: ['2222'] },
    m: { D: ['0233'], E: ['2002'], A: ['2212'], B: ['4434'] },
    7: { C: ['2312'], D: ['0214'], E: ['0102'], G: ['0003'], A: ['2022'], B: ['1201'] },
    m7: { D: ['0213'], E: ['0002'] }
  };

  /* ---------- 2. Formas móveis (deslocamentos em relação à casa da tônica na corda indicada) ---------- */
  const _ = null;
  const MOV = [
    /* Forma de E: tônica na 6ª corda */
    ['E', 0, { maj: [0, 2, 2, 1, 0, 0], m: [0, 2, 2, 0, 0, 0], 7: [0, 2, 0, 1, 0, 0], m7: [0, 2, 0, 0, 0, 0], '7M': [0, _, 1, 1, 0, _], m7M: [0, 2, 1, 0, 0, 0],
      m7b5: [0, _, 0, 0, -1, _], dim7: [0, _, -1, 0, -1, _], dim: [0, 1, 2, 0, _, _], sus4: [0, 2, 2, 2, 0, 0], '7sus4': [0, 2, 0, 2, 0, 0], 6: [0, _, -1, 1, 0, _], m6: [0, _, -1, 0, 0, _],
      9: [0, 2, 0, 1, 0, 2], m9: [0, _, 0, 0, 0, 2], 13: [0, _, 0, 1, 2, _] }],
    /* Forma de A: tônica na 5ª corda */
    ['A', 1, { maj: [_, 0, 2, 2, 2, 0], m: [_, 0, 2, 2, 1, 0], 7: [_, 0, 2, 0, 2, 0], m7: [_, 0, 2, 0, 1, 0], '7M': [_, 0, 2, 1, 2, 0], m7M: [_, 0, 2, 1, 1, 0],
      m7b5: [_, 0, 1, 0, 1, _], dim7: [_, 0, 1, -1, 1, _], dim: [_, 0, 1, 2, 1, _], aug: [_, 0, -1, -1, -2, _], sus2: [_, 0, 2, 2, 0, 0], sus4: [_, 0, 2, 2, 3, 0], '7sus4': [_, 0, 2, 0, 3, 0],
      6: [_, 0, 2, 2, 2, 2], m6: [_, 0, -2, -1, -2, 0], 69: [_, 0, -1, -1, 0, 0], add9: [_, 0, -1, -3, 0, _], 9: [_, 0, -1, 0, 0, 0], m9: [_, 0, -2, 0, 0, _], '7M9': [_, 0, -1, 1, 0, _],
      11: [_, 0, 0, 0, 0, _], m11: [_, 0, 0, 0, 1, 0], 13: [_, 0, -1, 0, 2, _], '7b9': [_, 0, -1, 0, -1, _], '7#9': [_, 0, -1, 0, 1, _], '7b5': [_, 0, 1, 0, 2, _] }],
    /* Formas C, G e D do CAGED */
    ['C', 1, { maj: [_, 0, -1, -3, -2, -3], m: [_, 0, -2, -3, -2, 0] }],
    ['G', 0, { maj: [0, -1, -3, -3, -3, 0], m: [0, -2, -3, -3, 0, 0] }],
    ['D', 2, { maj: [_, _, 0, 2, 3, 2], m: [_, _, 0, 2, 3, 1] }]
  ];

  /* ---------- Regras musicais ---------- */
  function info(ci) {
    const degs = ci.tones.map(t => t.d), has7 = degs.some(d => ['b7', '7', 'bb7'].includes(d));
    const optional = new Set();
    if ((has7 || degs.length >= 5) && degs.includes('5')) optional.add('5');
    if (ci.typeId === '7alt') optional.add('b9');
    if (ci.typeId === '11') optional.add('9');
    const required = new Set(ci.tones.filter(t => !optional.has(t.d)).map(t => t.pc));
    return { pcs: new Set(ci.tones.map(t => t.pc)), required, optional };
  }

  /* ---------- Digitação realista (dedos 1–4, pestana = um dedo) ---------- */
  function fingering(fr) {
    const notes = fr.map((f, s) => [f, s]).filter(([f]) => f > 0);
    const out = { fing: fr.map(() => 0), barres: [], n: 0 };
    if (!notes.length) return out;
    const minF = Math.min(...notes.map(([f]) => f));
    const tryIt = (useBarre, collapse) => {
      const fing = fr.map(() => 0), barres = [];
      let rest = notes.slice(), next = 1;
      if (useBarre) {
        const at = notes.filter(([f]) => f === minF).map(([, s]) => s);
        if (at.length < 2) return null;
        const from = Math.min(...at), to = Math.max(...at);
        for (let s = from; s <= to; s++) if (fr[s] < minF) return null;      /* corda solta ou abafada sob a pestana */
        barres.push({ f: minF, from, to, finger: 1 });
        for (let s = from; s <= to; s++) if (fr[s] === minF) fing[s] = 1;
        rest = notes.filter(([f, s]) => !(f === minF && s >= from && s <= to));
        next = 2;
      }
      /* agrupa cordas vizinhas na mesma casa (mini-pestana) quando faltam dedos */
      let units = rest.map(([f, s]) => ({ f, ss: [s] }));
      if (collapse) {
        const runs = [];
        const sorted = rest.slice().sort((a, b) => a[1] - b[1]);
        for (let i = 0; i < sorted.length;) {
          let j = i;
          while (j + 1 < sorted.length && sorted[j + 1][1] === sorted[j][1] + 1 && sorted[j + 1][0] === sorted[i][0]) j++;
          if (j > i) runs.push(sorted.slice(i, j + 1));
          i = j + 1;
        }
        /* só uma mini-pestana extra, e apenas na casa mais alta da forma (ex.: A com anelar deitado, C9 x32333) */
        const top = Math.max(...rest.map(([f]) => f));
        runs.sort((a, b) => b.length - a.length || b[0][1] - a[0][1]);
        const need = () => units.length + next - 1;
        for (const run of runs.filter(r => r[0][0] === top).slice(0, 1)) {
          if (need() <= 4) break;
          const ss = run.map(([, s]) => s);
          units = units.filter(u => !ss.includes(u.ss[0]));
          units.push({ f: run[0][0], ss });
        }
      }
      units.sort((a, b) => a.f - b.f || a.ss[0] - b.ss[0]);
      let prev = next - 1;
      for (let k = 0; k < units.length; k++) {
        const u = units[k], left = units.length - k - 1;
        let fg = Math.max(prev + 1, u.f - minF + 1);
        fg = Math.min(fg, 4 - left);
        if (fg <= prev) fg = prev + 1;
        if (u.f - minF + 1 - fg > 1) return null;                          /* dedo baixo demais para a casa: esticada irreal */
        u.ss.forEach(s => (fing[s] = fg));
        if (u.ss.length > 1) barres.push({ f: u.f, from: Math.min(...u.ss), to: Math.max(...u.ss), finger: fg });
        prev = fg;
      }
      return { fing, barres, n: prev, cnt: units.length + next - 1 };
    };
    const plain = tryIt(false, false), withBarre = tryIt(true, false);
    /* pestana parcial preferida quando cobre a 1ª corda e ainda há notas acima dela (ex.: F xx3211, Dm7 xx0211) */
    const last = fr.length - 1;
    if (withBarre && withBarre.n <= 4 && (!plain || withBarre.cnt < plain.cnt)) {
      if (!plain || plain.cnt === 4) return withBarre;                                   /* economiza dedos: pestana */
      if (withBarre.barres[0].to === last && notes.some(([f]) => f > minF)) return withBarre;
    }
    for (const r of [plain, withBarre, tryIt(false, true), tryIt(true, true)]) if (r && r.n <= 4) return r;
    return { fing: out.fing, barres: [], n: 99 };
  }

  /* ---------- Regras de tocabilidade ---------- */
  function validate(fr, tuning, ci, o = {}) {
    const I = o.info || info(ci), bad = [];
    const sounding = fr.map((f, s) => [f, s]).filter(([f]) => f >= 0);
    const minStr = o.minStrings ?? (tuning.length >= 6 ? 4 : tuning.length === 4 && !o.bass ? 4 : 2);
    if (sounding.length < minStr) bad.push('poucas cordas');
    const midis = sounding.map(([f, s]) => tuning[s] + f), pcs = midis.map(m => mod(m, 12));
    if (pcs.some(p => !I.pcs.has(p))) bad.push('nota fora do acorde');
    const present = new Set(pcs);
    for (const p of I.required) if (!present.has(p)) bad.push('falta nota essencial');
    if (!present.has(ci.rootPc)) bad.push('sem tônica');
    if (!o.reentrant && midis.length && mod(Math.min(...midis), 12) !== ci.rootPc) bad.push('baixo não é a tônica');
    const fretted = fr.filter(f => f > 0);
    if (fretted.length && Math.max(...fretted) - Math.min(...fretted) > 3) bad.push('abertura maior que 4 casas');
    if (!o.curated && fr.some(f => f === 0) && fretted.length && Math.max(...fretted) > 4) bad.push('corda solta com casa alta');
    /* abafadas: só nas pontas (graves ou agudas) ou uma única interna, se a forma for rotulada */
    const idx = sounding.map(([, s]) => s);
    let gaps = 0;
    for (let k = 1; k < idx.length; k++) gaps += idx[k] - idx[k - 1] - 1;
    if (gaps > (o.allowInterior ? 1 : 0)) bad.push('corda abafada no meio');
    if (tuning.length >= 6 && idx.length && idx[0] > 2) bad.push('baixo muito agudo');
    const F = fingering(fr);
    if (F.n > 4) bad.push('mais de 4 dedos');
    return { ok: !bad.length, bad, F, midis };
  }

  /* ---------- Geração ---------- */
  function sameIntervals(tuning, ref, used, exact) {
    let k = null;
    for (const s of used) {
      const d = tuning[s] - ref[s];
      const kk = exact ? d : mod(d, 12);
      if (k === null) k = kk; else if (kk !== k) return null;
    }
    return k;
  }
  const nameOfPc = pc => Object.keys(PC).find(n => PC[n] === pc && !n.includes('b') && n.length <= 2);

  function make(fr, tuning, ci, meta, o) {
    const v = validate(fr, tuning, ci, { ...o, curated: o.curated ?? meta.kind === 'aberto', allowInterior: o.allowInterior ?? meta.kind === 'movel' });
    if (!v.ok) return null;
    const fretted = fr.filter(f => f > 0);
    const n = tuning.length, sounding = fr.map((f, s) => (f >= 0 ? s : -1)).filter(s => s >= 0);
    const muted = [];
    for (let s = sounding[0]; s <= sounding[sounding.length - 1]; s++) if (fr[s] < 0) muted.push(s);
    return {
      frets: fr.slice(), fing: v.F.fing, barres: v.F.barres, barre: v.F.barres.find(b => b.finger === 1) || v.F.barres[0] || null,
      pos: fretted.length ? Math.min(...fretted) : 0, kind: meta.kind, form: meta.form || '', notes: v.midis,
      name: meta.name, mute: muted.map(s => `${n - s}ª`), notation: notation(fr)
    };
  }

  function curatedTable(inst) { return inst === 'ukulele' ? [CUR_UKE, UKE] : inst === 'cavaquinho' ? [CUR_CAV, CAV] : inst === 'violao' ? [CUR_GUITAR, STD] : [null, null]; }

  function shapes(tuning, ci, o = {}) {
    const inst = o.inst || (tuning.length >= 6 ? 'violao' : 'baixo');
    const maxFret = Math.min(o.maxFret ?? 15, 22), reentrant = inst === 'ukulele' || inst === 'cavaquinho';
    const opt = { reentrant, bass: inst === 'baixo', info: info(ci) };
    const seen = new Set(), out = [];
    const add = s => { if (s && !seen.has(s.frets.join(',')) && Math.max(...s.frets) <= maxFret) { seen.add(s.frets.join(',')); out.push(s); } };
    /* 1. abertos curados */
    const [tab, ref] = curatedTable(inst);
    if (tab && tab[ci.typeId]) {
      for (const [root, list] of Object.entries(tab[ci.typeId])) for (const str of list) {
        const fr = parse(str), used = fr.map((f, s) => (f >= 0 ? s : -1)).filter(s => s >= 0);
        const k = sameIntervals(tuning, ref, used, !reentrant);
        if (k === null || mod(PC[root] + k, 12) !== ci.rootPc) continue;
        add(make(fr, tuning, ci, { kind: 'aberto', name: 'Aberto' }, opt));
      }
    }
    /* 2. formas móveis E/A e 3. C/G/D (somente violão/guitarra com intervalos padrão nas cordas usadas) */
    const movable = [], cdg = [];
    if (tuning.length === 6) for (const [form, rs, tbl] of MOV) {
      const off = tbl[ci.typeId];
      if (!off) continue;
      const used = off.map((x, s) => (x === null ? -1 : s)).filter(s => s >= 0);
      if (sameIntervals(tuning, STD, used, true) === null) continue;
      const r0 = mod(ci.rootPc - tuning[rs], 12);
      for (const r of [r0, r0 + 12]) {
        const fr = off.map(x => (x === null ? -1 : r + x));
        if (fr.some((f, s) => off[s] !== null && f < 0)) continue;
        const open = fr.some(f => f === 0);
        if (open && Math.max(...fr) > 4) continue;
        const s = make(fr, tuning, ci, { kind: open ? 'aberto' : 'movel', form, name: open ? 'Aberto' : `Forma de ${form}` }, { ...opt, allowInterior: true, curated: false });
        if (s) {
          if (form === 'E' || form === 'A') movable.push(s); else if (ci.typeId === 'maj' || form === 'D') cdg.push(s);
          if (!open) break;                                       /* forma aberta (r = 0): tenta também a oitava acima */
        }
      }
    }
    movable.sort((a, b) => a.pos - b.pos).forEach(add);
    cdg.sort((a, b) => a.pos - b.pos).forEach(add);
    /* 4. busca restrita, só se ainda houver menos de 3 formas */
    if (out.length < 3) search(tuning, ci, maxFret, opt).forEach(s => out.length < 3 && add(s));
    return out.slice(0, 6);
  }

  function search(tuning, ci, maxFret, opt) {
    const n = tuning.length, found = [], I = opt.info;
    for (let d = 1; d <= maxFret - 3; d++) {
      const choices = tuning.map(t => {
        const c = [-1];
        if (d <= 2 && I.pcs.has(mod(t, 12))) c.push(0);
        for (let f = d; f <= d + 3; f++) if (I.pcs.has(mod(t + f, 12))) c.push(f);
        return c;
      });
      const fr = new Array(n);
      const rec = s => {
        if (s === n) {
          if (!fr.some(f => f === d)) return;
          const v = validate(fr, tuning, ci, opt);
          if (!v.ok) return;
          const fretted = fr.filter(f => f > 0), sounding = fr.filter(f => f >= 0).length;
          if (fr.includes(0) && Math.max(...fretted) > 3) return;           /* soltas só com casas até a 3ª */
          const extra = v.F.barres.filter(b => b.finger !== 1).length;
          found.push({ fr: fr.slice(), score: d * 0.6 + (n - sounding) * 1.5 + v.F.n * 0.4 + v.F.barres.length * 0.6 + extra * 1.5 + (Math.max(...fretted, d) - d) * 0.8 });
          return;
        }
        for (const f of choices[s]) {
          if (!opt.reentrant && fr.slice(0, s).every(x => x < 0) && f >= 0 && mod(tuning[s] + f, 12) !== ci.rootPc) continue; /* a nota mais grave tem de ser a tônica */
          fr[s] = f; rec(s + 1);
        }
      };
      rec(0);
    }
    found.sort((a, b) => a.score - b.score);
    const out = [], pos = [];
    for (const c of found) {
      const p = Math.min(...c.fr.filter(f => f > 0), 99);
      if (pos.some(q => Math.abs(q - p) < 2)) continue;
      const s = make(c.fr, tuning, ci, { kind: 'busca', name: '' }, opt);
      if (s) { s.name = s.frets.includes(0) || !s.pos ? 'Aberto (variação)' : `Posição ${s.pos}ª`; out.push(s); pos.push(p); }
      if (out.length >= 6) break;
    }
    return out;
  }

  /* CAGED: as cinco formas (C, A, G, E, D) de acordes maiores e menores, em ordem de posição no braço */
  function caged(tuning, ci, o = {}) {
    if (!['maj', 'm'].includes(ci.typeId) || tuning.length !== 6) return null;
    const maxFret = o.maxFret ?? 15, opt = { info: info(ci) }, out = [];
    for (const form of ['C', 'A', 'G', 'E', 'D']) {
      const [, rs, tbl] = MOV.find(m => m[0] === form);
      const off = tbl[ci.typeId];
      const used = off.map((x, s) => (x === null ? -1 : s)).filter(s => s >= 0);
      if (sameIntervals(tuning, STD, used, true) === null) continue;
      const r0 = mod(ci.rootPc - tuning[rs], 12);
      for (const r of [r0, r0 + 12]) {
        const fr = off.map(x => (x === null ? -1 : r + x));
        if (fr.some((f, s) => off[s] !== null && f < 0) || Math.max(...fr) > maxFret) continue;
        const open = fr.some(f => f === 0);
        const s = make(fr, tuning, ci, { kind: open ? 'aberto' : 'movel', form, name: `Forma de ${form}` }, opt);
        if (s) { s.kind = 'caged'; out.push(s); break; }
      }
    }
    return out.sort((a, b) => a.pos - b.pos);
  }

  /* ---------- Diagrama (vertical: 6ª corda/Mi grave à esquerda, 1ª corda à direita) ---------- */
  function diagram(sh, o) {
    const n = sh.frets.length, L = 26, sx = 18, top = 30, rh = 22, rows = 5;
    const fretted = sh.frets.filter(f => f > 0), maxF = Math.max(0, ...fretted), minF = fretted.length ? Math.min(...fretted) : 1;
    const base = (sh.frets.some(f => f === 0) || maxF <= 4) && maxF <= rows ? 1 : minF;
    const W = L + (n - 1) * sx + 14, H = 166, x = s => L + s * sx, y = f => top + (f - base + 0.5) * rh;
    let g = base === 1 ? `<rect x="${x(0) - 1}" y="${top - 5}" width="${(n - 1) * sx + 2}" height="5" class="cdnut"/>`
      : `<text x="${L - 9}" y="${y(base) + 4}" text-anchor="end" class="cdbase">${base}ª</text>`;
    for (let r = 0; r <= rows; r++) g += `<line x1="${x(0)}" x2="${x(n - 1)}" y1="${top + r * rh}" y2="${top + r * rh}" class="cdline"/>`;
    for (let s = 0; s < n; s++) g += `<line x1="${x(s)}" x2="${x(s)}" y1="${top}" y2="${top + rows * rh}" class="cdline"/>`;
    for (const b of sh.barres || []) if (b.to > b.from) g += `<rect x="${x(b.from) - 8}" y="${y(b.f) - 8}" width="${x(b.to) - x(b.from) + 16}" height="16" rx="8" class="cdbarre"/>`;
    sh.frets.forEach((f, s) => {
      const ton = o.tonic && o.tonic[s];
      if (f < 0) g += `<text x="${x(s)}" y="${top - 11}" text-anchor="middle" class="cdx">×</text>`;
      else if (f === 0) g += `<circle cx="${x(s)}" cy="${top - 15}" r="5" class="cdo${ton ? ' ton' : ''}"/>`;
      else g += `<circle cx="${x(s)}" cy="${y(f)}" r="8" class="cddot${ton ? ' ton' : ''}"/><text x="${x(s)}" y="${y(f) + 3.5}" text-anchor="middle" class="cdfing">${sh.fing[s] || ''}</text>`;
      if (f >= 0 && o.labels && o.labels[s]) g += `<text x="${x(s)}" y="${H - 4}" text-anchor="middle" class="cdnote">${o.labels[s]}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="cdiag" role="img" aria-label="Diagrama ${sh.notation}" data-frets="${sh.notation}">${g}</svg>`;
  }
  function caption(sh) {
    const nm = sh.kind === 'caged' ? sh.name : sh.name || (sh.pos ? `Posição ${sh.pos}ª` : 'Aberto');
    const mute = sh.mute && sh.mute.length ? `<small class="cdmute">abafe a ${sh.mute.join(' e ')} corda</small>` : '';
    return `<div class="cdname">${nm}</div><div class="cdtab">${sh.notation}</div>${mute}`;
  }

  window.__musChords = { shapes, caged, validate, fingering, diagram, caption, notation, info, parse, tables: { guitar: CUR_GUITAR, uke: CUR_UKE, cav: CUR_CAV }, MOV, PC };
})();
