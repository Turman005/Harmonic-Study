/* Metodologias por nível: plano semanal gerado a partir da prova, sessão do dia, checklist, sequência e painel "Hoje". */
(() => {
  'use strict';
  const X = window.__musExt = window.__musExt || {};
  const C = X.core;
  const { esc, $, $$ } = C;
  const KEY = 'estudoMusicalPlano';
  const db = Object.assign({ plans: {}, active: null, log: {}, checks: {}, form: {} }, C.load(KEY, {}));
  const save = () => C.save(KEY, db);
  const NIVEL = C.LEVELS;
  const WEEKS = [8, 6, 6, 4];
  const KEYS = [[0, 7, 5, 9], [0, 7, 2, 5, 9, 4], [7, 2, 5, 10, 9, 3, 4, 0], [1, 6, 8, 11, 3, 10, 5, 0]];
  const PC = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const BPM = [60, 70, 84, 96];
  const BLOCKS = [['aquecimento', 'Aquecimento'], ['tecnica', 'Técnica'], ['repertorio', 'Repertório'], ['percepcao', 'Percepção'], ['teoria', 'Teoria']];
  const SPLIT = { instrumento: [.10, .30, .30, .15, .15], vocal: [.25, .30, .25, .10, .10] };

  const OBJ = {
    instrumento: [
      ['Postura e mãos relaxadas, sem tensão', 'Notas naturais e localização no instrumento', 'Acordes maiores e menores básicos em C, G, F e Am', 'Trocar acordes no tempo com metrônomo lento (60 BPM)', 'Tocar uma música simples do começo ao fim'],
      ['Campo harmônico maior em tríades em 6 tonalidades', 'Escala maior e pentatônica com dedilhado consistente', 'Ritmos de acompanhamento do seu estilo', 'Reconhecer 3ªs, 5ªs e acordes maiores e menores de ouvido', 'Repertório de 3 a 5 músicas com cifra'],
      ['Tétrades e inversões; campo harmônico em tétrades', 'Escalas em duas oitavas e posições no braço/teclado', 'Cadências ii–V–I e dominantes secundários', 'Percepção de tétrades e progressões', 'Tocar em andamento original e começar a improvisar'],
      ['Modos gregos e escalas menores harmônica e melódica aplicados', 'Tensões, acordes alterados e rearmonização', 'Improvisação sobre ii–V–I em todas as tonalidades', 'Ditado de progressões e intervalos compostos', 'Repertório avançado com leitura e arranjo próprio']
    ],
    vocal: [
      ['Respiração costo-diafragmática e postura', 'Fonação equilibrada, sem soprosidade nem golpe', 'SOVT diário (lip trill, humming, canudo)', 'Afinar 5 notas em região média', 'Cantar uma música simples em uma oitava'],
      ['Apoio respiratório em frases longas', 'Suavizar a passagem com sirenes e vogais fechadas', 'Arpejos e legato', 'Afinação estável dentro de ±25 cents', 'Repertório de 3 músicas com intenção e dicção clara'],
      ['Voz mista na região de passagem', 'Agilidade e staccato preciso', 'Messa di voce e controle dinâmico', 'Extensão útil de cerca de 1 oitava e meia', 'Interpretação: frase, dinâmica e estilo'],
      ['Coordenação entre registros em toda a extensão', 'Agilidade rápida (melismas, riffs) com afinação', 'Dinâmica ampla sem perder qualidade', 'Leitura melódica e repertório desafiador', 'Resistência vocal com saúde (aquecer, desaquecer, descansar)']
    ]
  };
  const ADVANCE = {
    instrumentoN: [
      ['Trocar 4 acordes básicos no tempo a 70 BPM sem parar', 'Tocar a escala de C maior com dedilhado correto', 'Acertar 80% dos intervalos 3ªM e 5ªJ no treino de ouvido', 'Tocar 2 músicas completas'],
      ['Montar o campo harmônico maior de 6 tonalidades', 'Tocar escala maior e pentatônica a 90 BPM em colcheias', 'Reconhecer acordes maiores e menores com 85% de acerto', 'Repertório de 4 músicas no andamento original'],
      ['Tétrades e inversões em todas as tonalidades usadas', 'ii–V–I em 6 tonalidades, sem parar', 'Reconhecer 7M, 7 e m7 de ouvido com 80% de acerto', 'Improvisar 16 compassos sobre uma progressão'],
      ['ii–V–I e modos nas 12 tonalidades', 'Rearmonizar uma música e tocá-la', 'Ditado de progressões de 4 acordes', 'Repertório de nível avançado com leitura']
    ],
    vocalN: [
      ['Sustentar 15 s com som estável', 'Lip trill ou humming de uma 5ª sem quebras', 'Afinação acima de 70% no modo microfone em 5 notas', 'Cantar uma música inteira sem cansaço'],
      ['Sustentar 20 s', 'Sirene de oitava sem quebra evidente', 'Arpejo com afinação acima de 75%', 'Três músicas com dicção clara'],
      ['Messa di voce controlada em 3 notas', 'Nove notas e agilidade em 100 BPM', 'Passagem estável em voz mista', 'Extensão útil de cerca de 1 oitava e meia'],
      ['Agilidade a 120 BPM com afinação acima de 80%', 'Dinâmica ampla em todo o repertório', 'Leitura melódica de trechos simples', 'Ensaios longos sem rouquidão no dia seguinte']
    ]
  };
  const TEC = {
    piano: [['Mãos separadas, dedos curvos, polegar passando sob a mão na escala', 'Tríades em posição fundamental com a mão direita, baixo na esquerda', 'Mãos juntas em escalas de uma oitava'], ['Inversões de tríades para conduzir as vozes', 'Acompanhamento: baixo + acorde em ritmo do estilo', 'Escalas em 2 oitavas, mãos juntas'], ['Voicings de tétrades sem a fundamental (3ª e 7ª)', 'Arpejos de tétrades em 2 oitavas', 'Walking bass simples na mão esquerda'], ['Voicings com tensões (9, 11, 13) e quartais', 'Escalas alteradas e diminutas', 'Independência: melodia na direita com comping na esquerda']],
    violao: [['Postura, pestana apenas parcial, mão direita com polegar alternado', 'Acordes abertos: C, G, Am, Em, D, F simplificado', 'Batida básica em 4 tempos'], ['Pestana completa (F, Bm) com pausas para relaxar', 'Escala maior em uma região do braço', 'Ritmos: samba, balada e toada'], ['Tétrades com fundamental na 6ª e 5ª corda', 'Escalas em sistema de 3 notas por corda', 'Levadas de bossa nova e de violão de 7 cordas, quando for o caso'], ['Drop 2 e acordes com tensões', 'Arpejos e modos em todo o braço', 'Improviso com conexão entre posições']],
    baixo: [['Postura, alternância de dedos indicador e médio, abafamento', 'Fundamentais dos acordes em semínimas', 'Fundamental e quinta'], ['Tríades arpejadas e notas de passagem', 'Escala maior em uma oitava, digitação de 1 dedo por casa', 'Grooves de pop e samba'], ['Walking bass com arpejos de tétrades', 'Escalas em 2 oitavas', 'Slap básico ou levadas do estilo'], ['Walking em todas as tonalidades', 'Modos e cromatismos de aproximação', 'Solos e grooves em semicolcheias']],
    ukulele: [['Afinação GCEA, dedilhado com o indicador', 'Acordes C, Am, F, G7', 'Batida básica para baixo e para cima'], ['Acordes D, Em, A, E7 e trocas rápidas', 'Escala de C maior nas 4 cordas', 'Ritmos de reggae e calipso'], ['Tétrades e inversões no braço', 'Dedilhados (fingerpicking) e melodia com acorde', 'Chord melody simples'], ['Acordes com tensões e rearmonização', 'Escalas em todo o braço', 'Arranjos solo completos']],
    cavaquinho: [['Afinação DGBD, palheta com movimento de punho', 'Acordes básicos: D, G, A7, Em', 'Levada de samba lenta'], ['Ciclo de acordes em várias posições', 'Escala de D maior e de G maior', 'Levadas de pagode e choro'], ['Tétrades, diminutos e inversões', 'Escalas para solo de choro', 'Centro e variações de levada'], ['Repertório de choro com solo', 'Encadeamentos cromáticos e substituições', 'Improviso e variação melódica']]
  };
  const VTEC = [['resp-446', 'lip-trill', 'humming', 'gliss-quinta', 'cinco-notas', 'vogais', 'canudo', 'legato'], ['resp-pulsos', 'sirene-oitava', 'cinco-notas', 'arpejo', 'staccato', 'legato'], ['oitava', 'nove-notas', 'staccato', 'messa', 'agilidade', 'consoantes'], ['nove-notas', 'agilidade', 'messa', 'oitava']];
  const REP = {
    instrumento: [w => `Música com até 4 acordes do campo de ${PC[w.pc]} maior, no andamento ${w.bpm} BPM com metrônomo`, w => `Progressão I–V–vi–IV em ${PC[w.pc]} no ritmo do seu estilo, depois uma música completa`, w => `ii–V–I em ${PC[w.pc]} e uma música do estilo no andamento original`, w => `Rearmonize uma música em ${PC[w.pc]} e improvise um chorus`],
    vocal: [() => 'Música simples, de extensão de cerca de uma oitava: primeiro em “lu”, depois com a letra', () => 'Frase a frase: respiração marcada na letra, legato e dicção', () => 'Interpretação: dinâmica, intenção e estilo; grave-se e ouça', () => 'Repertório desafiador por trechos: agilidade, extensão e dinâmica']
  };
  const TEO = {
    instrumento: [[['Tons e semitons; notas naturais e acidentes', 'tom'], ['Escala maior: fórmula T-T-S-T-T-T-S', 'esc'], ['Tríades maiores e menores', 'acd']], [['Campo harmônico maior', 'campo'], ['Funções: tônica, subdominante e dominante', 'campo'], ['Tonalidade relativa menor', 'tom']], [['Tétrades e cifras', 'acd'], ['Dominantes secundários e ii–V', 'prog'], ['Escalas menores harmônica e melódica', 'esc']], [['Modos gregos e aplicação', 'mod'], ['Empréstimo modal e substituição de trítono', 'prog'], ['Acordes alterados e tensões', 'acd']]],
    vocal: [[['Notas, tons e semitons', 'tom'], ['Escala maior', 'esc'], ['Ler cifras', 'acd']], [['Intervalos para afinação', 'int'], ['Campo harmônico e tonalidade', 'campo'], ['Compasso e figuras rítmicas', 'glos']], [['Tonalidade e transposição', 'tom'], ['Modos e cor melódica', 'mod'], ['Análise da música do repertório', 'prog']], [['Leitura melódica', 'esc'], ['Harmonia do repertório', 'campo'], ['Modos e escalas menores', 'mod']]]
  };
  const EAR = [['Intervalos: 2ª maior, 3ª maior e 5ª justa', 'intervalos'], ['Intervalos de 2ª a 8ª e acordes maiores/menores', 'acordes'], ['Tétrades e intervalos de 6ª e 7ª', 'acordes'], ['Todos os intervalos e qualidades de acorde', 'acordes']];

  /* ---------- Geração ---------- */
  function splitMinutes(total, track) {
    const parts = SPLIT[track].map(p => Math.max(2, Math.round(total * p)));
    let diff = total - parts.reduce((a, b) => a + b, 0), i = 1;
    while (diff !== 0) { const step = diff > 0 ? 1 : -1; if (parts[i] + step >= 2) { parts[i] += step; diff -= step; } i = (i + 1) % parts.length; }
    return parts;
  }
  function makePlan({ track, inst, level, minutes, days, resultId = null, caution = false }) {
    level = C.clamp(+level || 0, 0, 3); minutes = +minutes || 30; days = +days || 5;
    if (caution) { level = Math.min(level, 1); minutes = Math.min(minutes, 20); }
    return { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), track, inst: track === 'instrumento' ? (inst || 'piano') : null, level, minutes, days, weeks: WEEKS[level], start: C.dayKey(), resultId, caution };
  }
  function week(plan, w) {
    const L = plan.level, phase = Math.min(2, Math.floor(3 * w / plan.weeks)), pc = KEYS[L][w % KEYS[L].length], bpm = BPM[L] + 4 * Math.min(w, 6);
    const mins = splitMinutes(plan.minutes, plan.track), info = { pc, bpm, phase };
    const b = {};
    if (plan.track === 'instrumento') {
      const inst = plan.inst, tec = TEC[inst][L][phase];
      const MODES = ['jônio', 'dórico', 'frígio', 'lídio', 'mixolídio', 'eólio', 'lócrio'];
      if (L === 3) { const mi = (w + 1) % 7; b.aquecimento = { txt: `Modo ${MODES[mi]} de ${PC[pc]} em duas oitavas, ${bpm} BPM`, go: ['mod', { pc, modeIdx: mi, inst, dock: true, bpm }], btn: 'Abrir modo no instrumento' }; }
      else { const scale = L === 0 ? 'maior' : L === 1 ? (w % 2 ? 'pentaM' : 'maior') : (w % 2 ? 'harm' : 'maior'); b.aquecimento = { txt: `Escala de ${PC[pc]} ${scale === 'maior' ? 'maior' : scale === 'pentaM' ? 'pentatônica maior' : 'menor harmônica'} lenta, ${bpm} BPM`, go: ['esc', { pc, scaleId: scale, inst, dock: true, bpm }], btn: 'Abrir escala no instrumento' }; }
      b.tecnica = L <= 1 ? { txt: `${tec}. Acordes do campo de ${PC[pc]} maior (${L ? 'tríades, trocas no tempo' : 'maiores e menores'})`, go: ['campo', { pc, fieldType: 'maior', fieldSize: 3, inst, dock: true }], btn: 'Abrir campo harmônico' }
        : L === 2 ? { txt: `${tec}. Tétrades do campo de ${PC[pc]} maior`, go: ['campo', { pc, fieldType: w % 3 === 2 ? 'menor' : 'maior', fieldSize: 4, inst, dock: true }], btn: 'Abrir campo em tétrades' }
          : { txt: `${tec}. Acordes com tensões em ${PC[pc]}`, go: ['acd', { pc, chordType: ['9', '13', '7alt', 'm11'][w % 4], inst, dock: true }], btn: 'Abrir acorde' };
      b.repertorio = { txt: REP.instrumento[L]({ pc, bpm }), go: ['prog', { pc, bpm, inst, dock: true }], btn: 'Abrir progressões' };
    } else {
      const ex = VTEC[L][w % VTEC[L].length], warm = mins[0] < 8 ? 5 : mins[0] < 18 ? 10 : 20, vd = X.vocalData?.byId(ex);
      b.aquecimento = { txt: `Rotina de aquecimento de ${warm} min (${NIVEL[L]})`, go: ['vocal', { routine: `${L}:${warm}` }], btn: '▶ Iniciar rotina' };
      b.tecnica = { txt: `${vd ? vd.nome : ex}: ${vd ? vd.objetivo : ''}`, go: ['vocal', { vx: ex }], btn: '▶ Abrir demonstração' };
      b.repertorio = { txt: REP.vocal[L](), go: ['prog', { pc, bpm }], btn: 'Acompanhamento' };
    }
    b.percepcao = { txt: EAR[L][0], go: ['int', { ear: true }], btn: 'Treino de ouvido' };
    const teo = TEO[plan.track][L][phase];
    b.teoria = { txt: teo[0], go: [teo[1], { pc }], btn: 'Abrir assunto' };
    BLOCKS.forEach(([k], i) => { b[k].min = mins[i]; });
    if (plan.track === 'vocal') b.desaquecimento = true;
    return Object.assign(info, { blocks: b, tema: ['Fundamentos', 'Consolidação', 'Aplicação'][phase] });
  }

  /* ---------- Progresso ---------- */
  const checks = plan => db.checks[plan.id] || (db.checks[plan.id] = {});
  function nextSession(plan) {
    const ch = checks(plan);
    for (let w = 0; w < plan.weeks; w++) for (let d = 0; d < plan.days; d++) if (!ch[`${w}-${d}`]) return { w, d };
    return null;
  }
  function logToday(track) { const k = C.dayKey(); db.log[k] = Array.from(new Set([...(db.log[k] || []), track])); save(); }
  function streak() {
    let n = 0; const d = new Date();
    if (!db.log[C.dayKey(d)]) d.setDate(d.getDate() - 1);
    while (db.log[C.dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function progress(plan) { const total = plan.weeks * plan.days, done = Object.values(checks(plan)).filter(Boolean).length; return { done, total, pct: total ? Math.round(100 * done / total) : 0 }; }
  function markSession(plan) {
    const n = nextSession(plan); if (!n) return false;
    checks(plan)[`${n.w}-${n.d}`] = true; logToday(plan.track); save(); return true;
  }

  /* ---------- Telas ---------- */
  const goBtn = (go, label, cls = 'soft-button') => `<button class="${cls}" data-go="${go[0]}" data-go-preset='${C.attr(go[1])}'>${esc(label)}</button>`;
  const planTitle = p => p.track === 'vocal' ? 'Canto' : C.INSTRUMENTS[p.inst];
  function sessionHtml(plan, compact) {
    const n = nextSession(plan);
    if (!n) return `<div class="pl-done"><b>Plano concluído! 🎉</b><p>Refaça a prova para medir sua evolução e gerar o próximo plano.</p>${goBtn(['prova', { track: plan.track }], 'Refazer a prova', 'primary-button')}</div>`;
    const wk = week(plan, n.w);
    return `<div class="pl-session"><p class="eyebrow">SEMANA ${n.w + 1} DE ${plan.weeks} · SESSÃO ${n.d + 1} DE ${plan.days} · ${wk.tema.toUpperCase()} · TOM DA SEMANA: ${PC[wk.pc]}</p>
      <ol class="pl-blocks">${BLOCKS.map(([k, l]) => { const b = wk.blocks[k]; return `<li class="pl-block pl-${k}"><div><span class="pl-min">${b.min} min</span><b>${l}</b><p>${esc(b.txt)}</p></div>${goBtn(b.go, b.btn)}</li>`; }).join('')}${plan.track === 'vocal' ? `<li class="pl-block"><div><span class="pl-min">2 min</span><b>Desaquecimento</b><p>Suspiros descendentes e lip trill suave para encerrar.</p></div>${goBtn(['vocal', { vx: 'desaq-suspiro' }], '▶ Desaquecer')}</li>` : ''}</ol>
      <div class="row"><button class="primary-button" data-pl="mark" data-track="${plan.track}">✓ Marcar sessão como concluída</button>${compact ? goBtn(['plano', { track: plan.track }], 'Ver plano completo') : ''}</div></div>`;
  }
  function planHtml(plan) {
    const pr = progress(plan), ch = checks(plan), adv = plan.track === 'vocal' ? ADVANCE.vocalN : ADVANCE.instrumentoN;
    const res = X.prova?.history().find(h => h.id === plan.resultId);
    return `<section class="card pl-summary"><div class="pl-top"><div><span class="eyebrow">METODOLOGIA · ${esc(planTitle(plan)).toUpperCase()}</span><h2>Plano de ${plan.weeks} semanas ${C.levelTag(plan.level)}</h2><p class="muted">${plan.days} dias por semana × ${plan.minutes} min · início em ${C.fmtDate(plan.start + 'T12:00:00')}${res ? ` · baseado na prova de ${C.fmtDate(res.date)} (${res.overall} pontos)` : ' · nível escolhido manualmente'}</p></div><div class="pl-ring" style="--p:${pr.pct}"><b>${pr.pct}%</b><small>${pr.done}/${pr.total}</small></div></div>
      ${plan.caution ? '<div class="ext-alert">Plano em modo cauteloso por causa do desconforto vocal relatado: sessões curtas, volume moderado e foco em SOVT. Procure um otorrinolaringologista e um fonoaudiólogo se houver dor ou rouquidão por mais de 2 semanas.</div>' : ''}
      <h3>Objetivos deste nível</h3><ul class="ext-list">${OBJ[plan.track][plan.level].map(o => `<li>${esc(o)}</li>`).join('')}</ul>
      <h3>Divisão de cada sessão</h3><div class="pl-split">${BLOCKS.map(([k, l], i) => `<span class="pl-${k}" style="flex:${splitMinutes(plan.minutes, plan.track)[i]}"><b>${l}</b>${splitMinutes(plan.minutes, plan.track)[i]} min</span>`).join('')}</div></section>
      <section class="card"><h2>Sessão de hoje</h2>${sessionHtml(plan)}</section>
      <section class="card"><h2>Semanas</h2><div class="pl-weeks">${Array.from({ length: plan.weeks }, (_, w) => { const wk = week(plan, w); return `<details class="theory pl-week"${nextSession(plan)?.w === w ? ' open' : ''}><summary>Semana ${w + 1} · ${wk.tema} · tom ${PC[wk.pc]} · ${wk.bpm} BPM <span class="pl-cells">${Array.from({ length: plan.days }, (_, d) => `<button class="pl-cell${ch[`${w}-${d}`] ? ' on' : ''}" data-pl="chk" data-w="${w}" data-d="${d}" aria-pressed="${!!ch[`${w}-${d}`]}" aria-label="Semana ${w + 1}, sessão ${d + 1}">${ch[`${w}-${d}`] ? '✓' : d + 1}</button>`).join('')}</span></summary><ul class="ext-list">${BLOCKS.map(([k, l]) => `<li><b>${l} (${wk.blocks[k].min} min):</b> ${esc(wk.blocks[k].txt)} ${goBtn(wk.blocks[k].go, wk.blocks[k].btn, 'text-button')}</li>`).join('')}</ul></details>`; }).join('')}</div></section>
      <section class="card"><h2>Critérios para avançar</h2><p class="muted">Avance quando cumprir a maior parte destes critérios com conforto. Na dúvida, repita a última semana: consolidar é mais eficiente do que correr.</p><ul class="pl-crit">${adv[plan.level].map(c => `<li>☐ ${esc(c)}</li>`).join('')}</ul><div class="row">${goBtn(['prova', { track: plan.track }], 'Refazer a prova', 'primary-button')}<button class="text-button" data-pl="reset" data-track="${plan.track}">Recomeçar o plano</button></div><p class="muted">Sugestão: refaça a prova ao fim do plano ou a cada ${plan.weeks} semanas.</p></section>`;
  }
  function manualForm() {
    const f = db.form = Object.assign({ track: 'instrumento', inst: 'violao', level: '0', minutes: '30', days: '5' }, db.form);
    return `<section class="card"><h2>Sem prova? Monte um plano manual</h2><p class="muted">Recomendamos a prova, mas você pode escolher o nível agora e ajustar depois.</p>
      <div class="pv-q"><p><b>Plano para</b></p>${C.options('pl-track', [['instrumento', 'Instrumento'], ['vocal', 'Canto']], f.track)}</div>
      ${f.track === 'instrumento' ? `<div class="pv-q"><p><b>Instrumento</b></p>${C.options('pl-inst', Object.entries(C.INSTRUMENTS), f.inst)}</div>` : ''}
      <div class="pv-q"><p><b>Nível</b></p>${C.options('pl-level', NIVEL.map((n, i) => [String(i), n]), f.level)}</div>
      <div class="pv-q"><p><b>Minutos por dia</b></p>${C.options('pl-minutes', [['15', '15'], ['30', '30'], ['45', '45'], ['60', '60']], f.minutes)}</div>
      <div class="pv-q"><p><b>Dias por semana</b></p>${C.options('pl-days', [['3', '3'], ['5', '5'], ['6', '6']], f.days)}</div>
      <button class="primary-button" data-pl="manual">Criar plano</button></section>`;
  }
  let view = null;
  function renderPlano() {
    C.setFocus('Meu plano');
    const tracks = Object.keys(db.plans).filter(t => db.plans[t]);
    if (view && !db.plans[view]) view = null;
    const cur = view || db.active || tracks[0];
    const tabs = tracks.length > 1 ? `<div class="ext-tabs seg">${tracks.map(t => `<button class="${t === cur ? 'on' : ''}" data-pl="view" data-track="${t}">${t === 'vocal' ? 'Canto' : esc(C.INSTRUMENTS[db.plans[t].inst])}</button>`).join('')}</div>` : '';
    const missing = ['instrumento', 'vocal'].filter(t => !db.plans[t]);
    return `<div class="ext plano">${tabs}${cur ? planHtml(db.plans[cur]) : `<section class="card"><h2>Você ainda não tem um plano</h2><p>Faça a prova inicial para receber uma metodologia de acordo com o seu nível.</p><div class="row">${goBtn(['prova', { track: 'instrumento' }], 'Prova de instrumento', 'primary-button')}${goBtn(['prova', { track: 'vocal' }], 'Prova vocal', 'primary-button')}</div></section>`}
      ${missing.length && cur ? `<section class="card"><p>Quer também um plano de ${missing.map(t => t === 'vocal' ? 'canto' : 'instrumento').join(' e ')}? ${missing.map(t => goBtn(['prova', { track: t }], t === 'vocal' ? 'Fazer prova vocal' : 'Fazer prova de instrumento')).join(' ')}</p></section>` : ''}${manualForm()}</div>`;
  }
  function renderHoje() {
    C.setFocus('Hoje');
    const s = streak(), now = new Date();
    const date = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const levelCard = t => {
      const r = X.prova?.latest(t), p = db.plans[t];
      return `<article class="hj-level"><span class="quick-icon ${t === 'vocal' ? 'violet' : 'green'}">${t === 'vocal' ? '◉' : '⌨'}</span><div><span class="eyebrow">${t === 'vocal' ? 'CANTO' : 'INSTRUMENTO'}${p?.inst ? ' · ' + esc(C.INSTRUMENTS[p.inst]).toUpperCase() : r?.inst ? ' · ' + esc(C.INSTRUMENTS[r.inst]).toUpperCase() : ''}</span>${r || p ? `<p>${C.levelTag((p || r).level)} ${r ? `<small>${r.overall} pontos · ${C.fmtDate(r.date)}</small>` : ''}</p>${p ? `<div class="bar"><i style="width:${progress(p).pct}%"></i></div><small>${progress(p).pct}% do plano</small>` : ''}` : '<p class="muted">Nível ainda não avaliado</p>'}</div>${p ? goBtn(['plano', { track: t }], 'Plano') : goBtn(['prova', { track: t }], 'Fazer prova', 'primary-button')}</article>`;
    };
    const act = db.active && db.plans[db.active] ? db.plans[db.active] : null;
    const vl = db.plans.vocal?.level ?? X.prova?.latest('vocal')?.level ?? 0;
    const quick = [
      ['vocal', { routine: `${vl}:5` }, '◉', 'Aquecimento vocal', '5 minutos guiados', 'violet'],
      ['vocal', { vtab: 'exercicios', vx: 'lip-trill' }, '♪', 'Demonstração', 'Lip trill com piano-roll', 'violet'],
      ['esc', { dock: true }, '♫', 'Escala do dia', 'Veja no instrumento', 'green'],
      ['int', { ear: true }, '◎', 'Treino de ouvido', 'Intervalos e acordes', 'amber'],
      ['campo', {}, '▦', 'Campo harmônico', 'Acordes da tonalidade', 'green'],
      ['prog', { metro: true }, '♩', 'Metrônomo', 'Progressões e ritmo', 'amber']
    ];
    return `<div class="ext hoje"><section class="card hj-hello"><div><span class="eyebrow">${esc(date.toUpperCase())}</span><h2>Bom estudo!</h2><p class="muted">Pouco por dia, todos os dias: 15 minutos com foco valem mais que 2 horas uma vez por semana.</p></div><div class="hj-streak" aria-label="Sequência de dias de estudo"><b>${s}</b><small>${s === 1 ? 'dia seguido' : 'dias seguidos'}</small></div></section>
      <div class="hj-levels">${levelCard('instrumento')}${levelCard('vocal')}</div>
      <section class="card"><h2>Sessão de hoje${act ? ` · ${esc(planTitle(act))}` : ''}</h2>${act ? sessionHtml(act, true) : `<p>Faça a prova inicial para receber a rotina diária ideal para o seu nível. Enquanto isso, experimente um aquecimento rápido.</p><div class="row">${goBtn(['prova', { track: 'instrumento' }], 'Prova de instrumento', 'primary-button')}${goBtn(['prova', { track: 'vocal' }], 'Prova vocal', 'primary-button')}</div>`}</section>
      <section class="card"><h2>Começo rápido</h2><div class="quick-actions hj-quick">${quick.map(([sec, p, ic, t, d, col]) => `<button data-go="${sec}" data-go-preset='${C.attr(p)}'><span class="quick-icon ${col}">${ic}</span><span><b>${t}</b><small>${d}</small></span></button>`).join('')}</div></section></div>`;
  }

  document.addEventListener('click', ev => {
    const sec = document.body.dataset.sec;
    if (sec !== 'plano' && sec !== 'hoje') return;
    const b = ev.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (d.opt && d.opt.startsWith('pl-')) { db.form[d.opt.slice(3)] = d.optv; save(); if (d.opt === 'pl-track') window.__mus.render(); else $$(`[data-opt="${d.opt}"]`).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); }); return; }
    switch (d.pl) {
      case 'mark': { const p = db.plans[d.track]; if (p && markSession(p)) C.toast('Sessão concluída! ✓ Sua sequência foi atualizada.'); window.__mus.render(); break; }
      case 'chk': { const p = db.plans[view || db.active]; if (!p) return; const k = `${d.w}-${d.d}`, ch = checks(p); ch[k] = !ch[k]; if (ch[k]) logToday(p.track); save(); window.__mus.render(); break; }
      case 'view': view = d.track; db.active = d.track; save(); window.__mus.render(); break;
      case 'reset': if (confirm('Recomeçar o plano e apagar as marcações?')) { const p = db.plans[d.track]; db.checks[p.id] = {}; p.start = C.dayKey(); save(); window.__mus.render(); } break;
      case 'manual': { const f = db.form, p = makePlan({ track: f.track, inst: f.inst, level: f.level, minutes: f.minutes, days: f.days }); db.plans[p.track] = p; db.active = p.track; view = p.track; save(); C.toast('Plano criado.'); window.__mus.render(); break; }
    }
  });

  X.plano = {
    render: renderPlano, after() {}, week, makePlan, splitMinutes, streak, nextSession, progress, db: () => db,
    onResult(r) {
      if (!r) return;
      const a = r.answers || {};
      const p = makePlan({ track: r.track, inst: r.inst, level: r.level, minutes: a.tempo, days: a.dias, resultId: r.id, caution: r.track === 'vocal' && r.vocal?.desconforto >= 2 });
      db.plans[r.track] = p; db.active = r.track; view = r.track; save();
      if (r.track === 'vocal' && r.vocal?.low && X.vocal) X.vocal.voiceFromProva();
    },
    logActivity: logToday,
    preset(sec, p) { if (sec === 'plano' && (p.track === 'vocal' || p.track === 'instrumento') && db.plans[p.track]) { view = p.track; db.active = p.track; save(); } }
  };
  X.hoje = { render: renderHoje, after() {} };
})();
