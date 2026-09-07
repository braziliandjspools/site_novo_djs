import { useState } from "react";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { BrsLogo } from "../components/Branding/BrsLogo";
import { LanguagePicker } from "../i18n/LanguagePicker";
import { useLocale } from "../i18n/LocaleContext";
import { translate } from "../i18n/translate";
import type { AppLocale } from "../i18n/types";

type LanguageOnboardingPageProps = {
  onConfirmed?: () => void;
};

/** Primeira tela do app: escolha de idioma, antes do login. */
export function LanguageOnboardingPage({ onConfirmed }: LanguageOnboardingPageProps) {
  const { locale, confirmLocale } = useLocale();
  const [selected, setSelected] = useState<AppLocale>(locale);
  const [saving, setSaving] = useState(false);

  const preview = (key: Parameters<typeof translate>[1]) => translate(selected, key);

  async function handleContinue() {
    setSaving(true);
    try {
      await confirmLocale(selected);
      onConfirmed?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-atmosphere relative flex h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1db954]/40 to-transparent" />
      <div className="relative z-10 w-full max-w-xl animate-fade-up">
        <BrsLogo className="mx-auto mb-8 h-12 w-auto max-w-[260px] object-contain" />

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#1db954]/25 bg-[#1db954]/10 text-[#1db954] shadow-[0_0_40px_rgba(29,185,84,0.15)]">
          <Globe className="h-8 w-8" strokeWidth={1.75} />
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-white">
          {preview("languageTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
          {preview("languageSubtitle")}
        </p>

        <LanguagePicker
          value={selected}
          onChange={setSelected}
          variant="cards"
          disabled={saving}
          className="mt-8 w-full"
        />

        <Button disabled={saving} className="mt-8 w-full max-w-xs" onClick={() => void handleContinue()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {preview("languageContinue")}
        </Button>
      </div>
    </div>
  );
}
