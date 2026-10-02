/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_BP_SITE_URL?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_UPDATER_ENABLED?: string;
  /** Buscador de músicas (ligado por padrão; false/0 desliga). */
  readonly VITE_BRS_MUSIC_SEARCH_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
