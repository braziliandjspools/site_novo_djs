"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, LogOut, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { daysUntilDue, getDueUrgency, toDateInputValue } from "../lib/due-queue";

type PortalPlan = "NONE" | "VIP" | "DEEMIX" | "ALLAVSOFT";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  plan: PortalPlan;
  planLabel: string;
  dueDay: number;
  nextDueAt: string;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  queuePosition: number;
  positionInGroup: number;
};

type UserGroup = {
  label: string;
  users: AdminUser[];
};

type AdminUsersTableProps = {
  onLogout: () => void;
};

type DraftRow = {
  name: string;
  whatsapp: string;
  plan: PortalPlan;
  dueDay: string;
  nextDueAt: string;
  active: boolean;
  notes: string;
};

const emptyDraft = (): DraftRow => ({
  name: "",
  whatsapp: "",
  plan: "VIP",
  dueDay: "15",
  nextDueAt: "",
  active: true,
  notes: "",
});

function rowUrgencyClass(urgency: ReturnType<typeof getDueUrgency>) {
  if (urgency === "soon") return "bg-amber-500/10 ring-1 ring-inset ring-amber-500/35";
  if (urgency === "overdue") return "bg-red-500/10 ring-1 ring-inset ring-red-500/35";
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
  "w-full min-w-0 rounded-md border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-white outline-none focus:border-[#009739]/50";

export function AdminUsersTable({ onLogout }: AdminUsersTableProps) {
  const [groups, setGroups] = useState<UserGroup[]>([]);
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
    plan: "VIP" as PortalPlan,
    dueDay: "15",
    nextDueAt: "",
    notes: "",
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
      const data = (await res.json()) as { groups?: UserGroup[]; total?: number };
      setGroups(data.groups ?? []);
      setTotal(data.total ?? 0);

      const nextDrafts: Record<number, DraftRow> = {};
      for (const group of data.groups ?? []) {
        for (const user of group.users) {
          nextDrafts[user.id] = {
            name: user.name,
            whatsapp: user.whatsapp,
            plan: user.plan,
            dueDay: String(user.dueDay),
            nextDueAt: toDateInputValue(user.nextDueAt),
            active: user.active,
            notes: user.notes ?? "",
          };
        }
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

  async function saveUser(id: number) {
    const draft = drafts[id];
    if (!draft) return;

    const dueDay = Number(draft.dueDay);
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      setError("Dia de vencimento inválido.");
      return;
    }

    if (!draft.nextDueAt) {
      setError("Informe a data do próximo vencimento.");
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
          whatsapp: draft.whatsapp,
          plan: draft.plan,
          dueDay,
          nextDueAt: draft.nextDueAt,
          active: draft.active,
          notes: draft.notes || null,
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

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUser,
          dueDay: Number(newUser.dueDay),
          nextDueAt: newUser.nextDueAt || undefined,
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
        plan: "VIP",
        dueDay: "15",
        nextDueAt: "",
        notes: "",
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

  const allUsers = groups.flatMap((group) => group.users);
  const dueSoonCount = allUsers.filter((user) => {
    const nextDueAt = drafts[user.id]?.nextDueAt ?? user.nextDueAt;
    return getDueUrgency(nextDueAt) === "soon";
  }).length;
  const overdueCount = allUsers.filter((user) => {
    const nextDueAt = drafts[user.id]?.nextDueAt ?? user.nextDueAt;
    return getDueUrgency(nextDueAt) === "overdue";
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#FFDF00]">Administração</p>
          <h1 className="font-display text-3xl text-white">Clientes do portal</h1>
          <p className="mt-1 text-sm text-gray-400">
            {total} clientes · fila ordenada pelo próximo vencimento
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-[#009739]/40 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => setShowCreate((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full bg-[#009739] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00B347]"
          >
            <Plus className="h-4 w-4" />
            Novo cliente
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-red-500/40 hover:text-red-300"
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
          className="rounded-2xl border border-[#009739]/40 bg-[#009739]/10 p-6"
        >
          <h2 className="font-display text-xl text-white">Cadastrar cliente</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["name", "Nome completo"],
              ["email", "E-mail"],
              ["password", "Senha (mín. 8)"],
              ["whatsapp", "WhatsApp"],
              ["dueDay", "Dia vencimento (1-31)"],
              ["nextDueAt", "Próx. vencimento (opcional)"],
              ["notes", "Observações"],
            ].map(([key, label]) => (
              <label key={key} className="block text-xs text-gray-400">
                {label}
                <input
                  type={key === "password" ? "password" : key === "nextDueAt" ? "date" : "text"}
                  required={key !== "notes" && key !== "nextDueAt"}
                  value={newUser[key as keyof typeof newUser]}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, [key]: e.target.value }))}
                  className={`${inputClass} mt-1`}
                />
              </label>
            ))}
            <label className="block text-xs text-gray-400">
              Plano
              <select
                value={newUser.plan}
                onChange={(e) => setNewUser((prev) => ({ ...prev, plan: e.target.value as PortalPlan }))}
                className={`${inputClass} mt-1`}
              >
                <option value="NONE">Sem plano</option>
                <option value="VIP">VIP</option>
                <option value="DEEMIX">Deemix</option>
                <option value="ALLAVSOFT">Allavsoft</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFDF00] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[#002776] disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Cadastrar
          </button>
        </form>
      )}

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-gray-400">
          Nenhum cliente cadastrado ainda.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.label} className="overflow-hidden rounded-2xl border border-[#002776]/60 bg-[#002776]/10">
            <div className="border-b border-white/10 bg-[#002776]/20 px-4 py-3">
              <h2 className="font-display text-lg capitalize text-[#FFDF00]">Fila · {group.label}</h2>
              <p className="text-xs text-gray-400">{group.users.length} clientes neste vencimento</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20 text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="px-3 py-3"># Fila</th>
                    <th className="px-3 py-3">Nome</th>
                    <th className="px-3 py-3">E-mail</th>
                    <th className="px-3 py-3">WhatsApp</th>
                    <th className="px-3 py-3">Plano</th>
                    <th className="px-3 py-3">Dia venc.</th>
                    <th className="px-3 py-3">Próx. vencimento</th>
                    <th className="px-3 py-3">Ativo</th>
                    <th className="px-3 py-3">Observações</th>
                    <th className="px-3 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {group.users.map((user) => {
                    const draft = drafts[user.id];
                    if (!draft) return null;
                    const isSaving = savingId === user.id;
                    const urgency = getDueUrgency(draft.nextDueAt);
                    const urgencyLabel = dueUrgencyLabel(draft.nextDueAt);

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-white/5 hover:bg-white/[0.02] ${rowUrgencyClass(urgency)}`}
                      >
                        <td className="px-3 py-2 font-mono text-[#FFDF00]">
                          {String(user.queuePosition).padStart(2, "0")}
                          <span className="ml-1 text-gray-600">({user.positionInGroup})</span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={draft.name}
                            onChange={(e) => updateDraft(user.id, { name: e.target.value })}
                            className={inputClass}
                          />
                        </td>
                        <td className="px-3 py-2 text-gray-300">{user.email}</td>
                        <td className="px-3 py-2">
                          <input
                            value={draft.whatsapp}
                            onChange={(e) => updateDraft(user.id, { whatsapp: e.target.value })}
                            className={inputClass}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={draft.plan}
                            onChange={(e) => updateDraft(user.id, { plan: e.target.value as PortalPlan })}
                            className={inputClass}
                          >
                            <option value="NONE">Sem plano</option>
                <option value="VIP">VIP</option>
                            <option value="DEEMIX">Deemix</option>
                            <option value="ALLAVSOFT">Allavsoft</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={draft.dueDay}
                            onChange={(e) => updateDraft(user.id, { dueDay: e.target.value })}
                            className={`${inputClass} w-16 font-mono`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <input
                              type="date"
                              value={draft.nextDueAt}
                              onChange={(e) => updateDraft(user.id, { nextDueAt: e.target.value })}
                              className={`${inputClass} min-w-[140px] font-mono`}
                            />
                            {urgencyLabel && (
                              <span
                                className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
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
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={draft.active}
                            onChange={(e) => updateDraft(user.id, { active: e.target.checked })}
                            className="h-4 w-4 accent-[#009739]"
                          />
                        </td>
                        <td className="px-3 py-2 min-w-[160px]">
                          <input
                            value={draft.notes}
                            onChange={(e) => updateDraft(user.id, { notes: e.target.value })}
                            className={inputClass}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => void saveUser(user.id)}
                              disabled={isSaving}
                              className="rounded-md border border-[#009739]/40 bg-[#009739]/15 p-2 text-[#00B347] hover:bg-[#009739]/25 disabled:opacity-50"
                              title="Salvar"
                            >
                              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteUser(user.id, user.name)}
                              disabled={isSaving}
                              className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20 disabled:opacity-50"
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
        ))
      )}
    </div>
  );
}
