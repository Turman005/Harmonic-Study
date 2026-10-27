/* Melhoria progressiva: interface, acessibilidade e instalação opcional. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const music = window.__mus;
  if (!music) return;
  const sectionInfo = {
    tom: ['◷', 'Tonalidades', 'ENCONTRE O SEU TOM', 'Explore o ciclo de quintas, as armaduras e as relações entre tonalidades.'],
    esc: ['♬', 'Escalas', 'EXPLORAR E OUVIR', 'Escolha uma escala, ouça as notas e encontre cada posição no instrumento.'],
    mod: ['≋', 'Modos gregos', 'OUTRAS CORES PARA O MESMO TOM', 'Compare os sete modos e ouça as notas que dão identidade a cada um.'],
    campo: ['▦', 'Campo harmônico', 'ACORDES QUE CAMINHAM JUNTOS', 'Entenda as funções dos acordes e experimente cadências em qualquer tom.'],
    acd: ['♮', 'Acordes', 'MONTE E EXPERIMENTE', 'Explore fórmulas, inversões e posições. Toque no teclado para identificar acordes.'],
    int: ['◉', 'Intervalos', 'ESCUTE COM ATENÇÃO', 'Conheça as distâncias entre as notas e pratique o reconhecimento de ouvido.'],
    prog: ['⇢', 'Progressões', 'COLOQUE A HARMONIA EM MOVIMENTO', 'Ouça sequências de acordes de diferentes estilos, transpostas para o seu tom.'],
    glos: ['▤', 'Glossário', 'CONSULTE QUANDO PRECISAR', 'Encontre o significado dos termos usados durante o estudo.']
  };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let toastTimer, lastSection = music.S.sec, pendingInstall = null;
  let returnFocus = null, menuReturnFocus = null;
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
  }
  function showDialog(id) {
    closeMenu();
    returnFocus = document.activeElement;
    const dialog = $(id);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else { dialog.setAttribute('open', ''); dialog.setAttribute('aria-modal', 'true'); }
  }
  function closeDialog(dialog) {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }
  function openMenu() {
    menuReturnFocus = document.activeElement;
    $('#sidebar').inert = false;
    document.body.classList.add('menu-open');
    $('#menu-backdrop').hidden = false;
    $('#open-menu').setAttribute('aria-expanded', 'true');
    $('#sidebar').setAttribute('aria-modal', 'true');
    $('#sidebar').setAttribute('role', 'dialog');
    $('#close-menu').focus();
  }
  function closeMenu() {
    const wasOpen = document.body.classList.contains('menu-open');
    document.body.classList.remove('menu-open');
    $('#menu-backdrop').hidden = true;
    $('#open-menu').setAttribute('aria-expanded', 'false');
    $('#sidebar').removeAttribute('aria-modal');
    $('#sidebar').removeAttribute('role');
    $('#sidebar').inert = matchMedia('(max-width:700px)').matches;
    if (wasOpen && menuReturnFocus?.isConnected) menuReturnFocus.focus({ preventScroll: true });
  }
  function scrollToElement(element) {
    element?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
  }
  function showInstrument() {
    if (!music.S.dock) $('#docktog').click();
    scrollToElement($('#dock'));
  }
  function markButtons() {
    $$('button[data-set],button[data-pc],button[data-inst],button[data-lbl],button[data-clef],button[data-ctype],button[data-cpc],button[data-scale],button[data-mode],button[data-ft],button[data-fs]').forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('on'))));
    $$('#tabs button').forEach(button => {
      const selected = button.dataset.sec === music.S.sec;
      if (selected) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    $$('.mobile-nav [data-sec]').forEach(button => {
      button.classList.toggle('on', button.dataset.sec === music.S.sec);
      if (button.dataset.sec === music.S.sec) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    $('#metro').setAttribute('aria-pressed', String($('#metro').classList.contains('on')));
  }
  function enhanceNotes(root) {
    $$('[data-play-note],[data-midi],[data-key],[data-shape],tr[data-mode]', root).forEach(element => {
      if (element.tagName === 'BUTTON') return;
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
      let label = element.textContent.trim().replace(/\s+/g, ' ');
      if (element.dataset.midi) {
        const midi = Number(element.dataset.midi);
        const notes = ['Dó', 'Dó sustenido', 'Ré', 'Ré sustenido', 'Mi', 'Fá', 'Fá sustenido', 'Sol', 'Sol sustenido', 'Lá', 'Lá sustenido', 'Si'];
        label = `${notes[midi % 12]}, oitava ${Math.floor(midi / 12) - 1}`;
        if (element.closest('.idpiano')) element.setAttribute('aria-pressed', String(element.classList.contains('sel')));
      }
      if (element.dataset.shape) label = `Posição ${Number(element.dataset.shape) + 1}: ${label}`;
      element.setAttribute('aria-label', label || 'Ouvir nota');
    });
    $$('[data-key]',root).forEach(el => {
      const [pc,type] = el.dataset.key.split(',');
      const notes = ['Dó','Dó sustenido','Ré','Mi bemol','Mi','Fá','Fá sustenido','Sol','Lá bemol','Lá','Si bemol','Si'];
      el.setAttribute('aria-label', `Escolher ${notes[Number(pc)]} ${type}`);
    });
  }
  function enhanceList() {
    const list = $('#main .side > .list');
    if (!list) return;
    const content = document.createElement('div');
    content.className = 'list-content';
    content.id = 'study-options';
    while (list.firstChild) content.append(list.firstChild);
    const selected = $('[data-scale].on,[data-ctype].on',content)?.textContent.trim() || 'Opções';
    const toggle = document.createElement('button');
    toggle.className = 'list-toggle';
    toggle.textContent = `Escolher ${music.S.sec === 'acd' ? 'acorde' : 'escala'} · ${selected} ⌄`;
    toggle.setAttribute('aria-expanded', String(innerWidth > 900));
    toggle.setAttribute('aria-controls',content.id);
    content.hidden = innerWidth <= 900;
    toggle.addEventListener('click', () => {
      content.hidden = !content.hidden;
      toggle.setAttribute('aria-expanded',String(!content.hidden));
    });
    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'list-filter';
    search.placeholder = music.S.sec === 'acd' ? 'Buscar acorde…' : 'Buscar escala…';
    search.setAttribute('aria-label', search.placeholder);
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    search.addEventListener('input', () => {
      const query = normalize(search.value.trim());
      $$('.cat',content).forEach(category => {
        $$('.li',category).forEach(button => { button.hidden = !normalize(button.textContent + ' ' + button.title).includes(query); });
        category.hidden = !$$('.li',category).some(button => !button.hidden);
      });
    });
    content.prepend(search);
    list.append(toggle,content);
  }
  function enhanceContent() {
    const info = sectionInfo[music.S.sec];
    $('#section-title').textContent = info[1];
    $('#section-kicker').textContent = info[2];
    $('#section-description').textContent = info[3];
    document.title = `${info[1]} · Estudo Musical`;
    $$('#main table').forEach(table => {
      const scroller = document.createElement('div');
      scroller.className = 'table-scroll';
      scroller.tabIndex = 0;
      scroller.setAttribute('role','region');
      scroller.setAttribute('aria-label','Tabela de estudo; deslize para ver todas as colunas');
      table.before(scroller);
      scroller.append(table);
    });
    enhanceList();
    enhanceNotes($('#main'));
    const ear = $('.earmsg');
    if (ear) { ear.setAttribute('role','status'); ear.setAttribute('aria-live','polite'); }
    const glossary = $('#gq');
    if(glossary) { glossary.type = 'search'; glossary.setAttribute('aria-label','Buscar termo no glossário'); }
    $$('.play', $('#main')).forEach(button => {
      if (button.textContent.trim() === '▶') button.setAttribute('aria-label', `Ouvir ${button.closest('tr,.cad')?.textContent.trim().replace(/\s+/g,' ').slice(0,160) || 'exemplo'}`);
    });
    $$('.cw.on').forEach(path => {
      const text = path.nextElementSibling;
      if (text?.tagName === 'text') text.classList.add('active-label');
    });
    markButtons();
    updateDock();
    if (lastSection !== music.S.sec) {
      lastSection = music.S.sec;
      closeMenu();
      scrollToElement($('.section-heading'));
    }
  }
  function updateDock() {
    const focus = music.focus();
    $('#transport-focus').textContent = focus?.title || 'Pronto para ouvir';
    $('#transport-bpm').textContent = music.S.bpm;
    $('#docktog').textContent = music.S.dock ? 'Recolher ↑' : 'Expandir ↓';
    $('#docktog').setAttribute('aria-expanded', String(music.S.dock));
    $('#dock-body').inert = !music.S.dock;
    enhanceNotes($('#dock'));
    markButtons();
  }
  const navigationIcons = sectionInfo;
  $$('#tabs button').forEach(button => {
    const entry = navigationIcons[button.dataset.sec];
    const icon = document.createElement('span'); icon.className = 'nav-icon'; icon.textContent = entry[0]; icon.setAttribute('aria-hidden','true');
    const label = document.createElement('span'); label.textContent = entry[1];
    button.replaceChildren(icon,label);
  });
  window.addEventListener('music:render',enhanceContent);
  window.addEventListener('music:dock',updateDock);
  window.addEventListener('music:audio-error',() => toast('O áudio não pôde ser ativado. Toque em Ouvir novamente ou abra em um navegador atualizado.'));
  $('#open-menu').addEventListener('click',openMenu);
  $('#mobile-explore').addEventListener('click',openMenu);
  $('#close-menu').addEventListener('click',closeMenu);
  $('#menu-backdrop').addEventListener('click',closeMenu);
  $('#settings-open').addEventListener('click',() => showDialog('#settings-dialog'));
  $('#transport-metro').addEventListener('click',() => { showDialog('#settings-dialog'); $('#bpm').focus(); });
  $('#show-instrument').addEventListener('click',showInstrument);
  $('#mobile-instrument').addEventListener('click',showInstrument);
  $('#quick-play').addEventListener('click',() => { music.unlock(); music.play(); });
  $('.brand').addEventListener('click', event => { event.preventDefault(); closeMenu(); window.scrollTo({top:0,behavior:reducedMotion?'instant':'smooth'}); });
  document.addEventListener('click',event => {
    if (event.target.closest('[data-help]')) showDialog('#help-dialog');
    const close = event.target.closest('[data-close]');
    if (close) closeDialog(close.closest('dialog'));
    if (event.target.closest('[data-sec]')) {
      closeMenu();
      if (event.target.closest('[data-ear-shortcut]')) requestAnimationFrame(() => scrollToElement($('.ear')));
    }
    if (event.target.closest('#metro,#stop')) requestAnimationFrame(markButtons);
    if (event.target.closest('[data-inst],[data-clef],[data-lbl]')) requestAnimationFrame(updateDock);
  });
  $('#bpm').addEventListener('input',event => { $('#transport-bpm').textContent = event.target.value; });
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('click',event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
  });
  document.addEventListener('keydown',event => {
    const interactive = event.target.closest('input,select,textarea,button,a,summary,[contenteditable="true"],[role="button"]');
    if (event.key === 'Escape') { music.stop(); closeMenu(); markButtons(); }
    if(document.body.classList.contains('menu-open')&&event.key === 'Tab') {
      const elements = $$('a,button', $('#sidebar')).filter(x=>x.getClientRects().length);
      const first = elements[0], last = elements[elements.length-1];
      if(event.shiftKey && document.activeElement===first) {event.preventDefault();last.focus();}
      if(!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[role="button"]:not(button)')) {
      event.preventDefault(); event.target.dispatchEvent(new MouseEvent('click',{bubbles:true})); return;
    }
    if (event.code === 'Space' && !interactive && !$('dialog[open]') && !document.body.classList.contains('menu-open')) {
      event.preventDefault(); music.unlock(); music.play();
    }
  });
  document.addEventListener('visibilitychange',() => { if(document.hidden) music.stop(); });
  window.addEventListener('pagehide',() => music.stop());
  const media = matchMedia('(max-width:900px)');
  media.addEventListener?.('change',() => {
    const content = $('.list-content');
    if(content) { content.hidden = media.matches; $('.list-toggle').setAttribute('aria-expanded',String(!media.matches)); }
  });
  matchMedia('(max-width:700px)').addEventListener?.('change',event => {if(!event.matches)closeMenu();});
  try {
    localStorage.setItem('music-storage-check','1');localStorage.removeItem('music-storage-check');
  } catch {
    $('#storage-note').textContent = 'O navegador bloqueou o armazenamento. As preferências serão mantidas apenas enquanto esta página estiver aberta.';
    $('.save-status').textContent = 'Preferências nesta sessão';
  }
  const hosted = /^https?:$/.test(location.protocol);
  function connectionStatus() {
    $('#connection-status').textContent = !hosted ? 'Arquivo independente' : navigator.onLine ? 'Pronto para estudar' : 'Você está offline';
  }
  connectionStatus();
  window.addEventListener('online',connectionStatus);
  window.addEventListener('offline',connectionStatus);
  $('#install-open').addEventListener('click',() => {
    $('#install-context').textContent = hosted ? 'Adicione o estudo à tela inicial para abrir em uma janela própria. A disponibilidade depende do navegador.' : 'Este arquivo funciona sozinho. Para instalar no celular, publique a pasta estudo-musical-app em um endereço HTTPS e abra esse endereço no navegador.';
    showDialog('#install-dialog');
  });
  window.addEventListener('beforeinstallprompt',event => {event.preventDefault();pendingInstall=event;$('#install-native').hidden=false;});
  $('#install-native').addEventListener('click',async () => {
    if(!pendingInstall)return;
    try { await pendingInstall.prompt(); await pendingInstall.userChoice; } catch {toast('Use o menu do navegador para instalar o aplicativo.');}
    pendingInstall=null;$('#install-native').hidden=true;
  });
  if(hosted && 'serviceWorker' in navigator && window.isSecureContext && $('link[rel="manifest"]')) {
    navigator.serviceWorker.register('./sw.js').then(async registration => {
      await navigator.serviceWorker.ready;
      $('#offline-status').textContent='A versão publicada está preparada para abrir offline após este primeiro acesso. O navegador pode remover o cache ao liberar espaço.';
      if(registration.waiting)toast('Há uma atualização disponível. Feche e abra o aplicativo para atualizar.');
    }).catch(() => {$('#offline-status').textContent='Não foi possível preparar o acesso offline. O estudo continua disponível enquanto a página estiver aberta.';});
  }
  enhanceContent();
  closeMenu();
})();
