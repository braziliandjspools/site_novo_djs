import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, Server } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { BrsLogo } from "../components/Branding/BrsLogo";
import { openPlatform } from "../lib/open-site";
import { BP_PRIVACY_CONDUCT_URL, BP_PRIVACY_COOKIES_URL, BP_PRIVACY_DOWNLOADER_URL, DOWNLOADER_NAME, SITE_NAME } from "../lib/site";
import { DEFAULT_API_BASE_URL, normalizeApiBaseUrl, setCachedApiBaseUrl } from "../lib/api/config";
import { pingApi } from "../lib/api/client";
import { formatApiError } from "../lib/errors";
import { getAppPreferences, setAppPreferences, isDesktopRuntime } from "../lib/native/app-preferences";
import { useLocale } from "../i18n/LocaleContext";
import { LanguagePicker } from "../i18n/LanguagePicker";

const LOGIN_BG_SRC = "/images/login-bg.jpg?v=pack-wall-2026";

const inputClassName =
  "w-full rounded-2xl border border-white/[0.08] bg-black/45 px-3.5 py-2.5 text-[0.8rem] font-semibold text-white outline-none transition-all placeholder:text-zinc-600 focus:border-[#1ed760]/55 focus:bg-black/60 focus:ring-2 focus:ring-[#1ed760]/15";

const labelClassName = "mb-1.5 block text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-zinc-500";

export function LoginPage() {
  const { login, error: authError, refreshSession, sessionToken } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [testingServer, setTestingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (!isDesktopRuntime()) return;
      try {
        const prefs = await getAppPreferences();
        const url = prefs.apiBaseUrl?.trim() || DEFAULT_API_BASE_URL;
        const normalized = normalizeApiBaseUrl(url);
        const useDefault =
          /localhost|127\.0\.0\.1/i.test(normalized) &&
          !/localhost|127\.0\.0\.1/i.test(DEFAULT_API_BASE_URL);
        const next = useDefault ? DEFAULT_API_BASE_URL : normalized;
        setApiBaseUrl(next);
        setCachedApiBaseUrl(next);
      } catch {
        setCachedApiBaseUrl(DEFAULT_API_BASE_URL);
      }
    })();
  }, []);

  // Se já há token salvo (ex.: após reboot com rede lenta), tenta restaurar sem pedir senha.
  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    void (async () => {
      setReconnecting(true);
      try {
        await refreshSession();
      } finally {
        if (!cancelled) setReconnecting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionToken, refreshSession]);

  async function handleReconnect() {
    setReconnecting(true);
    setError(null);
    try {
      await persistApiBaseUrl(apiBaseUrl);
      const ok = await refreshSession();
      if (!ok) setError(t("loginReconnectFail"));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setReconnecting(false);
    }
  }

  function applyNormalizedUrl(raw: string) {
    const normalized = normalizeApiBaseUrl(raw);
    setApiBaseUrl(normalized);
    return normalized;
  }

  async function persistApiBaseUrl(url: string) {
    const normalized = normalizeApiBaseUrl(url);
    setApiBaseUrl(normalized);
    setCachedApiBaseUrl(normalized);
    if (!isDesktopRuntime()) return;
    try {
      const prefs = await getAppPreferences();
      await setAppPreferences({ ...prefs, apiBaseUrl: normalized });
    } catch {
      /* preferências locais indisponíveis — URL em memória já foi aplicada */
    }
  }

  async function handleTestServer() {
    setTestingServer(true);
    setServerStatus(null);
    try {
      const normalized = applyNormalizedUrl(apiBaseUrl);
      setCachedApiBaseUrl(normalized);
      const result = await pingApi(normalized);
      setServerStatus(result.message);
    } finally {
      setTestingServer(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await persistApiBaseUrl(apiBaseUrl);
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPassword("");
      setSubmitting(false);
    }
  }

  const displayError = error ?? authError;

  return (
    <div className="relative flex h-full min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <img
        src={LOGIN_BG_SRC}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/80" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,185,84,0.16),transparent_55%)]"
        aria-hidden
      />

      <LanguagePicker
        value={locale}
        onChange={(next) => void setLocale(next)}
        variant="compact"
        className="absolute right-4 top-4 z-20"
      />

      <div className="relative z-10 w-full max-w-[22rem] animate-fade-up">
        <div className="mb-5 text-center">
          <div className="flex justify-center">
            <BrsLogo className="h-11 w-auto max-w-[240px] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)]" />
          </div>
          <p className="mt-2 text-[0.75rem] font-bold tracking-wide text-zinc-300 drop-shadow">
            {DOWNLOADER_NAME}
          </p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="glass-panel rounded-[1.35rem] p-5"
        >
          <p className="mb-1 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-[#1ed760]">
            {t("loginVipAccount")}
          </p>
          <h1 className="font-display text-[1.2rem] font-extrabold tracking-tight text-white">
            {t("loginTitle")}
          </h1>
          <p className="mt-1.5 text-[0.75rem] leading-relaxed text-zinc-500">
            {t("loginSubtitle", { site: SITE_NAME })}
          </p>

          {sessionToken && (
            <div className="mt-3 rounded-2xl border border-[#1ed760]/25 bg-[#1ed760]/10 px-3 py-2.5">
              <p className="text-[0.75rem] text-zinc-200">
                {reconnecting ? t("loginRestoringSession") : t("loginSavedSessionHint")}
              </p>
              <Button
                type="button"
                variant="secondary"
                disabled={reconnecting || submitting}
                className="mt-3 w-full"
                onClick={() => void handleReconnect()}
              >
                {reconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {t("loginReconnect")}
              </Button>
            </div>
          )}

          <div className="mt-5 space-y-3">
            <div>
              <label htmlFor="email" className={labelClassName}>
                {t("loginEmail")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClassName}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClassName}>
                {t("loginPassword")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClassName} pr-11`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  aria-label={showPassword ? t("loginHidePassword") : t("loginShowPassword")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced((current) => !current)}
              className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold text-zinc-500 hover:text-zinc-300"
            >
              <Server className="h-3.5 w-3.5" />
              {showAdvanced ? t("loginHideServer") : t("loginAdvancedServer")}
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-2 rounded-lg border border-zinc-800 bg-black/30 p-3">
                <label htmlFor="apiBaseUrl" className={labelClassName}>
                  {t("loginApiUrl")}
                </label>
                <input
                  id="apiBaseUrl"
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  value={apiBaseUrl}
                  onChange={(event) => setApiBaseUrl(event.target.value)}
                  onBlur={(event) => applyNormalizedUrl(event.target.value)}
                  className={inputClassName}
                  placeholder="www.brazilianremixservice.com.br"
                />
                <p className="text-[11px] leading-relaxed text-zinc-600">
                  {t("loginApiHint")}{" "}
                  <span className="text-zinc-400">www.brazilianremixservice.com.br</span>
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={testingServer}
                  className="w-full"
                  onClick={() => void handleTestServer()}
                >
                  {testingServer ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t("loginTestConnection")}
                </Button>
                {serverStatus && (
                  <p className={`text-xs ${serverStatus.startsWith("Servidor respondeu") ? "text-[#1db954]" : "text-zinc-400"}`}>
                    {serverStatus}
                  </p>
                )}
              </div>
            )}
          </div>

          {displayError && (
            <p className="mt-3 rounded-2xl bg-red-500/10 px-3 py-2 text-[0.75rem] text-red-400">{displayError}</p>
          )}

          <Button type="submit" disabled={submitting} className="mt-5 w-full py-2">
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
            {t("loginEnter")}
          </Button>
        </form>

        <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center text-[0.68rem] text-zinc-400 drop-shadow">
          <button
            type="button"
            onClick={() => void openPlatform(BP_PRIVACY_DOWNLOADER_URL)}
            className="text-zinc-300 underline-offset-2 transition-colors hover:text-[#1db954] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1db954]"
          >
            {t("loginPrivacy")}
          </button>
          <span className="text-zinc-600" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => void openPlatform(BP_PRIVACY_COOKIES_URL)}
            className="text-zinc-300 underline-offset-2 transition-colors hover:text-[#1db954] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1db954]"
          >
            {t("loginCookies")}
          </button>
          <span className="text-zinc-600" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => void openPlatform(BP_PRIVACY_CONDUCT_URL)}
            className="text-zinc-300 underline-offset-2 transition-colors hover:text-[#1db954] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1db954]"
          >
            {t("loginConduct")}
          </button>
        </p>
      </div>
    </div>
  );
}
