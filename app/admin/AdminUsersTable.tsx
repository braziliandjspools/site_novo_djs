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
  /** Nova senha opcional — se preenchida no save, envia e-mail via Resend. */
  password: string;
};

const emptyDraft = (): DraftRow => ({
  name: "",
  email: "",
  whatsapp: "",
  services: emptyServices(),
  monthlyValue: "0",
  nextDueAt: "",
  active: true,
  password: "",
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

function dueUrgencyLabel(nextDueAt: string) {
  const urgency = getDueUrgency(nextDueAt);
  if (urgency === "overdue") return "Vencido";
  if (urgency !== "soon") return null;

  const days = daysUntilDue(nextDueAt);
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Amanhã";
  return `${days} dias`;
}

const formInputClass =
  "w-full min-w-0 rounded-lg border border-white/10 bg-[#0a0a0a]/70 px-2.5 py-2 text-xs text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#009739]/55 focus:bg-black/40";

const sheetInputClass =
  "w-full min-w-0 rounded-none border-0 bg-transparent px-1.5 py-1 text-[12px] leading-snug text-white outline-none transition-colors placeholder:text-zinc-600 focus:bg-white/[0.04]";

const sheetCell =
  "border-b border-r border-white/[0.08] px-1.5 py-1 align-middle";

const sheetHead =
  "sticky top-0 z-20 border-b border-r border-white/15 bg-[#0b1524] px-1.5 py-2 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 whitespace-nowrap";

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
        className={`${formInputClass} font-mono tabular-nums`}
        aria-label="Valor mensal"
      />
      <p className="text-[10px] tabular-nums text-zinc-500">
        {formatBrl(0)} <span className="text-zinc-600">({formatBrl(numeric)})</span>
      </p>
    </div>
  );
}

function SheetMoneyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const numeric = parseBrlInput(value) ?? 0;
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(value);

  useEffect(() => {
    if (!focused) setText(value);
  }, [value, focused]);

  return (
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
      className={`${sheetInputClass} font-mono tabular-nums`}
      aria-label="Valor mensal"
    />
  );
}

export function AdminUsersTable({ onLogout }: AdminUsersTableProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
          password: "",
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

  function downloadTxt(lines: string[], filenamePrefix: string, emptyMessage: string) {
    if (lines.length === 0) {
      setError(emptyMessage);
      return;
    }
    const blob = new Blob([`${lines.join("\n")}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `${filenamePrefix}-${stamp}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportEmailsTxt() {
    const emails = users
      .map((user) => (drafts[user.id]?.email ?? user.email).trim().toLowerCase())
      .filter(Boolean);
    downloadTxt(emails, "emails-clientes", "Nenhum e-mail para extrair.");
  }

  function exportWhatsappsTxt() {
    const phones = users
      .map((user) => (drafts[user.id]?.whatsapp ?? user.whatsapp).trim())
      .filter(Boolean);
    downloadTxt(phones, "whatsapps-clientes", "Nenhum WhatsApp para extrair.");
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

    const newPassword = draft.password.trim();
    if (newPassword && newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setSavingId(id);
    setError(null);
    setSuccess(null);
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
          ...(newPassword ? { password: newPassword } : {}),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        passwordEmailSent?: boolean;
      };
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar.");

      if (newPassword) {
        setSuccess(
          data.passwordEmailSent
            ? `Senha atualizada e e-mail enviado para ${draft.email.trim().toLowerCase()}.`
            : `Senha atualizada, mas o e-mail não foi enviado (verifique RESEND na Vercel).`,
        );
      } else {
        setSuccess("Cliente salvo.");
      }

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
      {success && (
        <p className="rounded-xl border border-[#009739]/35 bg-[#009739]/10 px-4 py-3 text-sm text-[#1ed760]" role="status">
          {success}
        </p>
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
                  className={`${formInputClass} mt-1`}
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
          <section className="overflow-hidden rounded-xl border border-white/15 bg-[#0a1220] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="max-h-[min(72vh,900px)] overflow-auto">
              <table className="w-max min-w-full border-separate border-spacing-0 text-left text-[12px]">
                <thead>
                  <tr>
                    <th className={`${sheetHead} sticky left-0 z-30 bg-[#0b1524]`}>#</th>
                    <th className={sheetHead}>Nome</th>
                    <th className={sheetHead}>E-mail</th>
                    <th className={sheetHead}>WhatsApp</th>
                    <th className={sheetHead}>Serviços</th>
                    <th className={sheetHead}>Valor</th>
                    <th className={sheetHead}>Vencimento</th>
                    <th className={sheetHead}>Ativo</th>
                    <th className={sheetHead}>Nova senha</th>
                    <th
                      className={`${sheetHead} sticky right-0 z-30 border-l border-white/20 bg-[#0b1524] shadow-[-8px_0_12px_rgba(0,0,0,0.35)]`}
                    >
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => {
                    const draft = drafts[user.id];
                    if (!draft) return null;
                    const isSaving = savingId === user.id;
                    const urgency = getDueUrgency(draft.nextDueAt);
                    const urgencyLabel = dueUrgencyLabel(draft.nextDueAt);
                    const rowBg =
                      urgency === "overdue"
                        ? "bg-red-950/40"
                        : urgency === "soon"
                          ? "bg-amber-950/30"
                          : index % 2 === 0
                            ? "bg-[#0a1220]"
                            : "bg-[#0d1628]";

                    return (
                      <tr key={user.id} className={`${rowBg} hover:bg-white/[0.04]`}>
                        <td
                          className={`${sheetCell} sticky left-0 z-10 font-mono text-[11px] font-bold text-[#FFDF00] ${rowBg}`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className={sheetCell}>
                          <input
                            value={draft.name}
                            onChange={(e) => updateDraft(user.id, { name: e.target.value })}
                            className={`${sheetInputClass} min-w-[9rem]`}
                          />
                        </td>
                        <td className={sheetCell}>
                          <input
                            type="email"
                            value={draft.email}
                            onChange={(e) => updateDraft(user.id, { email: e.target.value })}
                            className={`${sheetInputClass} min-w-[12rem]`}
                          />
                        </td>
                        <td className={sheetCell}>
                          <input
                            value={draft.whatsapp}
                            onChange={(e) => updateDraft(user.id, { whatsapp: e.target.value })}
                            className={`${sheetInputClass} min-w-[8rem]`}
                          />
                        </td>
                        <td className={`${sheetCell} whitespace-nowrap`}>
                          <ServiceSelector
                            compact
                            value={draft.services}
                            onChange={(services) => updateDraft(user.id, { services })}
                          />
                        </td>
                        <td className={sheetCell}>
                          <SheetMoneyInput
                            value={draft.monthlyValue}
                            onChange={(monthlyValue) => updateDraft(user.id, { monthlyValue })}
                          />
                        </td>
                        <td className={sheetCell}>
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="date"
                              value={draft.nextDueAt}
                              onChange={(e) => updateDraft(user.id, { nextDueAt: e.target.value })}
                              className={`${sheetInputClass} font-mono`}
                            />
                            {urgencyLabel && (
                              <span
                                className={`inline-flex shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
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
                        <td className={`${sheetCell} text-center`}>
                          <input
                            type="checkbox"
                            checked={draft.active}
                            onChange={(e) => updateDraft(user.id, { active: e.target.checked })}
                            className="h-3.5 w-3.5 accent-[#009739]"
                            aria-label="Cliente ativo"
                          />
                        </td>
                        <td className={sheetCell}>
                          <input
                            type="text"
                            autoComplete="new-password"
                            placeholder="Opcional"
                            value={draft.password}
                            onChange={(e) => updateDraft(user.id, { password: e.target.value })}
                            className={`${sheetInputClass} min-w-[7rem] font-mono`}
                            title="Preencha e salve para redefinir e enviar por e-mail"
                          />
                        </td>
                        <td
                          className={`${sheetCell} sticky right-0 z-10 border-l border-white/15 ${rowBg} shadow-[-8px_0_12px_rgba(0,0,0,0.35)]`}
                        >
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => void saveUser(user.id)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 rounded border border-[#009739]/45 bg-[#009739]/20 px-2 py-1 text-[11px] font-semibold text-[#00B347] hover:bg-[#009739]/30 disabled:opacity-50"
                              title="Salvar"
                            >
                              {isSaving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteUser(user.id, user.name)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 rounded border border-red-500/35 bg-red-500/15 px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                              title="Remover"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remover
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

          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              {users.length} cliente{users.length === 1 ? "" : "s"} · exportação .txt (um por linha)
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={exportEmailsTxt}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-[#FFDF00]/35 bg-[#FFDF00]/10 px-4 py-2 text-sm font-semibold text-[#FFDF00] hover:bg-[#FFDF00]/20 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Extrair e-mails
              </button>
              <button
                type="button"
                onClick={exportWhatsappsTxt}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-[#1ed760]/40 bg-[#1ed760]/10 px-4 py-2 text-sm font-semibold text-[#1ed760] hover:bg-[#1ed760]/20 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Extrair WhatsApp
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
