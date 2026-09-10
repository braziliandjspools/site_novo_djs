import type { MessageKey } from "../i18n/translate";

/** Versões exibidas em Configurações → Sobre. Atualize junto com package.json / tauri.conf / Cargo.toml. */
export const WEBUI_VERSION = "1.0.8_estable";
export const APP_CORE_VERSION = "1.0.8_estable";
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
      "Ordem da fila local com drag-and-drop e persistência ao reiniciar (sem spam no Neon)",
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
