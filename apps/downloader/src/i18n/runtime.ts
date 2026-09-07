import { translate, type MessageKey } from "./translate";
import { normalizeLocale, type AppLocale } from "./types";

/** Locale atual para código fora do React (notificações, updater, etc.). */
let runtimeLocale: AppLocale = "pt-BR";

export function setRuntimeLocale(locale: AppLocale) {
  runtimeLocale = normalizeLocale(locale);
}

export function getRuntimeLocale(): AppLocale {
  return runtimeLocale;
}

export function tRuntime(key: MessageKey, vars?: Record<string, string | number>): string {
  return translate(runtimeLocale, key, vars);
}
