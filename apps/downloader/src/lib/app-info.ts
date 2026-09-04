/** Versões exibidas em Configurações → Sobre. Atualize junto com package.json / tauri.conf / Cargo.toml. */
export const WEBUI_VERSION = "0.4.0";
export const APP_CORE_VERSION = "0.4.0";
/** Versão do compilador Rust usada no build do núcleo nativo. */
export const RUSTC_VERSION = "1.98.0";

export type ChangelogEntry = {
  version: string;
  date: string;
  items: string[];
};

export const APP_CHANGELOG: ChangelogEntry[] = [
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
