import type { MessageKey } from "../i18n/translate";

/** Versões exibidas em Configurações → Sobre. Atualize junto com package.json / tauri.conf / Cargo.toml. */
export const WEBUI_VERSION = "1.0.35";
export const APP_CORE_VERSION = "1.0.35";
/** Versão do compilador Rust usada no build do núcleo nativo. */
export const RUSTC_VERSION = "1.98.1";

export type ChangelogEntry = {
  version: string;
  date: string;
  /** Itens em português; versões anteriores ao suporte multilíngue. */
  items: string[];
  /** Quando presente, a UI traduz estas chaves e ignora `items`. */
  itemKeys?: MessageKey[];
};

export const APP_CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.0.35",
    date: "2026-10-06",
    items: [
      "Busca de músicas com cards coloridos, sem player fixo no rodapé",
      "Menu com texto realçado no hover e acabamento escuro alinhado ao site BRS",
    ],
  },
  {
    version: "1.0.33",
    date: "2026-10-05",
    items: [
      "Interface premium em preto e branco com hover azul no menu e nos itens inteiros",
      "Pesquisar músicas redesenhado com lista mais profissional e player refinado",
    ],
  },
  {
    version: "1.0.32",
    date: "2026-10-05",
    items: [
      "Hover azul claro sutil nos itens da pesquisa, fila e downloads",
      "Play/pause sempre visível na capa das faixas na pesquisa",
    ],
  },
  {
    version: "1.0.31",
    date: "2026-10-05",
    items: [
      "Pesquisa e player redesenhados em preto e branco, com faixa anterior e próxima",
      "Fila, Downloads e shell com visual mais limpo no tema escuro",
    ],
  },
  {
    version: "1.0.30",
    date: "2026-10-05",
    items: [
      "Pesquisa, Fila e Downloads com visual escuro e hover verde sutil nos itens",
    ],
  },
  {
    version: "1.0.29",
    date: "2026-10-02",
    items: [
      "Pesquisa redesenhada em tema escuro/branco com banner no topo",
      "Logo Cloudflare no Sobre, indicando a tecnologia usada no site",
    ],
  },
  {
    version: "1.0.28",
    date: "2026-10-02",
    items: [
      "Player abre abaixo da faixa e avança para a próxima da pesquisa ao terminar",
      "Seleção múltipla para baixar várias músicas de uma vez",
      "Mostra o acervo de cada faixa com botão para ver no catálogo",
      "WhatsApp para pedir inclusão quando a busca não encontra resultados",
      "Capa da tag da música (fallback para capa padrão BRS)",
    ],
  },
  {
    version: "1.0.27",
    date: "2026-10-02",
    items: [
      "Corrige preview do buscador: CSP libera áudio remoto (media-src)",
      "Mensagens mais claras quando o player não consegue carregar a faixa",
    ],
  },
  {
    version: "1.0.26",
    date: "2026-10-02",
    items: [
      "Tema 100% escuro: remove magenta/rosa, links e textos em branco",
      "Hero com saudação BEM-VINDO + nome do usuário",
    ],
  },
  {
    version: "1.0.25",
    date: "2026-10-02",
    items: [
      "Visual Windows 11: tema escuro minimalista, botões escuros e tipografia Segoe",
      "Buscador de músicas no catálogo BRS com preview e download pela fila atual",
    ],
  },
  {
    version: "1.0.24",
    date: "2026-10-02",
    items: [
      "Preparação do buscador de músicas (desligado por padrão; teste local via flag)",
      "Área isolada de pesquisa/preview sem alterar o fluxo de download atual",
    ],
  },
  {
    version: "1.0.23",
    date: "2026-09-30",
    items: [
      "A janela de dias abre por cima da tela inteira, centralizada",
      "O rodapé com os botões deixa de ficar escondido",
    ],
  },
  {
    version: "1.0.22",
    date: "2026-09-30",
    items: [
      "A janela de dias abre no centro e cabe inteira na tela",
      "O download grava Mês, depois a pool, o estilo e as músicas",
    ],
  },
  {
    version: "1.0.21",
    date: "2026-09-30",
    items: [
      "Tema magenta e escuro em todo o app",
      "A janela de dias fecha no X e pode ser arrastada",
    ],
  },
  {
    version: "1.0.20",
    date: "2026-09-30",
    items: [
      "Escolha do dia em magenta e preto, abaixo do topo",
      "Barra de dias à esquerda e pools à direita",
      "Mostra quantas tracks e pools o dia selecionado tem",
    ],
  },
  {
    version: "1.0.19",
    date: "2026-09-30",
    items: [
      "Ao colar o link de um mês, o app pergunta qual dia baixar",
      "Dentro do dia dá para marcar a pool inteira ou só os estilos",
      "Só o que foi marcado entra na fila, ainda em blocos de 200",
    ],
  },
  {
    version: "1.0.18",
    date: "2026-09-30",
    items: [
      "Importar por link fica na capa inicial, sem o texto de boas-vindas",
      "Download por URL em blocos de 200, com pausa de 8 minutos a cada 600 faixas",
      "Aviso para marcar só o necessário no site; backup do acervo pelo site é proibido",
    ],
  },
  {
    version: "1.0.17",
    date: "2026-09-28",
    items: [
      "Novo painel com indicadores interativos e navegação refinada",
      "Busca e filtros de atividade com pausa, retomada e nova tentativa no início",
      "Velocidade ao vivo, foco de teclado e suporte a movimento reduzido",
    ],
  },
  {
    version: "1.0.16_estable",
    date: "2026-09-27",
    items: [
      "Correção da cota do Google Drive: o fallback baixa pelo servidor como dono da conta",
      "Interface redesenhada: tipografia Outfit, barra Brasil, sidebar e fila mais limpas",
    ],
  },
  {
    version: "1.0.15_estable",
    date: "2026-09-20",
    items: [
      "Downloads simultâneos configuráveis (1 a 10; padrão 3) em Configurações",
      "TXT de falhas na pasta de destino com nome da música e motivo, pronto para enviar ao suporte",
    ],
  },
  {
    version: "1.0.14_estable",
    date: "2026-09-19",
    items: [
      "Downloads um arquivo por vez (mais estáveis; opção de simultâneos removida)",
      "Removida a organização por metadados na fila/histórico",
      "Em falhas, grava TXT na pasta de destino com o nome da música e a pasta do pack",
    ],
  },
  {
    version: "1.0.13_estable",
    date: "2026-09-18",
    items: [
      "Removido o bloqueio/alerta de abuso de download — fila e downloads liberados normalmente",
      "Banner de abuso removido da interface",
    ],
  },
  {
    version: "1.0.12_estable",
    date: "2026-09-17",
    items: [
      "Alerta e ban por abuso de download (Plano Teste / loop do acervo) com aviso no app",
      "Integração OneSignal: campanhas da plataforma e bridge para notificações nativas no Windows",
      "Ativar/desativar push OneSignal em Configurações",
    ],
  },
  {
    version: "1.0.11_estable",
    date: "2026-09-15",
    items: [
      "Importar link de artista (/musicas/artistas/…) e enfileirar faixas do perfil",
      "Validação de link mais tolerante (localhost e URLs coladas do site)",
      "Textos do painel de importação atualizados para pasta ou artista",
    ],
  },
  {
    version: "1.0.10_estable",
    date: "2026-09-11",
    items: [
      "Uma única instância no Windows — abrir de novo só foca a janela já aberta",
      "Uma conexão por conta VIP: outro PC assume e este encerra a fila",
      "Nova imagem de hero na Home",
    ],
  },
  {
    version: "1.0.9_estable",
    date: "2026-09-10",
    items: [
      "Home com hero BRS e tipografia maior nos cards, sidebar e fila",
      "Avisos de sync, offline e erros em toasts (sem banners fixos)",
    ],
  },
  {
    version: "1.0.8_estable",
    date: "2026-09-10",
    items: [
      "Novo visual: tipografia Nunito arredondada, textos menores e interface mais limpa",
      "Sidebar, login, home e fila com densidade moderna e botões arredondados",
    ],
  },
  {
    version: "1.0.7_estable",
    date: "2026-09-10",
    items: [
      "Corrige início com o Windows: reaplica o registro no boot e atualiza o caminho do .exe após updates",
      "Toggle de autostart desfaz na UI se o Windows recusar o registro",
    ],
  },
  {
    version: "1.0.6_estable",
    date: "2026-09-08",
    items: [
      "Corrige abertura do instalador com elevação UAC (erro 740)",
      "Popup centralizado de nova versão no login e ao verificar atualizações",
      "Se a elevação falhar, abre a pasta do instalador e o download no navegador",
    ],
  },
  {
    version: "1.0.5_estable",
    date: "2026-09-08",
    items: [
      "Coleções: download sempre preserva volumes/subpastas (ignora preferência de pastas planas)",
      "Reconhece links /musicas/colecoes/... no import de pasta",
      "Primeira versão estável pública",
    ],
  },
  {
    version: "1.0.4_public_beta",
    date: "2026-09-08",
    items: [
      "Reconhece links de pasta do navegador (/musicas/atualizacoes/... e /musicas/colecoes/...)",
      "Atualização baixa o instalador por dentro do app (sem abrir o navegador)",
      "Botão WhatsApp de suporte no header e em Configurações",
    ],
  },
  {
    version: "1.0.3_public_beta",
    date: "2026-09-07",
    items: [
      "Corrige painel do sininho aparecendo atrás do conteúdo da página",
      "Header e notificações com z-index na frente do restante da interface",
    ],
  },
  {
    version: "1.0.2_public_beta",
    date: "2026-09-07",
    items: [
      "Corrige login/sessão com o domínio canônico www.brazilianremixservice.com.br",
      "Evita perda do token quando o apex redireciona (308) para www",
      "Atualiza URL padrão da API e dicas em Configurar servidor",
    ],
  },
  {
    version: "1.0.1_public_beta",
    date: "2026-09-07",
    items: [
      "Servidor padrão atualizado para www.brazilianremixservice.com.br",
      "Corrige sessão quando o domínio sem www redirecionava e removia o token",
      "Links da plataforma e atualizações apontam para o domínio canônico",
    ],
  },
  {
    version: "1.0.0_public_beta",
    date: "2026-09-07",
    items: [
      "Visual refinado: tipografia Google Sans Flex, painéis e botões mais polidos",
      "Login e onboarding de idioma com atmosfera renovada",
      "Sidebar e shell com hierarquia mais clara e detalhes de movimento",
      "Primeira beta pública 1.0 do BRS Downloader",
    ],
  },
  {
    version: "0.5.1_beta",
    date: "2026-09-07",
    items: [
      "Notificações do sininho e do Windows traduzidas conforme o idioma",
      "Avisos de plano e de atualização respeitam pt-BR, en e es",
    ],
  },
  {
    version: "0.5.0_beta",
    date: "2026-09-07",
    items: [
      "App em três idiomas: português, inglês e espanhol",
      "Tela de escolha de idioma na primeira abertura",
      "Troca de idioma em Configurações, aplicada na hora",
      "Textos revisados em toda a interface, incluindo notificações",
    ],
    itemKeys: [
      "changelogV050betaItem1",
      "changelogV050betaItem2",
      "changelogV050betaItem3",
      "changelogV050betaItem4",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-09-04",
    items: [
      "Login automático após reiniciar o PC (sessão salva em keyring + arquivo de fallback)",
      "Não apaga mais a sessão quando a rede falha na abertura do app",
      "Botão para reconectar com a sessão salva sem digitar a senha",
      "Retries mais longos no bootstrap após reboot",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-09-03",
    items: [
      "Sininho unificado: plano, downloads e atualizações do app",
      "Aviso de nova versão in-app com link de download do instalador",
      "Portal no app com dados reais de plano e serviços",
      "Compressão ZIP opcional após o download",
      "Bloqueio de login quando o plano VIP está vencido",
      "Estabilidade de sessão e login no Downloader",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-09-03",
    items: [
      "Gerenciamento avançado da fila: baixar agora, mover topo/cima/baixo/final, pausar, retomar e cancelar",
      "Ordem da fila local com drag-and-drop e persistência ao reiniciar (sem spam no servidor)",
      "Importar pasta por link do site: validar, ver quantidade de faixas e baixar todas",
      "Agendamento de downloads por janela de horário",
      "Limite global de velocidade de download",
      "Espaço em disco e tamanho da fila em tempo real",
      "App inicia maximizado e mantém a seção ativa",
      "Histórico atualizado em tempo real; exclusão de falhas da fila",
      "Links de privacidade, cookies e conduta",
      "Visual cinza escuro com botões coloridos",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-08-01",
    items: [
      "Primeira versão do BRS Downloader (Tauri + WebUI)",
      "Fila sincronizada com a plataforma VIP",
      "Downloads nativos via núcleo Rust",
      "Pasta de destino, bandeja e preferências do Windows",
    ],
  },
];
