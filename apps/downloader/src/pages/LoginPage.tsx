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

const LOGIN_BG_SRC = "/images/login-bg.jpg";

const inputClassName =
  "w-full rounded-lg border border-zinc-700 bg-[#0a0a0a]/90 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-700 focus:border-[#1db954] focus:ring-1 focus:ring-[#1db954]/30";

const labelClassName = "mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500";

export function LoginPage() {
  const { login, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      <div className="pointer-events-none absolute inset-0 bg-black/55" aria-hidden />

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <BrsLogo className="h-14 w-auto max-w-[300px] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)]" />
          </div>
          <p className="mt-3 text-sm text-zinc-300 drop-shadow">{DOWNLOADER_NAME}</p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="rounded-3xl border border-white/[0.08] bg-[#111111]/88 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-md"
        >
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1db954]">Conta VIP</p>
          <h1 className="text-xl font-bold text-white">Entrar na sua conta</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Use o mesmo e-mail e senha do portal {SITE_NAME}.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className={labelClassName}>
                E-mail
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
                Senha
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
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300"
            >
              <Server className="h-3.5 w-3.5" />
              {showAdvanced ? "Ocultar servidor" : "Configurar servidor da API"}
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-2 rounded-lg border border-zinc-800 bg-black/30 p-3">
                <label htmlFor="apiBaseUrl" className={labelClassName}>
                  URL do site (API)
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
                  placeholder="sitenovodjs.vercel.app"
                />
                <p className="text-[11px] leading-relaxed text-zinc-600">
                  Pode digitar só o domínio (<span className="text-zinc-400">sitenovodjs.vercel.app</span>) ou a URL
                  completa. Músicas:{" "}
                  <span className="text-zinc-400">sitenovodjs.vercel.app/musicas/atualizacoes</span>
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={testingServer}
                  className="w-full"
                  onClick={() => void handleTestServer()}
                >
                  {testingServer ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Testar conexão
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
            <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{displayError}</p>
          )}

          <Button type="submit" disabled={submitting} className="mt-6 w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Entrar
          </Button>
        </form>

        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-zinc-400 drop-shadow">
          <button
            type="button"
            onClick={() => void openPlatform(BP_PRIVACY_DOWNLOADER_URL)}
            className="text-zinc-300 underline-offset-2 transition-colors hover:text-[#1db954] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1db954]"
          >
            Privacidade
          </button>
          <span className="text-zinc-600" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => void openPlatform(BP_PRIVACY_COOKIES_URL)}
            className="text-zinc-300 underline-offset-2 transition-colors hover:text-[#1db954] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1db954]"
          >
            Cookies
          </button>
          <span className="text-zinc-600" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => void openPlatform(BP_PRIVACY_CONDUCT_URL)}
            className="text-zinc-300 underline-offset-2 transition-colors hover:text-[#1db954] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1db954]"
          >
            Conduta
          </button>
        </p>
      </div>
    </div>
  );
}
