export const APP_NAME = "Brazilian Packs Downloader";

/** URL da plataforma de músicas no site (configurável via .env). */
export const BP_MUSICAS_URL =
  import.meta.env.VITE_BP_SITE_URL ?? "http://localhost:3000/musicas/atualizacoes";
