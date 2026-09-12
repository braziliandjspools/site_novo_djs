"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn, Sparkles, UserPlus } from "lucide-react";
import { BrsLogo } from "../components/BrsLogo";

type AuthMode = "login" | "register";

type PortalLoginProps = {
  onSuccess: () => void;
  embedded?: boolean;
  initialMode?: AuthMode;
};

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3.5 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-[#1ed760]/50 focus:ring-2 focus:ring-[#1ed760]/20";

const labelClassName = "block text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500";

function generateSecurePassword(length = 12) {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (value) => chars[value % chars.length]).join("");
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  showGenerate = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  showGenerate?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  function handleGenerate() {
    const generated = generateSecurePassword();
    onChange(generated);
    setVisible(true);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
        {showGenerate && (
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#1ed760] hover:text-[#7dffb0]"
          >
            <Sparkles className="h-3 w-3" />
            Gerar senha
          </button>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClassName} pr-11`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-white"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function PortalLogin({ onSuccess, embedded = false, initialMode = "login" }: PortalLoginProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const raw = await res.text();
      let data: { error?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as { error?: string };
        } catch {
          setError("Resposta inválida do servidor. Tente novamente.");
          return;
        }
      }
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      onSuccess();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, email, whatsapp, password }),
      });
      const raw = await res.text();
      let data: { error?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as { error?: string };
        } catch {
          setError("Resposta inválida do servidor. Tente novamente.");
          return;
        }
      }
      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar a conta.");
        return;
      }
      onSuccess();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden px-4 ${
        embedded ? "min-h-0 bg-transparent py-6" : "min-h-screen bg-[#0a0a0a] py-12 sm:py-16"
      }`}
    >
      {!embedded && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(30,215,96,0.18),transparent_45%),radial-gradient(ellipse_at_90%_100%,rgba(255,223,0,0.08),transparent_40%),radial-gradient(ellipse_at_50%_50%,rgba(0,39,118,0.2),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 br-pattern opacity-40" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#1ed760]/60 to-transparent" />
        </>
      )}

      <div className="relative w-full max-w-md sm:max-w-lg">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <BrsLogo href="/" className="h-12 w-auto max-w-[280px] object-contain sm:h-14" />
          </div>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1ed760]/80">
            Área do cliente
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Portal VIP · licenças, produções e serviços BRS
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#121212]/90 shadow-[0_30px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl">
          <div className="br-stripe-thin" />
          <div className="p-6 sm:p-8">
            <div className="flex gap-1.5 rounded-2xl border border-white/5 bg-black/40 p-1.5">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold tracking-[-0.01em] transition-all ${
                  mode === "login"
                    ? "bg-[#1ed760] text-black shadow-[0_8px_24px_rgba(30,215,96,0.25)]"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold tracking-[-0.01em] transition-all ${
                  mode === "register"
                    ? "bg-[#1ed760] text-black shadow-[0_8px_24px_rgba(30,215,96,0.25)]"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Criar conta
              </button>
            </div>

            {mode === "login" ? (
              <>
                <h1 className="mt-7 text-2xl font-bold tracking-tight text-white">Bem-vindo de volta</h1>
                <p className="mt-1.5 text-sm text-zinc-500">
                  Entre para acessar o acervo VIP, portal e Downloader.
                </p>

                <form onSubmit={(e) => void handleLogin(e)} className="mt-8 space-y-5">
                  <div>
                    <label htmlFor="portal-email" className={`${labelClassName} mb-2`}>
                      E-mail
                    </label>
                    <input
                      id="portal-email"
                      type="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClassName}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <PasswordField
                    id="portal-password"
                    label="Senha"
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                  />

                  {error && (
                    <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1ed760] px-6 py-3.5 text-sm font-bold tracking-[-0.01em] text-black transition-all hover:scale-[1.01] hover:bg-[#2dff7a] disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    Entrar
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="mt-7 text-2xl font-bold tracking-tight text-white">Crie sua conta</h1>
                <p className="mt-1.5 text-sm text-zinc-500">
                  Sem plano no cadastro — depois você assina VIP, Allavsoft ou pede uma produção.
                </p>

                <form onSubmit={(e) => void handleRegister(e)} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="portal-name" className={`${labelClassName} mb-2`}>
                        Nome completo
                      </label>
                      <input
                        id="portal-name"
                        type="text"
                        autoComplete="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClassName}
                        placeholder="Seu nome"
                      />
                    </div>
                    <div>
                      <label htmlFor="portal-register-email" className={`${labelClassName} mb-2`}>
                        E-mail
                      </label>
                      <input
                        id="portal-register-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClassName}
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="portal-whatsapp" className={`${labelClassName} mb-2`}>
                        WhatsApp
                      </label>
                      <input
                        id="portal-whatsapp"
                        type="tel"
                        autoComplete="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className={inputClassName}
                        placeholder="(51) 99999-9999"
                      />
                    </div>
                  </div>
                  <PasswordField
                    id="portal-register-password"
                    label="Senha"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    showGenerate
                  />

                  {error && (
                    <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1ed760] px-6 py-3.5 text-sm font-bold tracking-[-0.01em] text-black transition-all hover:scale-[1.01] hover:bg-[#2dff7a] disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Criar conta
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          {mode === "login" ? (
            <>
              Ainda não tem conta?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="font-bold uppercase tracking-wide text-[#1ed760] hover:underline"
              >
                Criar conta
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-bold uppercase tracking-wide text-[#1ed760] hover:underline"
              >
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
