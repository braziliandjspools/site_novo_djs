import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAppPreferences, setAppPreferences } from "../lib/native/app-preferences";
import { translate, type MessageKey } from "./translate";
import { normalizeLocale, type AppLocale } from "./types";

export type { MessageKey };

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

type LocaleContextValue = {
  locale: AppLocale;
  /** false até o usuário escolher o idioma na primeira abertura. */
  localeConfigured: boolean;
  /** false enquanto as preferências ainda estão sendo lidas do disco. */
  ready: boolean;
  t: TranslateFn;
  /** Troca o idioma e persiste (usado em Configurações). */
  setLocale: (locale: AppLocale) => Promise<void>;
  /** Confirma a escolha do onboarding: grava o idioma e marca como configurado. */
  confirmLocale: (locale: AppLocale) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("pt-BR");
  const [localeConfigured, setLocaleConfigured] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const prefs = await getAppPreferences();
        if (cancelled) return;
        setLocaleState(normalizeLocale(prefs.locale));
        setLocaleConfigured(Boolean(prefs.localeConfigured));
      } catch {
        // Preferências indisponíveis: segue no padrão e pede o idioma ao usuário.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: AppLocale, configured: boolean) => {
    // Aplica na interface antes de gravar para a troca parecer instantânea.
    setLocaleState(next);
    setLocaleConfigured(configured);
    try {
      const prefs = await getAppPreferences();
      await setAppPreferences({ ...prefs, locale: next, localeConfigured: configured });
    } catch {
      // Sem persistência a escolha vale só para esta sessão.
    }
  }, []);

  const setLocale = useCallback(
    async (next: AppLocale) => {
      await persist(normalizeLocale(next), localeConfigured);
    },
    [localeConfigured, persist],
  );

  const confirmLocale = useCallback(
    async (next: AppLocale) => {
      await persist(normalizeLocale(next), true);
    },
    [persist],
  );

  const t = useCallback<TranslateFn>(
    (key, vars) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, localeConfigured, ready, t, setLocale, confirmLocale }),
    [confirmLocale, locale, localeConfigured, ready, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale precisa estar dentro de <LocaleProvider>.");
  }
  return context;
}

/** Atalho para componentes que só precisam traduzir. */
export function useTranslate(): TranslateFn {
  return useLocale().t;
}
