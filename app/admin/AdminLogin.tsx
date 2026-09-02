"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

type AdminLoginProps = {
  onSuccess: () => void | Promise<void>;
};

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ secret: secret.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      await onSuccess();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-[#FFDF00]/30 bg-[#002776]/15 p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFDF00]/15">
            <ShieldCheck className="h-6 w-6 text-[#FFDF00]" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-white">Admin</h1>
            <p className="text-sm text-gray-400">Gestão de clientes do portal</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="admin-secret" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Senha de administrador
            </label>
            <input
              id="admin-secret"
              type="password"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#FFDF00]/50"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FFDF00] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#002776] transition-all hover:bg-[#FFE566] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
