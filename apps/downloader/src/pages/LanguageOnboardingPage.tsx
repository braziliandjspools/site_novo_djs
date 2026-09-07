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

  // Os textos seguem o idioma que está selecionado no momento, não o salvo,
  // para o usuário ver o resultado antes de confirmar.
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
    <div className="flex h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <BrsLogo className="mb-8 h-12 w-auto max-w-[260px] object-contain" />

      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1db954]/10 text-[#1db954]">
        <Globe className="h-8 w-8" strokeWidth={1.75} />
      </div>

      <h1 className="max-w-md text-2xl font-bold text-white">{preview("languageTitle")}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
        {preview("languageSubtitle")}
      </p>

      <LanguagePicker
        value={selected}
        onChange={setSelected}
        variant="cards"
        disabled={saving}
        className="mt-8 w-full max-w-xl"
      />

      <Button disabled={saving} className="mt-8 w-full max-w-xs" onClick={() => void handleContinue()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {preview("languageContinue")}
      </Button>
    </div>
  );
}
