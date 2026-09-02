import { useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { APP_NAME } from "../lib/site";

const inputClassName =
  "w-full rounded-lg border border-zinc-700 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-700 focus:border-[#1ed760] focus:ring-1 focus:ring-[#1ed760]/30";

const labelClassName = "mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500";

export function LoginPage() {
  const { login, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Não foi possível entrar.");
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
          <p className="text-3xl font-black tracking-tight text-white">
            Brazilian<span className="text-[#1ed760]">Packs</span>
          </p>
          <p className="mt-2 text-sm text-zinc-500">{APP_NAME}</p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="rounded-xl border border-zinc-800 bg-[#1a1a1a] p-6 shadow-2xl shadow-black/40"
        >
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1ed760]">Conta VIP</p>
          <h1 className="text-xl font-bold text-white">Entrar na sua conta</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Use o mesmo e-mail e senha do portal Brazilian Packs.
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
