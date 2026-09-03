/** Versões exibidas em Configurações → Sobre. Atualize junto com package.json / tauri.conf / Cargo.toml. */
export const WEBUI_VERSION = "0.2.0";
export const APP_CORE_VERSION = "0.2.0";
/** Versão do compilador Rust usada no build do núcleo nativo. */
export const RUSTC_VERSION = "1.98.0";

export type ChangelogEntry = {
  version: string;
  date: string;
  items: string[];
};

export const APP_CHANGELOG: ChangelogEntry[] = [
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
