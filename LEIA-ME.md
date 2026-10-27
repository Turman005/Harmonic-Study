# Estudo Musical

Versão responsiva criada a partir de `estudo-musical.html`, fornecido pelo usuário. O arquivo original em Downloads foi preservado. As fórmulas musicais e os recursos existentes foram reaproveitados.

## Abrir agora

Abra o arquivo **estudo-musical.html** que acompanha esta pasta em um navegador atualizado no computador. Ele reúne tudo em um único arquivo, sem CDN, login ou conexão obrigatória. Pré-visualizadores de arquivos e aplicativos de mensagens podem bloquear JavaScript: use um navegador.

Para usar em iPhone, iPad e Android, prefira o endereço web publicado. Não é necessário instalar para estudar pelo navegador.

## Publicar e instalar

Publique **todo o conteúdo desta pasta**, mantendo `index.html`, `manifest.webmanifest`, `sw.js` e `assets/` juntos, em uma hospedagem estática com **HTTPS**. O app aceita uma subpasta; os caminhos são relativos. Não precisa de banco de dados ou servidor de aplicação.

- iPhone/iPad: abra o endereço no Safari → Compartilhar → Adicionar à Tela de Início. Ative “Abrir como App da Web”, se essa opção aparecer.
- Android: abra no Chrome → menu → Instalar aplicativo ou Adicionar à tela inicial.
- Computador: Chrome/Edge podem oferecer a instalação pelo menu ou barra de endereço.

Os nomes das opções variam conforme a versão do sistema. O aplicativo funciona como site mesmo quando a instalação não estiver disponível. Não é um pacote nativo de App Store/Google Play.

Para testar localmente no computador, com Python instalado, execute `python -m http.server 8765 --bind 127.0.0.1` nesta pasta e abra `http://127.0.0.1:8765/`. `localhost` é uma exceção permitida ao requisito de HTTPS. Um endereço HTTP de rede local acessado pelo celular não oferece os mesmos recursos de instalação/cache.

## Offline, áudio e dados

- O HTML independente contém os recursos necessários para estudar sem internet.
- Na versão publicada, o primeiro acesso precisa de conexão. O service worker armazena os arquivos; após a instalação do cache, é possível reabrir offline. O navegador pode remover o cache ao liberar espaço.
- O áudio usa Web Audio e precisa de uma interação do usuário. Volume, modo silencioso, saída de áudio e restrições do sistema podem interferir na reprodução.
- “Parar” encerra notas, progressões e metrônomo. O som para quando a página fica oculta.
- As preferências ficam no navegador do dispositivo. Não há conta nem sincronização entre aparelhos. O treino de ouvido mantém o placar da sessão.
- Toque nas notas; deslize horizontalmente nas tabelas e nos instrumentos que ultrapassarem a largura da tela.
- No computador, espaço reproduz a seleção e Esc para o áudio. Controles interativos podem ser acionados com Enter/espaço.

## Manutenção

- `assets/engine.js`: motor musical original, com ajustes limitados de estado, áudio e eventos de integração.
- `assets/base.css`: estilos e fontes musicais incorporados do original.
- `assets/app.css`, `assets/app.js`: nova interface e melhorias progressivas.
- O gerador `../build_music.py` e `../music-shell.html` permitem reconstruir o HTML independente e a página publicada, mantendo as duas versões iguais. O caminho de origem está no gerador.
- Para publicar uma atualização, incremente `VERSION` em `sw.js`. A nova versão aguarda o fechamento das abas antigas para ativar. Não use o mesmo nome de cache para uma publicação diferente.

## Validação

Consulte `../validacao/RELATORIO.md` para os testes realmente executados e as limitações. A entrega não foi publicada em hospedagem nem instalada em aparelhos físicos.

## Referências de compatibilidade

- [Apple: usar um site como app no iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)
- [MDN: requisitos de instalação de PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

Instalação requer HTTPS (ou localhost para desenvolvimento); abrir um arquivo local não instala uma PWA.
