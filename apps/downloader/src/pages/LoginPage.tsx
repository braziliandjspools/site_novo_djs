import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, Server } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { BrsLogo } from "../components/Branding/BrsLogo";
import { DOWNLOADER_NAME, SITE_NAME } from "../lib/site";
import { DEFAULT_API_BASE_URL, normalizeApiBaseUrl, setCachedApiBaseUrl } from "../lib/api/config";
import { pingApi } from "../lib/api/client";
import { formatApiError } from "../lib/errors";
import { getAppPreferences, setAppPreferences, isDesktopRuntime } from "../lib/native/app-preferences";

const inputClassName =
  "w-full rounded-lg border border-zinc-700 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-700 focus:border-[#1ed760] focus:ring-1 focus:ring-[#1ed760]/30";

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
        setApiBaseUrl(normalized);
        setCachedApiBaseUrl(normalized);
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
    <div className="flex h-full min-h-screen items-center justify-center bg-gradient-to-b from-[#1f1f1f] to-[#121212] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <BrsLogo className="h-14 w-auto max-w-[300px] object-contain" />
          </div>
          <p className="mt-3 text-sm text-zinc-500">{DOWNLOADER_NAME}</p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="rounded-xl border border-zinc-800 bg-[#1a1a1a] p-6 shadow-2xl shadow-black/40"
        >
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1ed760]">Conta VIP</p>
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
                  <p className={`text-xs ${serverStatus.startsWith("Servidor respondeu") ? "text-[#1ed760]" : "text-zinc-400"}`}>
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
      </div>
    </div>
  );
}
