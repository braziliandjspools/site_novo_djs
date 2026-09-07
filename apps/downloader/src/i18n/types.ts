export const APP_LOCALES = ["pt-BR", "en", "es"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  "pt-BR": "Português (Brasil)",
  en: "English",
  es: "Español",
};

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "pt-BR" || value === "en" || value === "es";
}

export function normalizeLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : "pt-BR";
}
