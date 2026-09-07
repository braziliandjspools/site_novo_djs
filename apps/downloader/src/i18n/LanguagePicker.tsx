import { Check } from "lucide-react";
import { useLocale } from "./LocaleContext";
import { APP_LOCALES, LOCALE_LABELS, isAppLocale, type AppLocale } from "./types";
import type { MessageKey } from "./translate";

type LanguagePickerVariant = "cards" | "select" | "compact";

type LanguagePickerProps = {
  value: AppLocale;
  onChange: (locale: AppLocale) => void;
  /** `cards` no onboarding, `select` em Configurações, `compact` no canto do login. */
  variant?: LanguagePickerVariant;
  className?: string;
  disabled?: boolean;
};

const FLAGS: Record<AppLocale, string> = {
  "pt-BR": "🇧🇷",
  en: "🇺🇸",
  es: "🇪🇸",
};

/** Sigla curta usada na variante compacta. */
const SHORT_LABELS: Record<AppLocale, string> = {
  "pt-BR": "PT",
  en: "EN",
  es: "ES",
};

/** Nome do idioma traduzido para o idioma atual da interface. */
const NAME_KEYS: Record<AppLocale, MessageKey> = {
  "pt-BR": "languagePortuguese",
  en: "languageEnglish",
  es: "languageSpanish",
};

export function LanguagePicker({
  value,
  onChange,
  variant = "cards",
  className = "",
  disabled = false,
}: LanguagePickerProps) {
  const { t } = useLocale();

  if (variant === "select") {
    return (
      <select
        value={value}
        disabled={disabled}
        aria-label={t("languageChooseLanguage")}
        onChange={(event) => {
          if (isAppLocale(event.target.value)) onChange(event.target.value);
        }}
        className={`rounded-lg border border-white/[0.08] bg-[#121212] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#1db954]/50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {APP_LOCALES.map((option) => (
          <option key={option} value={option}>
            {LOCALE_LABELS[option]}
          </option>
        ))}
      </select>
    );
  }

  if (variant === "compact") {
    return (
      <div
        role="group"
        aria-label={t("languageChooseLanguage")}
        className={`inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-black/40 p-1 backdrop-blur-sm ${className}`}
      >
        {APP_LOCALES.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              title={LOCALE_LABELS[option]}
              onClick={() => onChange(option)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "bg-[#1db954]/15 text-[#1db954] ring-1 ring-[#1db954]/35"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
              }`}
            >
              {SHORT_LABELS[option]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("languageChooseLanguage")}
      className={`grid gap-3 sm:grid-cols-3 ${className}`}
    >
      {APP_LOCALES.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={`flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              active
                ? "border-[#1db954]/60 bg-[#1db954]/10"
                : "border-white/[0.08] bg-[#181818]/80 hover:border-white/20 hover:bg-[#1f1f1f]"
            }`}
          >
            <span className="text-3xl leading-none" aria-hidden>
              {FLAGS[option]}
            </span>
            <span className={`text-sm font-bold ${active ? "text-white" : "text-zinc-200"}`}>
              {LOCALE_LABELS[option]}
            </span>
            <span className="text-[11px] text-zinc-500">{t(NAME_KEYS[option])}</span>
            <span className={`mt-1 h-4 ${active ? "text-[#1db954]" : "text-transparent"}`}>
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
