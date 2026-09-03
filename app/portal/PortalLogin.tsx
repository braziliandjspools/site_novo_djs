"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn, Sparkles, UserPlus } from "lucide-react";
import { BrsLogo } from "../components/BrsLogo";

type PortalLoginProps = {
  onSuccess: () => void;
  embedded?: boolean;
};

type AuthMode = "login" | "register";

const inputClassName =
  "w-full rounded-lg border border-zinc-700 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-700 focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]/30";

const labelClassName = "mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500";

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
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#00ff9d] hover:text-[#00e68a]"
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

export function PortalLogin({ onSuccess, embedded = false }: PortalLoginProps) {
  const [mode, setMode] = useState<AuthMode>("login");
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
        embedded ? "min-h-0 bg-transparent py-6" : "min-h-screen bg-[#0a0a0a] py-12"
      }`}
    >
      {!embedded && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#00973915,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_#FFDF0010,_transparent_40%)]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#00ff9d]/50 to-transparent" />
        </>
      )}

      <div className="relative w-full max-w-xl lg:max-w-2xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <BrsLogo href="/" className="h-12 w-auto max-w-[280px] object-contain" />
          </div>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600">Client Area</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#141414] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
          <div className="h-1 bg-gradient-to-r from-[#009739] via-[#00ff9d] to-[#FFDF00]" />
          <div className="p-8">
            <div className="flex gap-2 rounded-lg bg-[#0a0a0a] p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                  mode === "login" ? "bg-[#00ff9d] text-black" : "text-zinc-500 hover:text-white"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                  mode === "register" ? "bg-[#00ff9d] text-black" : "text-zinc-500 hover:text-white"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Criar conta
              </button>
            </div>

            {mode === "login" ? (
              <>
                <h1 className="mt-6 text-xl font-black uppercase tracking-wide text-white">Login</h1>
                <p className="mt-1 text-sm text-zinc-500">Acesse suas licenças, produções e serviços</p>

                <form onSubmit={(e) => void handleLogin(e)} className="mt-8 space-y-5">
                  <div>
                    <label htmlFor="portal-email" className={labelClassName}>
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
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00ff9d] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-black transition-all hover:bg-[#00e68a] disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    Entrar
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="mt-6 text-xl font-black uppercase tracking-wide text-white">Criar conta</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Preencha seus dados. Você entra sem plano de licença — escolha um plano ou peça uma produção depois.
                </p>

                <form onSubmit={(e) => void handleRegister(e)} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="portal-name" className={labelClassName}>
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
                      <label htmlFor="portal-register-email" className={labelClassName}>
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
                      <label htmlFor="portal-whatsapp" className={labelClassName}>
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
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00ff9d] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-black transition-all hover:bg-[#00e68a] disabled:opacity-60"
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
                className="font-bold uppercase tracking-wide text-[#00ff9d] hover:underline"
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
                className="font-bold uppercase tracking-wide text-[#00ff9d] hover:underline"
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
