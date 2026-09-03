/**
 * Auto-update (Tauri Updater). Desativado até existir endpoint e chaves reais.
 * Ver UPDATER.md na raiz do app.
 */
import { APP_VERSION } from "./api/config";

const UPDATER_ENABLED = import.meta.env.VITE_UPDATER_ENABLED === "true";

export function isUpdaterConfigured() {
  return UPDATER_ENABLED;
}

export async function checkForAppUpdates(): Promise<{ checked: boolean; message: string }> {
  if (!UPDATER_ENABLED) {
    return {
      checked: false,
      message: "Atualizações automáticas ainda não estão disponíveis nesta versão.",
    };
  }

  // Quando o updater for ativado: instalar @tauri-apps/plugin-updater e @tauri-apps/plugin-process,
  // habilitar tauri-plugin-updater no Rust e configurar endpoints em tauri.conf.json.
  return {
    checked: false,
    message: `Versão atual: ${APP_VERSION}. Configure o updater conforme UPDATER.md.`,
  };
}
