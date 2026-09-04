"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, LogOut, Megaphone, Plus, RefreshCw, Trash2 } from "lucide-react";

type NoticeRow = {
  id: number;
  title: string;
  body: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  audience: "GLOBAL" | "USER";
  portalUserId: number | null;
  user: { id: number; name: string; email: string } | null;
  active: boolean;
  createdAt: string;
};

type UserOption = { id: number; name: string; email: string };

type AdminNoticesProps = {
  onLogout: () => void;
};

const severityLabel: Record<NoticeRow["severity"], string> = {
  INFO: "Info",
  SUCCESS: "Sucesso",
  WARNING: "Aviso",
  ERROR: "Urgente",
};

export function AdminNotices({ onLogout }: AdminNoticesProps) {
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<NoticeRow["severity"]>("INFO");
  const [audience, setAudience] = useState<"GLOBAL" | "USER">("GLOBAL");
  const [portalUserId, setPortalUserId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [noticesRes, usersRes] = await Promise.all([
        fetch("/api/admin/notices", { credentials: "same-origin", cache: "no-store" }),
        fetch("/api/admin/users", { credentials: "same-origin", cache: "no-store" }),
      ]);
      const noticesData = (await noticesRes.json()) as { notices?: NoticeRow[]; error?: string };
      if (!noticesRes.ok) throw new Error(noticesData.error ?? "Falha ao carregar avisos.");
      setNotices(noticesData.notices ?? []);

      if (usersRes.ok) {
        const usersData = (await usersRes.json()) as { users?: UserOption[] };
        setUsers(
          (usersData.users ?? []).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          })),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          severity,
          audience,
          portalUserId: audience === "USER" ? Number(portalUserId) : null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Falha ao criar aviso.");
      setTitle("");
      setBody("");
      setSeverity("INFO");
      setAudience("GLOBAL");
      setPortalUserId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(notice: NoticeRow) {
    const res = await fetch(`/api/admin/notices/${notice.id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !notice.active }),
    });
    if (res.ok) await load();
  }

  async function removeNotice(id: number) {
    if (!window.confirm("Excluir este aviso?")) return;
    const res = await fetch(`/api/admin/notices/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Megaphone className="h-5 w-5 text-[#FFDF00]" />
            Avisos do site
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Globais para todos ou direcionados a um cliente. Aparecem no sininho do header, portal e músicas.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </div>

      <form
        onSubmit={(event) => void handleCreate(event)}
        className="rounded-2xl border border-white/10 bg-[#181818] p-4 sm:p-5"
      >
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Novo aviso</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#009739]/50 sm:col-span-2"
          />
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Mensagem"
            rows={3}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#009739]/50 sm:col-span-2"
          />
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as NoticeRow["severity"])}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            {Object.entries(severityLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as "GLOBAL" | "USER")}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="GLOBAL">Global (todos)</option>
            <option value="USER">Usuário específico</option>
          </select>
          {audience === "USER" && (
            <select
              required
              value={portalUserId}
              onChange={(e) => setPortalUserId(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white sm:col-span-2"
            >
              <option value="">Selecione o cliente…</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.email}
                </option>
              ))}
            </select>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#009739] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#00B347] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Publicar aviso
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#009739]" />
        </div>
      ) : notices.length === 0 ? (
        <p className="rounded-xl border border-white/5 bg-[#181818] px-4 py-8 text-center text-sm text-zinc-500">
          Nenhum aviso criado ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {notices.map((notice) => (
            <li
              key={notice.id}
              className={`rounded-xl border px-4 py-3 ${
                notice.active ? "border-white/10 bg-[#181818]" : "border-white/5 bg-[#121212] opacity-60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{notice.title}</p>
                    <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                      {severityLabel[notice.severity]}
                    </span>
                    <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                      {notice.audience === "GLOBAL"
                        ? "Global"
                        : notice.user?.email ?? `User #${notice.portalUserId}`}
                    </span>
                    {!notice.active && (
                      <span className="rounded border border-amber-500/30 px-2 py-0.5 text-[10px] uppercase text-amber-300">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{notice.body}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleActive(notice)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/5"
                  >
                    {notice.active ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeNotice(notice.id)}
                    className="rounded-lg border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
