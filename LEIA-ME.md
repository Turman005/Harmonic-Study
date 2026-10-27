# Estudo Musical — versão 2 (Canto, Prova de nível e Metodologias)

## Novidades da versão 2

- **Hoje** (nova tela inicial): nível de instrumento e de canto, sessão do dia, sequência de dias e atalhos.
- **Canto**: teoria (respiração, apoio, ressonância, registros, afinação, dicção), biblioteca com 21 exercícios em 7 categorias, rotinas de 5, 10 e 20 minutos por nível, técnica e saúde vocal.
- **Modelo de demonstração**: o piano toca a referência; o piano-roll/karaokê mostra cada nota e a vogal; a respiração tem animação de inspirar/segurar/soltar. Controles de andamento, nota inicial, transposição de meio tom, direção, repetição e acorde guia.
- **Microfone (opcional)**: com permissão, mostra a linha da sua afinação sobre as notas e uma pontuação (% do tempo a até ±50 cents). Funciona apenas em HTTPS ou em `localhost`/`127.0.0.1`. Sem permissão, tudo continua funcionando com guia sonoro e animação. O áudio não é gravado nem enviado.
- **Prova de nível**: trilha de instrumento (piano, violão, baixo, ukulele ou cavaquinho) e trilha vocal. Tudo é medido dentro do aplicativo: teoria, percepção, ritmo, afinação, extensão e sustentação. Sem microfone, use autoavaliação, a seleção manual e o cronômetro. O resultado mostra o nível (Iniciante, Básico, Intermediário ou Avançado) e o detalhamento por competência. Ele fica guardado no navegador, com histórico, e a prova pode ser refeita. A experiência declarada limita o nível de forma conservadora.
- **Meu plano**: metodologia de 4 a 8 semanas conforme o nível. Cada sessão diária tem blocos de aquecimento, técnica, repertório, percepção e teoria. Os botões abrem diretamente o módulo certo. Há checklist, sequência de dias e critérios para avançar ou refazer a prova. Se houver desconforto frequente na voz, o plano é cauteloso (até 20 min) e mostra um alerta de saúde.
- A classificação vocal é **aproximada**. Este aplicativo não substitui professor, fonoaudiólogo ou otorrinolaringologista. Rouquidão por mais de 2 semanas, dor ou perda de voz: procure avaliação.


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
- `assets/ext.js`: núcleo dos módulos novos (áudio, navegação `go()`, armazenamento, níveis e instrumentos).
- `assets/pitch.js`: detecção de altura (YIN) e microfone.
- `assets/vocal-dados.js`, `assets/vocal.js`: conteúdo e tela do Canto (exercícios, rotinas, demonstração).
- `assets/prova.js`: prova de nível. `assets/plano.js`: metodologias, plano e tela Hoje.
- `assets/ext.css`: estilos dos módulos novos, no mesmo visual.
- Os scripts novos carregam **antes** de `engine.js`, que lê `window.__musExt` para desenhar as seções Hoje, Canto, Prova de nível e Meu plano.
- Dados no navegador (localStorage): `estudoMusicalVocal`, `estudoMusicalProva`, `estudoMusicalPlano`, além das preferências originais.
- Para reconstruir o HTML independente: `python3 ../ferramentas/build_standalone.py . ../estudo-musical.html`. O script incorpora no HTML os mesmos CSS/JS desta pasta.
- Versão atual do cache: `estudo-musical-v2-20261027-1`. Para publicar uma atualização, incremente `VERSION` em `sw.js` e inclua novos arquivos na lista `FILES`. A nova versão aguarda o fechamento das abas antigas para ativar. Não use o mesmo nome de cache para uma publicação diferente.

## Validação

Consulte `../validacao/RELATORIO.md` para os testes realmente executados e as limitações. A entrega não foi publicada em hospedagem nem instalada em aparelhos físicos.

## Referências de compatibilidade

- [Apple: usar um site como app no iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)
- [MDN: requisitos de instalação de PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

Instalação requer HTTPS (ou localhost para desenvolvimento); abrir um arquivo local não instala uma PWA.
