/* Prova inicial (nivelamento) para instrumento e para canto.
   Questões de teoria geradas pelo motor musical, percepção com áudio, ritmo por toque e testes vocais com microfone opcional. */
(() => {
  'use strict';
  const X = window.__musExt = window.__musExt || {};
  const C = X.core;
  const { esc, $, $$ } = C;
  const KEY = 'estudoMusicalProva';
  const db = C.load(KEY, { history: [] });
  if (!Array.isArray(db.history)) db.history = [];
  const saveDb = () => C.save(KEY, db);
  let run = null;
  const COMP = { teoria: 'Teoria', percepcao: 'Percepção', ritmo: 'Ritmo', tecnica: 'Técnica' };
  const compLabel = (k, track) => k === 'tecnica' && track === 'vocal' ? 'Técnica/afinação' : COMP[k];

  /* ---------- Autoavaliação ---------- */
  const Q_INST = [
    ['exp', 'Há quanto tempo você toca este instrumento?', [['0', 'Nunca toquei'], ['1', 'Menos de 6 meses'], ['2', '6 meses a 2 anos'], ['3', '2 a 5 anos'], ['4', 'Mais de 5 anos']]],
    ['leitura', 'O que você consegue ler?', [['0', 'Ainda não leio cifra nem partitura'], ['1', 'Cifras simples (C, Am, G7)'], ['2', 'Cifras com tétrades e tablatura'], ['3', 'Partitura, devagar'], ['4', 'Partitura com fluência']]],
    ['acordes', 'Sobre acordes, você…', [['0', 'Ainda não conhece acordes'], ['1', 'Conhece alguns maiores e menores'], ['2', 'Troca acordes básicos no tempo da música'], ['3', 'Usa tétrades e inversões'], ['4', 'Usa harmonia funcional e rearmonização']]],
    ['tecnica', 'Com metrônomo, você consegue tocar uma música inteira?', [['0', 'Ainda não'], ['1', 'Com muita dificuldade'], ['2', 'Sim, em andamento lento'], ['3', 'Sim, no andamento original'], ['4', 'Sim, e também improviso']]],
    ['tempo', 'Quanto tempo por dia você pode estudar?', [['15', '10 a 15 min'], ['30', '20 a 30 min'], ['45', 'Cerca de 45 min'], ['60', '1 hora ou mais']]],
    ['dias', 'Quantos dias por semana?', [['3', '3 dias'], ['5', '5 dias'], ['6', '6 dias']]],
    ['objetivo', 'Seu principal objetivo', [['acompanhar', 'Acompanhar canções'], ['grupo', 'Tocar em grupo, banda ou igreja'], ['improvisar', 'Improvisar'], ['repertorio', 'Ler e tocar repertório'], ['compor', 'Compor e arranjar']]],
    ['estilo', 'Estilo preferido', [['mpb', 'MPB / Bossa nova'], ['samba', 'Samba / Pagode / Choro'], ['sertanejo', 'Sertanejo / Forró'], ['gospel', 'Gospel'], ['pop', 'Pop / Rock'], ['jazz', 'Jazz / Blues'], ['erudito', 'Erudito']]]
  ];
  const Q_VOC = [
    ['exp', 'Qual é a sua experiência com canto?', [['0', 'Nunca estudei canto'], ['1', 'Canto por hobby, sem aulas'], ['2', 'Coral ou aulas há menos de 1 ano'], ['3', 'Aulas há 1 a 3 anos'], ['4', 'Mais de 3 anos ou profissional']]],
    ['coral', 'Você já participou de coral ou fez aulas?', [['0', 'Nunca'], ['1', 'Já cantei em coral'], ['2', 'Faço ou fiz aulas de canto'], ['3', 'Coral e aulas']]],
    ['desconforto', 'Sente desconforto vocal ao cantar ou falar?', [['0', 'Não'], ['1', 'Às vezes, depois de usar muito a voz'], ['2', 'Com frequência (rouquidão, dor ou cansaço)']]],
    ['leitura', 'O que você consegue ler?', [['0', 'Nada ainda'], ['1', 'Cifras e letras com acordes'], ['2', 'Partitura básica'], ['3', 'Partitura com fluência']]],
    ['tempo', 'Quanto tempo por dia você pode estudar?', [['15', '10 a 15 min'], ['30', '20 a 30 min'], ['45', 'Cerca de 45 min'], ['60', '1 hora ou mais']]],
    ['dias', 'Quantos dias por semana?', [['3', '3 dias'], ['5', '5 dias'], ['6', '6 dias']]],
    ['objetivo', 'Seu principal objetivo', [['prazer', 'Cantar por prazer'], ['coral', 'Coral ou igreja'], ['palco', 'Banda e palco'], ['gravacao', 'Gravação'], ['teatro', 'Teatro musical']]],
    ['estilo', 'Estilo preferido', [['mpb', 'MPB / Bossa nova'], ['samba', 'Samba / Pagode'], ['sertanejo', 'Sertanejo'], ['gospel', 'Gospel'], ['pop', 'Pop / Rock'], ['lirico', 'Lírico / Erudito'], ['teatro', 'Musical']]]
  ];

  /* ---------- Teoria gerada pelo motor (respostas corretas por construção) ---------- */
  const ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'Eb'];
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const pretty = C.pretty;
  function mkQ(text, correct, wrong) {
    const opts = C.shuffle([correct, ...[...new Set(wrong)].filter(w => w !== correct).slice(0, 3)]);
    return { text, opts, ans: opts.indexOf(correct) };
  }
  function theoryQuiz(n = 8) {
    const m = window.__mus, qs = [], roots = C.shuffle(ROOTS);
    const sc = (r, id) => m.scale(r, id).map(pretty).join(' – ');
    const r0 = roots[0], r1 = roots[1], r2 = roots[2], r3 = roots[3], r4 = roots[4], r5 = roots[5];
    qs.push(mkQ(`Quais são as notas da escala de ${pretty(r0)} maior?`, sc(r0, 'maior'), [sc(r0, 'menor'), sc(r0, 'mixolidio'), sc(r0, 'lidio')]));
    const f4 = m.field(r1, 'maior', 4).map(pretty);
    qs.push(mkQ(`No campo harmônico de ${pretty(r1)} maior (tétrades), qual é o acorde do V grau (dominante)?`, f4[4], [f4[3], f4[1], f4[5]]));
    const minorRoot = m.scale(r2, 'maior')[5];
    const f3 = m.field(minorRoot, 'menor', 3).map(pretty);
    qs.push(mkQ(`No campo harmônico de ${pretty(minorRoot)} menor natural (tríades), qual acorde está no IV grau?`, f3[3], [f3[4], f3[2], f3[5]]));
    const maj = m.scale(r3, 'maior'), min = m.scale(r3, 'menor');
    const ints = [['3ª maior', maj[2]], ['3ª menor', min[2]], ['4ª justa', maj[3]], ['5ª justa', maj[4]], ['6ª maior', maj[5]], ['7ª menor', min[6]], ['2ª maior', maj[1]], ['7ª maior', maj[6]]];
    const pickI = C.pick(ints);
    qs.push(mkQ(`Qual é o intervalo de ${pretty(r3)} até ${pretty(pickI[1])} (subindo)?`, pickI[0], C.shuffle(ints.filter(i => i[0] !== pickI[0]).map(i => i[0]))));
    const types = [['m7', 'menor com sétima'], ['7', 'com sétima (dominante)'], ['7M', 'com sétima maior'], ['m', 'menor'], ['dim', 'diminuto'], ['m7b5', 'meio-diminuto']];
    const sym = (r, t) => pretty(r) + ({ m7: 'm7', 7: '7', '7M': '7M', m: 'm', dim: '°', m7b5: 'm7(♭5)' })[t];
    const tp = C.pick(types);
    qs.push(mkQ(`Qual cifra representa ${pretty(r4)} ${tp[1]}?`, sym(r4, tp[0]), C.shuffle(types.filter(t => t[0] !== tp[0]).map(t => sym(r4, t[0])))));
    const chord = (r, t) => m.chord(r, t).map(pretty).join(' – ');
    qs.push(mkQ(`Quais notas formam o acorde de ${pretty(r5)} maior?`, chord(r5, 'maj'), [chord(r5, 'm'), chord(r5, 'aug'), chord(r5, 'sus4')]));
    const s6 = m.scale(r1, 'maior');
    qs.push(mkQ(`Qual é a tonalidade relativa menor de ${pretty(r1)} maior?`, pretty(s6[5]) + ' menor', [pretty(s6[2]) + ' menor', pretty(s6[3]) + ' menor', pretty(r1) + ' menor']));
    qs.push(mkQ(`Qual é a sensível (VII grau) de ${pretty(r2)} maior?`, pretty(m.scale(r2, 'maior')[6]), [pretty(m.scale(r2, 'maior')[5]), pretty(m.scale(r2, 'menor')[6]), pretty(m.scale(r2, 'maior')[3])]));
    return C.shuffle(qs).slice(0, n);
  }
  function vocalTheory() {
    const m = window.__mus, r = C.pick(['C', 'D', 'F', 'G', 'A']), r2 = C.pick(['C', 'D', 'G', 'A', 'E']);
    return [
      mkQ('Quantos semitons há em uma 3ª maior?', '4', ['3', '5', '2']),
      mkQ(`Quais notas formam o acorde de ${pretty(r)} maior?`, m.chord(r, 'maj').map(pretty).join(' – '), [m.chord(r, 'm').map(pretty).join(' – '), m.chord(r, 'sus4').map(pretty).join(' – '), m.chord(r, 'aug').map(pretty).join(' – ')]),
      mkQ(`Qual é a 5ª nota da escala de ${pretty(r2)} maior?`, pretty(m.scale(r2, 'maior')[4]), [pretty(m.scale(r2, 'maior')[3]), pretty(m.scale(r2, 'maior')[5]), pretty(m.scale(r2, 'maior')[2])]),
      mkQ('Na cifra “Am”, o “m” indica que o acorde é…', 'menor', ['maior', 'com sétima', 'diminuto'])
    ];
  }

  /* ---------- Percepção ---------- */
  function earItems(vocal) {
    const items = [], base = () => 55 + Math.floor(Math.random() * 10);
    const intervals = [[2, '2ª maior'], [4, '3ª maior'], [5, '4ª justa'], [7, '5ª justa'], [12, 'Oitava']];
    const iv = () => { const it = C.pick(intervals), b = base(); return { kind: 'int', q: 'Qual intervalo você ouviu (melódico, subindo)?', notes: [b, b + it[0]], opts: intervals.map(i => i[1]), ans: intervals.indexOf(it) }; };
    const mm = () => { const isMaj = Math.random() < .5, b = base(); return { kind: 'chord', q: 'O acorde é maior ou menor?', chord: [b, b + (isMaj ? 4 : 3), b + 7], opts: ['Maior', 'Menor'], ans: isMaj ? 0 : 1 }; };
    const sd = () => { const same = Math.random() < .5, b = base(), d = C.pick([1, 2, -1, -2]); return { kind: 'pair', q: 'As duas notas são iguais ou diferentes?', notes: [b, same ? b : b + d], opts: ['Iguais', 'Diferentes'], ans: same ? 0 : 1 }; };
    const hl = () => { const up = Math.random() < .5, b = base(), d = C.pick([1, 2, 3]); return { kind: 'pair', q: 'A segunda nota é mais aguda ou mais grave?', notes: [b, b + (up ? d : -d)], opts: ['Mais aguda', 'Mais grave'], ans: up ? 0 : 1 }; };
    if (vocal) items.push(hl(), hl(), sd(), sd(), mm(), iv());
    else items.push(iv(), iv(), mm(), mm(), sd(), sd());
    return items;
  }
  function playEar(it) {
    C.unlock(); C.stopAll({ keepMic: true });
    if (it.kind === 'chord') C.chord(it.chord, 0, 1.6);
    else { C.note(it.notes[0], 0, .9); C.note(it.notes[1], .85, 1.1); }
  }

  /* ---------- Ritmo: tocar junto com o metrônomo ---------- */
  const rhythm = { active: false };
  function startRhythm() {
    C.unlock(); C.stopAll();
    const bpm = 80, beat = 60 / bpm, lead = .35, count = 4, n = 8, ctx = C.ctx();
    const lat = ctx ? (ctx.outputLatency || ctx.baseLatency || 0) : 0;
    for (let i = 0; i < count + n; i++) C.click(lead + i * beat, i % 4 === 0);
    Object.assign(rhythm, { active: true, beat, count, n, taps: [], t0: performance.now() / 1000 + lead + lat, timers: [] });
    const dots = $$('#rt-dots i'), msg = $('#rt-msg');
    for (let i = 0; i < count + n; i++) rhythm.timers.push(setTimeout(() => {
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
      if (msg) msg.textContent = i < count ? `Contagem: ${i + 1}… comece a tocar no próximo “1”` : `Toque junto: ${i - count + 1} de ${n}`;
    }, (lead + lat + i * beat) * 1000));
    rhythm.timers.push(setTimeout(finishRhythm, (lead + lat + (count + n) * beat + .4) * 1000));
  }
  function tap() {
    if (!rhythm.active) return;
    rhythm.taps.push(performance.now() / 1000);
    const pad = $('#rt-pad'); if (pad) { pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit'); }
  }
  function finishRhythm() {
    if (!rhythm.active) return;
    rhythm.active = false; rhythm.timers.forEach(clearTimeout);
    const { t0, beat, count, n, taps } = rhythm, devs = [];
    for (let i = 0; i < n; i++) {
      const target = t0 + (count + i) * beat;
      let best = null; taps.forEach(t => { const d = t - target; if (Math.abs(d) < beat / 2 && (best === null || Math.abs(d) < Math.abs(best))) best = d; });
      if (best !== null) devs.push(best * 1000);
    }
    const mean = devs.length ? devs.reduce((a, b) => a + Math.abs(b), 0) / devs.length : null;
    const bias = devs.length ? devs.reduce((a, b) => a + b, 0) / devs.length : 0;
    const score = mean == null ? 0 : Math.round(C.clamp(100 - Math.max(0, mean - 25) * .8, 0, 100) * devs.length / n);
    run.rhythm = { score, mean: mean == null ? null : Math.round(mean), bias: Math.round(bias), hits: devs.length, n };
    window.__mus.render();
  }
  document.addEventListener('pointerdown', ev => { if (ev.target.closest('#rt-pad')) { ev.preventDefault(); tap(); } });
  document.addEventListener('keydown', ev => { if (rhythm.active && (ev.code === 'Space' || ev.key === 'Enter')) { ev.preventDefault(); ev.stopPropagation(); tap(); } }, true);
  window.addEventListener('music:stop', () => { if (rhythm.active && !X.keepMic) { rhythm.active = false; rhythm.timers.forEach(clearTimeout); } });

  /* ---------- Microfone nos testes vocais ---------- */
  function micBox() {
    const on = X.mic?.active;
    return `<div class="pv-mic ${on ? 'on' : ''}"><button class="${on ? 'primary-button' : 'soft-button'}" data-pact="mic">${on ? '🎤 Microfone ativo' : '🎤 Ativar microfone'}</button><span id="pv-micmsg" class="muted">${on ? 'Use fones de ouvido se possível. Nada é gravado ou enviado.' : esc(run.micMsg || 'Opcional. Sem microfone, responda pela autoavaliação logo abaixo.')}</span></div>`;
  }
  async function enableMic() {
    if (X.mic.active) return true;
    try { C.unlock(); await X.mic.start(C.ctx()); run.micMsg = ''; return true; }
    catch (err) { run.micMsg = X.pitch.Mic.explain(err); return false; }
  }
  /* Coleta quadros do microfone por alguns segundos. */
  function listen(seconds, onUpdate) {
    return new Promise(resolve => {
      const frames = [], t0 = performance.now();
      const off = X.mic.on(f => { frames.push(f); onUpdate && onUpdate(f, (performance.now() - t0) / 1000); });
      setTimeout(() => { off(); resolve(frames); }, seconds * 1000);
    });
  }
  const PITCH_REF = { grave: [48, 52, 55], aguda: [60, 64, 67] };
  function playRef(midi) { C.unlock(); C.stopAll({ keepMic: true }); C.note(midi, 0, 1.4, .8); C.tone({ midi, delay: 0, dur: 1.6, vel: .6 }); }
  async function singMatch(i) {
    const target = PITCH_REF[run.region][i], msg = $(`#pm-${i}`);
    if (!X.mic.active && !(await enableMic())) { window.__mus.render(); return; }
    playRef(target);
    if (msg) msg.textContent = 'Ouça… e cante a mesma nota em “a” quando a referência terminar.';
    await new Promise(r => setTimeout(r, 1700));
    if (msg) msg.textContent = 'Cante agora (3 s)…';
    const frames = await listen(3, f => { if (msg && f.voiced) msg.textContent = `Cante agora… ${f.name} ${f.cents >= 0 ? '+' : ''}${f.cents} cents`; });
    const voiced = frames.filter(f => f.voiced).slice(3);
    if (voiced.length < 6) { run.pitch[i] = { mode: 'mic', score: null, msg: 'Voz não detectada. Tente de novo, mais perto do microfone, ou use a autoavaliação.' }; }
    else {
      const cents = X.pitch.median(voiced.map(f => X.pitch.centsTo(f.midiF, target)));
      run.pitch[i] = { mode: 'mic', cents: Math.round(cents), score: Math.round(C.clamp(100 - Math.max(0, Math.abs(cents) - 15) * 1.2, 0, 100)) };
    }
    window.__mus.render();
  }
  async function recordRange(which) {
    if (!X.mic.active && !(await enableMic())) { window.__mus.render(); return; }
    const msg = $('#rg-msg');
    if (msg) msg.textContent = which === 'low' ? 'Cante sua nota mais GRAVE confortável em “a”, sustentada (4 s)…' : 'Cante sua nota mais AGUDA confortável em “a” ou “u”, sem gritar (4 s)…';
    const frames = await listen(4, f => { if (msg && f.voiced) msg.textContent = `Ouvindo: ${C.noteName(f.midi)}`; });
    const v = frames.filter(f => f.voiced).map(f => f.midiF).sort((a, b) => a - b);
    if (v.length < 8) { run.rangeMsg = 'Voz não detectada com segurança. Tente de novo ou escolha as notas manualmente.'; }
    else { const q = which === 'low' ? v[Math.floor(v.length * .2)] : v[Math.floor(v.length * .8)]; run.range[which] = Math.round(q); run.range.mode = 'mic'; run.rangeMsg = ''; }
    window.__mus.render();
  }
  async function recordSustain() {
    if (!X.mic.active && !(await enableMic())) { window.__mus.render(); return; }
    const msg = $('#su-msg');
    if (msg) msg.textContent = 'Inspire e cante “a” em uma nota confortável pelo maior tempo possível, sem forçar…';
    let first = null, last = null, silenceSince = null;
    const t0 = performance.now() / 1000;
    await new Promise(resolve => {
      const off = X.mic.on(f => {
        const t = performance.now() / 1000;
        if (f.voiced && f.level > .015) { if (first === null) first = t; last = t; silenceSince = null; if (msg) msg.textContent = `Sustentando: ${(t - first).toFixed(1)} s`; }
        else if (first !== null) { silenceSince = silenceSince ?? t; if (t - silenceSince > .7) { off(); resolve(); } }
        if (t - t0 > 45 || (first === null && t - t0 > 8)) { off(); resolve(); }
      });
    });
    run.sustain = first === null ? { mode: 'mic', secs: null } : { mode: 'mic', secs: Math.round((last - first) * 10) / 10 };
    window.__mus.render();
  }
  const sw = { t: 0 };

  /* ---------- Classificação aproximada pela região confortável ---------- */
  const CLASSES = [['Soprano', 70.5], ['Mezzo-soprano', 67], ['Contralto', 63.5], ['Tenor', 58.5], ['Barítono', 55], ['Baixo', 51]];
  function classify(low, high) {
    if (!(low && high) || high - low < 10) return null;
    const mid = (low + high) / 2;
    return CLASSES.slice().sort((a, b) => Math.abs(a[1] - mid) - Math.abs(b[1] - mid))[0][0];
  }

  /* ---------- Pontuação ---------- */
  function weighted(parts) {
    let s = 0, w = 0;
    for (const [v, wt] of parts) if (v != null) { s += v * wt; w += wt; }
    return w ? Math.round(s / w) : null;
  }
  const quizPct = (qs, ans) => qs.length ? Math.round(100 * qs.filter((q, i) => ans[i] === q.ans).length / qs.length) : null;
  function levelOf(overall, exp) {
    let lvl = overall < 35 ? 0 : overall < 55 ? 1 : overall < 75 ? 2 : 3;
    const cap = exp <= 0 ? 1 : exp <= 2 ? 2 : 3; /* conservador: sem experiência, no máximo Básico; até 2 anos, no máximo Intermediário */
    return Math.min(lvl, cap);
  }
  function compute() {
    const a = run.answers, exp = +a.exp || 0;
    const sc = { teoria: quizPct(run.quiz, run.quizAns), percepcao: quizPct(run.ear, run.earAns), ritmo: run.rhythm ? run.rhythm.score : null };
    let overall, extra = {};
    if (run.track === 'instrumento') {
      sc.tecnica = Math.round(100 * (exp / 4 * .4 + (+a.acordes || 0) / 4 * .3 + (+a.tecnica || 0) / 4 * .3));
      overall = weighted([[sc.tecnica, .3], [sc.teoria, .25], [sc.percepcao, .25], [sc.ritmo, .2]]);
    } else {
      const pm = run.pitch.filter(p => p && p.score != null).map(p => p.score);
      const pitchScore = pm.length ? Math.round(pm.reduce((x, y) => x + y, 0) / pm.length) : null;
      const secs = run.sustain?.secs;
      const sus = secs == null ? null : Math.round(C.clamp(10 + (secs - 5) * 6, 10, 100));
      const { low, high } = run.range, width = low && high ? high - low : null;
      const rng = width == null ? null : Math.round(C.clamp(20 + (width - 10) * (80 / 14), 0, 100));
      sc.tecnica = weighted([[pitchScore, .45], [sus, .2], [rng, .15], [exp / 4 * 100, .2]]);
      overall = weighted([[sc.tecnica, .4], [sc.percepcao, .25], [sc.ritmo, .15], [sc.teoria, .2]]);
      extra.vocal = { low, high, width, classif: classify(low, high), sustain: secs ?? null, pitch: pitchScore, pitchMode: run.pitch.some(p => p?.mode === 'mic') ? 'mic' : 'autoavaliacao', rangeMode: run.range.mode || 'manual', desconforto: +a.desconforto || 0 };
    }
    overall = overall ?? 0;
    const level = levelOf(overall, exp);
    return Object.assign({ id: Date.now().toString(36), date: new Date().toISOString(), track: run.track, inst: run.inst || null, level, overall, scores: sc, answers: Object.assign({}, a), rhythm: run.rhythm || null }, extra);
  }

  /* ---------- Fluxo ---------- */
  const STEPS = {
    instrumento: [['inst', 'Instrumento'], ['auto', 'Sobre você'], ['teoria', 'Teoria'], ['ouvido', 'Percepção'], ['ritmo', 'Ritmo'], ['resultado', 'Resultado']],
    vocal: [['auto', 'Sobre você'], ['afinacao', 'Afinação'], ['extensao', 'Extensão'], ['sustentacao', 'Sustentação'], ['ouvido', 'Percepção'], ['ritmo', 'Ritmo'], ['teoria', 'Teoria'], ['resultado', 'Resultado']]
  };
  function begin(track) {
    run = { track, step: 0, answers: {}, quiz: track === 'vocal' ? vocalTheory() : theoryQuiz(), quizAns: [], ear: earItems(track === 'vocal'), earAns: [], earPlays: [], rhythm: null, pitch: [], range: {}, sustain: null, region: null, inst: track === 'instrumento' ? (window.__mus.S.inst || 'piano') : null };
  }
  const stepId = () => STEPS[run.track][run.step][0];
  function canNext() {
    const s = stepId(), qs = run.track === 'vocal' ? Q_VOC : Q_INST;
    if (s === 'inst') return !!run.inst;
    if (s === 'auto') return qs.every(q => run.answers[q[0]] != null);
    if (s === 'teoria') return run.quiz.every((q, i) => run.quizAns[i] != null);
    if (s === 'ouvido') return run.ear.every((q, i) => run.earAns[i] != null);
    if (s === 'afinacao') return !!run.region && [0, 1, 2].every(i => run.pitch[i] && run.pitch[i].score != null);
    if (s === 'extensao') return run.range.low && run.range.high && run.range.high > run.range.low;
    if (s === 'sustentacao') return run.sustain && run.sustain.secs != null;
    return true;
  }
  function next() {
    if (!canNext()) { C.toast('Responda todas as questões desta etapa para continuar (ou use “Pular”, quando disponível).'); return; }
    C.stopAll();
    run.step++;
    if (stepId() === 'resultado' && !run.result) {
      run.result = compute(); db.history.push(run.result); saveDb();
      X.plano?.onResult?.(run.result);
    }
    window.__mus.render();
    requestAnimationFrame(() => $('.section-heading')?.scrollIntoView({ block: 'start' }));
  }

  /* ---------- Telas ---------- */
  const stepper = () => `<ol class="pv-steps" aria-label="Etapas da prova">${STEPS[run.track].map(([, l], i) => `<li class="${i === run.step ? 'now' : i < run.step ? 'done' : ''}"${i === run.step ? ' aria-current="step"' : ''}><span>${i + 1}</span>${l}</li>`).join('')}</ol>`;
  const nav = (skip) => `<div class="pv-nav">${skip ? '<button class="soft-button" data-pact="skip">Pular esta etapa</button>' : ''}<button class="primary-button" data-pact="next">Continuar →</button></div>`;
  const quizHtml = (qs, ans, prefix, ear) => qs.map((q, i) => `<div class="pv-q" data-qi="${i}"><p><b>${i + 1}.</b> ${esc(q.q || q.text)}</p>${ear ? `<button class="play" data-pact="ear" data-i="${i}">▶ Ouvir${run.earPlays[i] ? ` (${run.earPlays[i]})` : ''}</button>` : ''}<div class="ext-options">${q.opts.map((o, k) => `<button type="button" class="ext-opt${ans[i] === k ? ' on' : ''}" aria-pressed="${ans[i] === k}" data-pq="${prefix}" data-i="${i}" data-k="${k}"><b>${esc(o)}</b></button>`).join('')}</div></div>`).join('');
  function landing() {
    const hist = db.history.slice().reverse();
    const last = t => latest(t);
    const card = (t, icon, title, desc, mins) => { const l = last(t); return `<article class="pv-choice"><span class="quick-icon ${t === 'vocal' ? 'violet' : 'green'}">${icon}</span><h3>${title}</h3><p>${desc}</p><p class="muted">${mins}</p>${l ? `<p>Último resultado: ${C.levelTag(l.level)} <small>${C.fmtDate(l.date)}${l.inst ? ' · ' + C.INSTRUMENTS[l.inst] : ''}</small></p>` : ''}<button class="primary-button" data-pact="begin" data-track="${t}">${l ? 'Refazer prova' : 'Começar prova'} →</button></article>`; };
    return `<div class="ext prova"><section class="card"><h2>Prova inicial de nivelamento</h2><p>Responda com sinceridade: a prova serve para montar um plano de estudo do seu tamanho, não para aprovar ou reprovar. Ao final, você recebe o nível (Iniciante, Básico, Intermediário ou Avançado), a pontuação por competência e um plano semanal.</p>
      <div class="pv-choices">${card('instrumento', '⌨', 'Prova de instrumento', 'Piano, violão/guitarra, baixo, ukulele ou cavaquinho. Autoavaliação, teoria, percepção com áudio e ritmo.', 'Cerca de 8 minutos · use som ligado')}${card('vocal', '◉', 'Prova vocal', 'Autoavaliação, afinação, extensão e sustentação (microfone opcional), percepção, ritmo e teoria básica.', 'Cerca de 10 minutos · ambiente silencioso')}</div></section>
      ${hist.length ? `<section class="card"><h2>Histórico</h2><div class="table-scroll"><table class="tbl pv-hist"><tr><th>Data</th><th>Prova</th><th>Nível</th><th>Geral</th><th>Teoria</th><th>Percepção</th><th>Ritmo</th><th>Técnica</th></tr>${hist.map(h => `<tr><td>${C.fmtDate(h.date)}</td><td>${h.track === 'vocal' ? 'Vocal' : 'Instrumento · ' + esc(C.INSTRUMENTS[h.inst] || '')}</td><td>${C.levelTag(h.level)}</td><td><b>${h.overall}</b></td>${['teoria', 'percepcao', 'ritmo', 'tecnica'].map(k => `<td>${h.scores[k] ?? '—'}</td>`).join('')}</tr>`).join('')}</table></div><div class="row"><button class="soft-button" data-go="plano">Ver meu plano →</button><button class="text-button" data-pact="clear">Apagar histórico deste navegador</button></div></section>` : ''}</div>`;
  }
  function screen() {
    const s = stepId(), head = `<div class="pv-head"><span class="eyebrow">PROVA ${run.track === 'vocal' ? 'VOCAL' : 'DE INSTRUMENTO'}</span>${stepper()}</div>`;
    let body = '';
    if (s === 'inst') body = `<h2>Qual instrumento você vai estudar?</h2>${C.options('inst', Object.entries(C.INSTRUMENTS).map(([k, v]) => [k, v]), run.inst)}${nav()}`;
    else if (s === 'auto') {
      const qs = run.track === 'vocal' ? Q_VOC : Q_INST;
      body = `<h2>Sobre você</h2><p class="muted">Escolha a opção mais próxima da sua realidade hoje.</p>${qs.map(([k, q, opts]) => `<div class="pv-q"><p><b>${esc(q)}</b></p>${C.options(k, opts.map(([v, l]) => [v, esc(l)]), run.answers[k])}</div>`).join('')}${nav()}`;
    } else if (s === 'teoria') body = `<h2>Teoria</h2><p class="muted">Questões geradas automaticamente pelo motor musical do aplicativo. Se não souber, escolha a que parecer mais provável.</p>${quizHtml(run.quiz, run.quizAns, 'quiz')}${nav()}`;
    else if (s === 'ouvido') body = `<h2>Percepção</h2><p class="muted">Toque em “Ouvir” (pode repetir) e escolha a resposta. Use fones ou volume confortável.</p>${quizHtml(run.ear, run.earAns, 'ear', true)}${nav()}`;
    else if (s === 'ritmo') {
      const r = run.rhythm;
      body = `<h2>Ritmo</h2><p>Ao iniciar, o metrônomo conta 4 tempos (80 BPM). Depois, toque no botão grande <b>junto com cada clique</b>, por 8 tempos. No computador, use também a barra de espaço.</p>
        <div class="rt-box"><div id="rt-dots" class="rt-dots" aria-hidden="true">${'<i></i>'.repeat(12)}</div><button id="rt-pad" class="rt-pad" aria-label="Toque no tempo">Toque aqui<br><small>no tempo do clique</small></button><p id="rt-msg" class="muted" aria-live="polite">${r ? `Resultado: acertou ${r.hits} de ${r.n} tempos${r.mean != null ? ` · desvio médio ${r.mean} ms${Math.abs(r.bias) > 20 ? (r.bias > 0 ? ' (tendência a atrasar)' : ' (tendência a adiantar)') : ''}` : ''} · pontuação ${r.score}` : 'Pronto quando você estiver.'}</p><button class="soft-button" data-pact="rhythm">${r ? '↺ Tentar de novo' : '▶ Iniciar teste de ritmo'}</button></div>${nav(true)}`;
    } else if (s === 'afinacao') {
      const reg = run.region;
      body = `<h2>Afinação</h2><p>Ouça a nota de referência e cante a mesma nota em “a”. Cantar uma oitava acima ou abaixo também vale.</p>${micBox()}
        <div class="pv-q"><p><b>Qual região é mais confortável para você?</b></p>${C.options('region', [['grave', 'Voz mais grave', 'geralmente masculina'], ['aguda', 'Voz mais aguda', 'geralmente feminina ou infantil']], reg)}</div>
        ${reg ? PITCH_REF[reg].map((m, i) => { const p = run.pitch[i]; return `<div class="pv-q pv-pm"><p><b>Nota ${i + 1}:</b> ${C.noteName(m)}</p><div class="row"><button class="play" data-pact="ref" data-m="${m}">▶ Ouvir referência</button><button class="soft-button" data-pact="sing" data-i="${i}">🎤 Cantar e medir</button></div><p id="pm-${i}" class="muted" aria-live="polite">${p ? (p.mode === 'mic' ? (p.score != null ? `Desvio: ${p.cents >= 0 ? '+' : ''}${p.cents} cents · ${p.score} pontos` : esc(p.msg)) : 'Autoavaliação registrada.') : ''}</p><p class="muted">Sem microfone, avalie você mesmo depois de cantar:</p>${C.options('pm' + i, [['80', 'Afinei com facilidade'], ['45', 'Fiquei em dúvida'], ['15', 'Não consegui']], p && p.mode === 'auto' ? String(p.score) : null, 'sm')}</div>`; }).join('') : ''}${nav()}`;
    } else if (s === 'extensao') {
      const r = run.range, reg = run.region || 'grave', defLow = reg === 'grave' ? 43 : 55, defHigh = reg === 'grave' ? 64 : 76;
      if (!r.low) r.low = defLow; if (!r.high) r.high = defHigh;
      const opts = sel => { let h = ''; for (let m = 36; m <= 88; m++) h += `<option value="${m}"${m === sel ? ' selected' : ''}>${C.noteName(m)}</option>`; return h; };
      const cl = classify(r.low, r.high);
      body = `<h2>Extensão confortável</h2><p>Não procure o extremo: escolha notas que você canta <b>sem esforço e sem dor</b>.</p>${micBox()}
        <div class="row"><button class="soft-button" data-pact="range" data-w="low">🎤 Medir nota grave</button><button class="soft-button" data-pact="range" data-w="high">🎤 Medir nota aguda</button></div><p id="rg-msg" class="muted" aria-live="polite">${esc(run.rangeMsg || '')}</p>
        <div class="row pv-range"><label class="vx-field">Nota mais grave confortável<select id="pv-low">${opts(r.low)}</select></label><button class="play" data-pact="ref" data-m="${r.low}">▶</button><label class="vx-field">Nota mais aguda confortável<select id="pv-high">${opts(r.high)}</select></label><button class="play" data-pact="ref" data-m="${r.high}">▶</button></div>
        <p>Região: <b>${C.noteName(r.low)} – ${C.noteName(r.high)}</b> (${r.high - r.low} semitons)${cl ? ` · classificação aproximada: <b>${cl}</b>` : ''}</p><p class="muted">Use “▶” para ouvir e comparar. A classificação é apenas uma estimativa: depende também de timbre, tessitura e passagens.</p>${nav()}`;
    } else if (s === 'sustentacao') {
      const su = run.sustain;
      body = `<h2>Sustentação</h2><p>Inspire e sustente um “a” em uma nota confortável, em volume médio, pelo maior tempo possível <b>sem forçar</b>.</p>${micBox()}
        <div class="row"><button class="soft-button" data-pact="sustain">🎤 Medir com microfone</button><button class="soft-button" data-pact="sw">${sw.on ? '■ Parei' : '⏱ Cronômetro: começar'}</button></div>
        <p id="su-msg" class="muted" aria-live="polite">${su && su.secs != null ? `Tempo sustentado: <b>${su.secs} s</b> (${su.mode === 'mic' ? 'microfone' : 'cronômetro'})` : su ? 'Voz não detectada. Tente de novo ou use o cronômetro.' : 'Referência: adultos costumam sustentar de 15 a 25 segundos.'}</p>${nav(true)}`;
    } else if (s === 'resultado') body = resultHtml(run.result, true);
    return `<div class="ext prova"><section class="card pv-card">${head}${body}</section></div>`;
  }
  function resultHtml(r, fresh) {
    const ks = ['teoria', 'percepcao', 'ritmo', 'tecnica'];
    const weakest = ks.filter(k => r.scores[k] != null).sort((a, b) => r.scores[a] - r.scores[b])[0];
    const v = r.vocal;
    return `<div class="pv-result"><div class="pv-level"><span class="eyebrow">SEU NÍVEL ${r.track === 'vocal' ? 'VOCAL' : 'NO ' + esc((C.INSTRUMENTS[r.inst] || '').toUpperCase())}</span><h2>${C.levelTag(r.level)}</h2><p class="pv-overall"><b>${r.overall}</b>/100 pontos gerais</p></div>
      <div class="pv-bars">${ks.map(k => `<div class="pv-bar"><span>${compLabel(k, r.track)}</span><div class="bar"><i style="width:${r.scores[k] ?? 0}%"></i></div><b>${r.scores[k] ?? 'não avaliado'}</b></div>`).join('')}</div>
      ${v ? `<p>Região confortável: <b>${v.low ? C.noteName(v.low) + ' – ' + C.noteName(v.high) : '—'}</b>${v.classif ? ` · classificação aproximada: <b>${v.classif}</b>` : ''}${v.sustain != null ? ` · sustentação: <b>${v.sustain} s</b>` : ''}</p>` : ''}
      ${v && v.desconforto >= 2 ? '<div class="ext-alert"><b>Atenção à saúde vocal.</b> Você relatou desconforto frequente. O plano usa cargas leves; procure um otorrinolaringologista e um fonoaudiólogo, principalmente se houver dor ou rouquidão por mais de 2 semanas.</div>' : ''}
      <p class="muted">${weakest ? `Prioridade sugerida: <b>${compLabel(weakest, r.track)}</b>. ` : ''}O nível considera a experiência declarada de forma conservadora. Refaça a prova ao concluir o plano ou a cada 4 a 8 semanas.</p>
      <div class="row"><button class="primary-button" data-go="plano" data-go-preset='${C.attr({ track: r.track })}'>Ver meu plano de estudo →</button>${fresh ? '<button class="soft-button" data-pact="home">Voltar às provas</button>' : ''}<button class="soft-button" data-go="hoje">Ir para Hoje</button></div></div>`;
  }
  function render() { C.setFocus('Prova de nível'); return run ? screen() : landing(); }
  function after() { }
  function latest(track) { for (let i = db.history.length - 1; i >= 0; i--) if (db.history[i].track === track) return db.history[i]; return null; }

  document.addEventListener('click', async ev => {
    if (document.body.dataset.sec !== 'prova') return;
    const b = ev.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (d.opt && run) {
      const v = d.optv;
      if (d.opt === 'inst') run.inst = v;
      else if (d.opt === 'region') { run.region = v; run.pitch = []; run.range = {}; window.__mus.render(); return; }
      else if (/^pm\d$/.test(d.opt)) { run.pitch[+d.opt[2]] = { mode: 'auto', score: +v }; }
      else run.answers[d.opt] = v;
      $$(`[data-opt="${d.opt}"]`).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); });
      return;
    }
    if (d.pq && run) {
      const arr = d.pq === 'quiz' ? run.quizAns : run.earAns;
      arr[+d.i] = +d.k;
      $$(`[data-pq="${d.pq}"][data-i="${d.i}"]`).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
      return;
    }
    switch (d.pact) {
      case 'begin': begin(d.track); window.__mus.render(); break;
      case 'next': next(); break;
      case 'skip': if (stepId() === 'ritmo') run.rhythm = null; if (stepId() === 'sustentacao') run.sustain = null; run.step++; if (stepId() === 'resultado' && !run.result) { run.result = compute(); db.history.push(run.result); saveDb(); X.plano?.onResult?.(run.result); } window.__mus.render(); break;
      case 'home': run = null; window.__mus.render(); break;
      case 'ear': { const i = +d.i; run.earPlays[i] = (run.earPlays[i] || 0) + 1; playEar(run.ear[i]); b.textContent = `▶ Ouvir (${run.earPlays[i]})`; break; }
      case 'rhythm': run.rhythm = null; startRhythm(); b.textContent = 'Em andamento…'; break;
      case 'mic': await enableMic(); window.__mus.render(); break;
      case 'ref': playRef(+d.m); break;
      case 'sing': singMatch(+d.i); break;
      case 'range': recordRange(d.w); break;
      case 'sustain': recordSustain(); break;
      case 'sw': if (!sw.on) { sw.on = true; sw.t = performance.now(); b.textContent = '■ Parei'; $('#su-msg').textContent = 'Cronômetro rodando… toque em “Parei” quando o som acabar.'; } else { sw.on = false; run.sustain = { mode: 'auto', secs: Math.round((performance.now() - sw.t) / 100) / 10 }; window.__mus.render(); } break;
      case 'clear': if (confirm('Apagar o histórico de provas salvo neste navegador?')) { db.history = []; saveDb(); X.plano?.onResult?.(null); window.__mus.render(); } break;
    }
  });
  document.addEventListener('change', ev => {
    if (document.body.dataset.sec !== 'prova' || !run) return;
    if (ev.target.id === 'pv-low' || ev.target.id === 'pv-high') { run.range[ev.target.id === 'pv-low' ? 'low' : 'high'] = +ev.target.value; run.range.mode = run.range.mode || 'manual'; window.__mus.render(); }
  });

  X.prova = {
    render, after, latest, history: () => db.history.slice(), classify, theoryQuiz, compute: () => compute(), resultHtml,
    preset(sec, p) { if (sec === 'prova') { if (p.track === 'vocal' || p.track === 'instrumento') { if (!run || run.track !== p.track || run.result) begin(p.track); } else if (run?.result) run = null; } },
    _run: () => run, _rhythm: () => rhythm
  };
})();
