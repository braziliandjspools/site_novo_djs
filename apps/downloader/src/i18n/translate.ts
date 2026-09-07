import type { AppLocale } from "./types";
import { messagesEn } from "./messages/en";
import { messagesEs } from "./messages/es";
import { messagesPtBR } from "./messages/pt-BR";

export type MessageKey = keyof typeof messagesPtBR;

const catalogs: Record<AppLocale, Record<MessageKey, string>> = {
  "pt-BR": messagesPtBR,
  en: messagesEn,
  es: messagesEs,
};

export function translate(
  locale: AppLocale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const template = catalogs[locale][key] ?? catalogs["pt-BR"][key] ?? String(key);
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] != null ? String(vars[name]) : `{${name}}`,
  );
}
