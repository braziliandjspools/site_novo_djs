"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, LogOut, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { daysUntilDue, getDueUrgency, toDateInputValue } from "../lib/due-queue";

import { ServiceSelector, emptyServices, type ServiceDraft } from "./ServiceSelector";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  services: ServiceDraft;
  servicesLabel: string;
  monthlyValue: number;
  monthlyValueLabel: string;
  nextDueAt: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminUsersTableProps = {
  onLogout: () => void;
};

type DraftRow = {
  name: string;
  email: string;
  whatsapp: string;
  services: ServiceDraft;
  monthlyValue: string;
  nextDueAt: string;
  active: boolean;
};

const emptyDraft = (): DraftRow => ({
  name: "",
  email: "",
  whatsapp: "",
  services: emptyServices(),
  monthlyValue: "0",
  nextDueAt: "",
  active: true,
});

function formatBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

/** Aceita "50", "50,00", "R$ 50,00", "1.250,90". */
function parseBrlInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return 0;

  let normalized = trimmed.replace(/R\$\s?/gi, "").replace(/\s/g, "");
  if (normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

function rowUrgencyClass(urgency: ReturnType<typeof getDueUrgency>) {
  if (urgency === "soon") return "bg-amber-500/10";
  if (urgency === "overdue") return "bg-red-500/10";
  return "";
}

function dueUrgencyLabel(nextDueAt: string) {
  const urgency = getDueUrgency(nextDueAt);
  if (urgency === "overdue") return "Vencido";
  if (urgency !== "soon") return null;

  const days = daysUntilDue(nextDueAt);
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Amanhã";
  return `${days} dias`;
}

const inputClass =
  "w-full min-w-0 rounded-lg border border-white/10 bg-[#0a0a0a]/70 px-2.5 py-2 text-xs text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#009739]/55 focus:bg-black/40";

function MoneyInput({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const numeric = parseBrlInput(value) ?? 0;
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(value);

  useEffect(() => {
    if (!focused) setText(value);
  }, [value, focused]);

  return (
    <div className={`space-y-1 ${className}`}>
      <input
        type="text"
        inputMode="decimal"
        value={focused ? text : formatBrl(numeric)}
        onFocus={() => {
          setFocused(true);
          setText(Number.isFinite(numeric) ? String(numeric).replace(".", ",") : "0");
        }}
        onBlur={() => {
          setFocused(false);
          const parsed = parseBrlInput(text);
          onChange(String(parsed ?? 0));
        }}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = parseBrlInput(e.target.value);
          if (parsed !== null) onChange(String(parsed));
        }}
        className={`${inputClass} font-mono tabular-nums`}
        aria-label="Valor mensal"
      />
      <p className="text-[10px] tabular-nums text-zinc-500">
        {formatBrl(0)} <span className="text-zinc-600">({formatBrl(numeric)})</span>
      </p>
    </div>
  );
}

export function AdminUsersTable({ onLogout }: AdminUsersTableProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, DraftRow>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    whatsapp: "",
    services: emptyServices(),
    monthlyValue: "0",
    nextDueAt: "",
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { credentials: "same-origin", cache: "no-store" });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Não foi possível carregar os usuários.");
      }
      const data = (await res.json()) as { users?: AdminUser[]; total?: number };
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);

      const nextDrafts: Record<number, DraftRow> = {};
      for (const user of data.users ?? []) {
        nextDrafts[user.id] = {
          name: user.name,
          email: user.email,
          whatsapp: user.whatsapp,
          services: user.services,
          monthlyValue: String(user.monthlyValue),
          nextDueAt: toDateInputValue(user.nextDueAt),
          active: user.active,
        };
      }
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    onLogout();
  }

  function updateDraft(id: number, patch: Partial<DraftRow>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? emptyDraft()), ...patch },
    }));
  }

  function exportEmailsTxt() {
    const emails = users
      .map((user) => (drafts[user.id]?.email ?? user.email).trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) {
      setError("Nenhum e-mail para extrair.");
      return;
    }

    const blob = new Blob([`${emails.join("\n")}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `emails-clientes-${stamp}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function saveUser(id: number) {
    const draft = drafts[id];
    if (!draft) return;

    if (!draft.email.trim() || !draft.email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (!draft.nextDueAt) {
      setError("Informe a data do próximo vencimento.");
      return;
    }

    const monthlyValue = parseBrlInput(draft.monthlyValue);
    if (monthlyValue === null) {
      setError("Valor mensal inválido.");
      return;
    }

    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          email: draft.email.trim().toLowerCase(),
          whatsapp: draft.whatsapp,
          services: draft.services,
          monthlyValue,
          nextDueAt: draft.nextDueAt,
          active: draft.active,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteUser(id: number, name: string) {
    if (!window.confirm(`Remover o cliente ${name}?`)) return;

    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover.");
    } finally {
      setSavingId(null);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const monthlyValue = parseBrlInput(newUser.monthlyValue);
    if (monthlyValue === null) {
      setError("Valor mensal inválido.");
      setCreating(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUser,
          monthlyValue,
          nextDueAt: newUser.nextDueAt,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao cadastrar.");
      setShowCreate(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        whatsapp: "",
        services: emptyServices(),
        monthlyValue: "0",
        nextDueAt: "",
      });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#FFDF00]" />
      </div>
    );
  }

  const dueSoonCount = users.filter((user) => {
    const nextDueAt = drafts[user.id]?.nextDueAt ?? user.nextDueAt;
    return getDueUrgency(nextDueAt) === "soon";
  }).length;
  const overdueCount = users.filter((user) => {
    const nextDueAt = drafts[user.id]?.nextDueAt ?? user.nextDueAt;
    return getDueUrgency(nextDueAt) === "overdue";
  }).length;

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FFDF00]">Administração</p>
          <h1 className="font-display text-2xl text-white sm:text-3xl">Clientes do portal</h1>
          <p className="mt-1 text-sm text-gray-400 [overflow-wrap:anywhere]">
            {total} clientes · lista ordenada pelo próximo vencimento
            {dueSoonCount > 0 ? (
              <span className="ml-2 font-semibold text-amber-300">
                · {dueSoonCount} vence{dueSoonCount === 1 ? "" : "m"} nos próximos 5 dias
              </span>
            ) : null}
            {overdueCount > 0 ? (
              <span className="ml-2 font-semibold text-red-300">
                · {overdueCount} vencido{overdueCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-[#009739]/40 hover:text-white sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => setShowCreate((value) => !value)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#009739] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00B347] sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Novo cliente
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-red-500/40 hover:text-red-300 sm:w-auto"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-200">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Vence nos próximos 5 dias
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-red-200">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          Vencido
        </span>
      </div>

      {showCreate && (
        <form
          onSubmit={(e) => void createUser(e)}
          className="min-w-0 rounded-2xl border border-[#009739]/40 bg-[#009739]/10 p-4 sm:p-6"
        >
          <h2 className="font-display text-xl text-white">Cadastrar cliente</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["name", "Nome completo"],
              ["email", "E-mail"],
              ["password", "Senha (mín. 8)"],
              ["whatsapp", "WhatsApp"],
              ["nextDueAt", "Próx. vencimento"],
            ].map(([key, label]) => (
              <label key={key} className="block min-w-0 text-xs text-gray-400">
                {label}
                <input
                  type={key === "password" ? "password" : key === "nextDueAt" ? "date" : "text"}
                  required
                  value={newUser[key as "name" | "email" | "password" | "whatsapp" | "nextDueAt"]}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, [key]: e.target.value }))}
                  className={`${inputClass} mt-1`}
                />
              </label>
            ))}
            <label className="block min-w-0 text-xs text-gray-400 sm:col-span-2 lg:col-span-3">
              Serviços contratados
              <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-3">
                <ServiceSelector
                  value={newUser.services}
                  onChange={(services) => setNewUser((prev) => ({ ...prev, services }))}
                />
              </div>
            </label>
            <label className="block min-w-0 text-xs text-gray-400">
              Valor mensal
              <div className="mt-1">
                <MoneyInput
                  value={newUser.monthlyValue}
                  onChange={(monthlyValue) => setNewUser((prev) => ({ ...prev, monthlyValue }))}
                />
              </div>
            </label>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#FFDF00] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[#002776] disabled:opacity-60 sm:w-auto"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Cadastrar
          </button>
        </form>
      )}

      {users.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-gray-400">
          Nenhum cliente cadastrado ainda.
        </p>
      ) : (
        <>
          {/* Mobile: cards editáveis — ações sempre visíveis */}
          <div className="space-y-4 md:hidden">
            {users.map((user, index) => {
              const draft = drafts[user.id];
              if (!draft) return null;
              const isSaving = savingId === user.id;
              const urgency = getDueUrgency(draft.nextDueAt);
              const urgencyLabel = dueUrgencyLabel(draft.nextDueAt);

              return (
                <article
                  key={user.id}
                  className={`w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.25)] ${rowUrgencyClass(urgency)}`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <p className="font-mono text-[11px] font-bold text-[#FFDF00]">
                      #{String(index + 1).padStart(2, "0")}
                    </p>
                    {urgencyLabel && (
                      <span
                        className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          urgency === "overdue"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-amber-500/20 text-amber-200"
                        }`}
                      >
                        {urgencyLabel}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Nome
                      <input
                        value={draft.name}
                        onChange={(e) => updateDraft(user.id, { name: e.target.value })}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      E-mail
                      <input
                        type="email"
                        value={draft.email}
                        onChange={(e) => updateDraft(user.id, { email: e.target.value })}
                        className={`${inputClass} mt-1 [overflow-wrap:anywhere]`}
                      />
                    </label>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      WhatsApp
                      <input
                        value={draft.whatsapp}
                        onChange={(e) => updateDraft(user.id, { whatsapp: e.target.value })}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Serviços</p>
                      <div className="mt-1.5 rounded-lg border border-white/10 bg-black/20 p-3">
                        <ServiceSelector
                          value={draft.services}
                          onChange={(services) => updateDraft(user.id, { services })}
                        />
                      </div>
                    </div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Valor mensal
                      <div className="mt-1">
                        <MoneyInput
                          value={draft.monthlyValue}
                          onChange={(monthlyValue) => updateDraft(user.id, { monthlyValue })}
                        />
                      </div>
                    </label>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Próx. vencimento
                      <input
                        type="date"
                        value={draft.nextDueAt}
                        onChange={(e) => updateDraft(user.id, { nextDueAt: e.target.value })}
                        className={`${inputClass} mt-1 font-mono`}
                      />
                    </label>
                    <label className="inline-flex min-h-11 items-center gap-2 text-sm text-zinc-300">
                      <input
                        type="checkbox"
                        checked={draft.active}
                        onChange={(e) => updateDraft(user.id, { active: e.target.checked })}
                        className="h-4 w-4 accent-[#009739]"
                      />
                      Cliente ativo
                    </label>
                  </div>

                  <div className="sticky bottom-0 mt-4 -mx-4 -mb-4 flex flex-col gap-2 border-t border-white/10 bg-[#0a1220]/95 px-4 py-3 backdrop-blur">
                    <button
                      type="button"
                      onClick={() => void saveUser(user.id)}
                      disabled={isSaving}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#009739]/40 bg-[#009739]/20 text-sm font-semibold text-[#00B347] hover:bg-[#009739]/30 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar alterações
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteUser(user.id, user.name)}
                      disabled={isSaving}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop: tabela tradicional */}
          <section className="hidden overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-white/10 bg-[#061018]/95 text-[10px] uppercase tracking-[0.14em] text-zinc-400 backdrop-blur">
                    <th className="px-3 py-3.5 font-bold">#</th>
                    <th className="px-3 py-3.5 font-bold">Nome</th>
                    <th className="px-3 py-3.5 font-bold">E-mail</th>
                    <th className="px-3 py-3.5 font-bold">WhatsApp</th>
                    <th className="px-3 py-3.5 font-bold">Serviços</th>
                    <th className="px-3 py-3.5 font-bold">Valor</th>
                    <th className="px-3 py-3.5 font-bold">Próx. vencimento</th>
                    <th className="px-3 py-3.5 font-bold">Ativo</th>
                    <th className="px-3 py-3.5 font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => {
                    const draft = drafts[user.id];
                    if (!draft) return null;
                    const isSaving = savingId === user.id;
                    const urgency = getDueUrgency(draft.nextDueAt);
                    const urgencyLabel = dueUrgencyLabel(draft.nextDueAt);

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-white/[0.06] transition-colors hover:bg-white/[0.03] ${rowUrgencyClass(urgency)} ${
                          index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent"
                        }`}
                      >
                        <td className="px-3 py-3 align-top font-mono text-[11px] font-bold text-[#FFDF00]">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="min-w-[140px] px-3 py-3 align-top">
                          <input
                            value={draft.name}
                            onChange={(e) => updateDraft(user.id, { name: e.target.value })}
                            className={inputClass}
                          />
                        </td>
                        <td className="min-w-[200px] px-3 py-3 align-top">
                          <input
                            type="email"
                            value={draft.email}
                            onChange={(e) => updateDraft(user.id, { email: e.target.value })}
                            className={inputClass}
                          />
                        </td>
                        <td className="min-w-[130px] px-3 py-3 align-top">
                          <input
                            value={draft.whatsapp}
                            onChange={(e) => updateDraft(user.id, { whatsapp: e.target.value })}
                            className={inputClass}
                          />
                        </td>
                        <td className="min-w-[170px] px-3 py-3 align-top">
                          <ServiceSelector
                            compact
                            value={draft.services}
                            onChange={(services) => updateDraft(user.id, { services })}
                          />
                        </td>
                        <td className="min-w-[140px] px-3 py-3 align-top">
                          <MoneyInput
                            value={draft.monthlyValue}
                            onChange={(monthlyValue) => updateDraft(user.id, { monthlyValue })}
                          />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="space-y-1.5">
                            <input
                              type="date"
                              value={draft.nextDueAt}
                              onChange={(e) => updateDraft(user.id, { nextDueAt: e.target.value })}
                              className={`${inputClass} min-w-[140px] font-mono`}
                            />
                            {urgencyLabel && (
                              <span
                                className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                  urgency === "overdue"
                                    ? "bg-red-500/20 text-red-300"
                                    : "bg-amber-500/20 text-amber-200"
                                }`}
                              >
                                {urgencyLabel}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <input
                            type="checkbox"
                            checked={draft.active}
                            onChange={(e) => updateDraft(user.id, { active: e.target.checked })}
                            className="mt-2 h-4 w-4 accent-[#009739]"
                          />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => void saveUser(user.id)}
                              disabled={isSaving}
                              className="rounded-lg border border-[#009739]/40 bg-[#009739]/15 p-2 text-[#00B347] hover:bg-[#009739]/25 disabled:opacity-50"
                              title="Salvar"
                            >
                              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteUser(user.id, user.name)}
                              disabled={isSaving}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                              title="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              {users.length} e-mail{users.length === 1 ? "" : "s"} na lista · um por linha no arquivo
            </p>
            <button
              type="button"
              onClick={exportEmailsTxt}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#FFDF00]/35 bg-[#FFDF00]/10 px-4 py-2 text-sm font-semibold text-[#FFDF00] hover:bg-[#FFDF00]/20 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Extrair e-mails (.txt)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
