"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Download, Loader2, LogOut, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { daysUntilDue, getDueUrgency, toDateInputValue } from "../lib/due-queue";

import { ServiceSelector, emptyServices, servicesSummary, type ServiceDraft } from "./ServiceSelector";

type ServiceBillingLineApi = {
  value: number;
  valueLabel: string;
  dueAt: string | null;
};

type AdminServiceBilling = {
  poolsVip: ServiceBillingLineApi;
  deemix: ServiceBillingLineApi;
  allavsoft: ServiceBillingLineApi;
};

type AdminUser = {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  services: ServiceDraft;
  servicesLabel: string;
  serviceBilling: AdminServiceBilling;
  monthlyValue: number;
  monthlyValueLabel: string;
  nextDueAt: string;
  active: boolean;
  musicProducerDeliveriesEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminUsersTableProps = {
  onLogout: () => void;
};

type ServiceBillingLineDraft = {
  value: string;
  dueAt: string;
};

type ServiceBillingDraft = {
  poolsVip: ServiceBillingLineDraft;
  deemix: ServiceBillingLineDraft;
  allavsoft: ServiceBillingLineDraft;
};

type ServiceBillingKey = keyof ServiceBillingDraft;

type DraftRow = {
  name: string;
  email: string;
  whatsapp: string;
  services: ServiceDraft;
  serviceBilling: ServiceBillingDraft;
  /** Agregado (API) — usado na listagem. */
  monthlyValue: string;
  nextDueAt: string;
  active: boolean;
  musicProducerDeliveriesEnabled: boolean;
  /** Nova senha opcional — se preenchida no save, envia e-mail via Resend. */
  password: string;
};

const SERVICE_BILLING_ITEMS: Array<{
  key: ServiceBillingKey;
  label: string;
  dueRequired: boolean;
  dueHint?: string;
}> = [
  { key: "poolsVip", label: "Pools VIP", dueRequired: true },
  {
    key: "allavsoft",
    label: "Allavsoft",
    dueRequired: false,
    dueHint: "Deixe em branco para licença vitalícia",
  },
];

const emptyBillingLine = (): ServiceBillingLineDraft => ({
  value: "0",
  dueAt: "",
});

const emptyServiceBilling = (): ServiceBillingDraft => ({
  poolsVip: emptyBillingLine(),
  deemix: emptyBillingLine(),
  allavsoft: emptyBillingLine(),
});

function billingFromUser(billing: AdminServiceBilling | undefined): ServiceBillingDraft {
  if (!billing) return emptyServiceBilling();
  return {
    poolsVip: {
      value: String(billing.poolsVip?.value ?? 0),
      dueAt: billing.poolsVip?.dueAt ? toDateInputValue(billing.poolsVip.dueAt) : "",
    },
    deemix: {
      value: String(billing.deemix?.value ?? 0),
      dueAt: billing.deemix?.dueAt ? toDateInputValue(billing.deemix.dueAt) : "",
    },
    allavsoft: {
      value: String(billing.allavsoft?.value ?? 0),
      dueAt: billing.allavsoft?.dueAt ? toDateInputValue(billing.allavsoft.dueAt) : "",
    },
  };
}

const emptyDraft = (): DraftRow => ({
  name: "",
  email: "",
  whatsapp: "",
  services: emptyServices(),
  serviceBilling: emptyServiceBilling(),
  monthlyValue: "0",
  nextDueAt: "",
  active: true,
  musicProducerDeliveriesEnabled: false,
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
  if (!nextDueAt) return null;
  const urgency = getDueUrgency(nextDueAt);
  if (urgency === "overdue") return "Vencido";
  if (urgency !== "soon") return null;

  const days = daysUntilDue(nextDueAt);
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Amanhã";
  return `${days} dias`;
}

function formatDateBr(isoOrDate: string) {
  if (!isoOrDate) return "—";
  const date = new Date(isoOrDate.includes("T") ? isoOrDate : `${isoOrDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

const formInputClass =
  "w-full min-w-0 rounded-lg border border-white/10 bg-[#0a0a0a]/70 px-2.5 py-2 text-xs text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#009739]/55 focus:bg-black/40";

const sheetCell = "border-b border-r border-white/[0.08] px-3 py-2.5 align-middle";

const sheetHead =
  "sticky top-0 z-20 border-b border-r border-white/15 bg-[#0b1524] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 whitespace-nowrap";

function MoneyInput({
  value,
  onChange,
  className = "",
  ariaLabel = "Valor mensal",
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  ariaLabel?: string;
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
        aria-label={ariaLabel}
      />
      <p className="text-[10px] tabular-nums text-zinc-500">
        {formatBrl(0)} <span className="text-zinc-600">({formatBrl(numeric)})</span>
      </p>
    </div>
  );
}

function UserAccountModal({
  user,
  draft,
  isSaving,
  onClose,
  onChange,
  onSave,
  onDelete,
}: {
  user: AdminUser;
  draft: DraftRow;
  isSaving: boolean;
  onClose: () => void;
  onChange: (patch: Partial<DraftRow>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Foca só na abertura — nunca a cada digitação (onClose inline mudava e o efeito
    // recolocava o foco no botão Fechar, 1º focável do painel).
    const firstField = panelRef.current?.querySelector<HTMLElement>("input, textarea, select");
    window.requestAnimationFrame(() => firstField?.focus());

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function patchServiceBilling(key: ServiceBillingKey, patch: Partial<ServiceBillingLineDraft>) {
    onChange({
      serviceBilling: {
        ...draft.serviceBilling,
        [key]: { ...draft.serviceBilling[key], ...patch },
      },
    });
  }

  function toggleService(key: ServiceBillingKey, enabled: boolean) {
    onChange({
      services: { ...draft.services, [key]: enabled },
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[81] flex max-h-[min(92vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/15 bg-[#0d1628] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FFDF00]">Conta do cliente</p>
            <h2 id={titleId} className="mt-1 truncate font-display text-xl text-white sm:text-2xl">
              {draft.name.trim() || user.name}
            </h2>
            <p className="mt-1 truncate text-xs text-zinc-500">{draft.email || user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-white/25 hover:text-white"
            aria-label="Fechar popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">Dados pessoais</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-gray-400 sm:col-span-2">
                Nome completo
                <input
                  value={draft.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  className={`${formInputClass} mt-1`}
                />
              </label>
              <label className="block text-xs text-gray-400">
                E-mail
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => onChange({ email: e.target.value })}
                  className={`${formInputClass} mt-1`}
                />
              </label>
              <label className="block text-xs text-gray-400">
                WhatsApp
                <input
                  value={draft.whatsapp}
                  onChange={(e) => onChange({ whatsapp: e.target.value })}
                  className={`${formInputClass} mt-1`}
                />
              </label>
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-white/10 pt-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              Serviços e cobrança
            </h3>
            <p className="text-[11px] text-zinc-500">
              Defina valor e vencimento por serviço. Allavsoft sem data = vitalícia. Resumo atual:{" "}
              <span className="font-mono text-zinc-300">{formatBrl(parseBrlInput(draft.monthlyValue) ?? 0)}</span>
              {draft.nextDueAt ? (
                <>
                  {" "}
                  · próximo venc. agregado {formatDateBr(draft.nextDueAt)}
                </>
              ) : null}
            </p>
            <div className="space-y-3">
              {SERVICE_BILLING_ITEMS.map(({ key, label, dueRequired, dueHint }) => {
                const enabled = draft.services[key];
                const line = draft.serviceBilling[key];
                const urgency = line.dueAt ? getDueUrgency(line.dueAt) : null;
                const urgencyLabel = line.dueAt ? dueUrgencyLabel(line.dueAt) : null;

                return (
                  <div
                    key={key}
                    className="rounded-lg border border-white/10 bg-black/25 p-3"
                  >
                    <label className="flex items-center gap-3 text-sm text-zinc-200">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => toggleService(key, e.target.checked)}
                        className="h-4 w-4 accent-[#009739]"
                      />
                      <span className="font-medium">{label}</span>
                      {!dueRequired && (
                        <span className="text-[10px] font-normal uppercase tracking-wide text-zinc-500">
                          vitalícia opcional
                        </span>
                      )}
                    </label>

                    {enabled && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs text-gray-400">
                          Valor
                          <div className="mt-1">
                            <MoneyInput
                              value={line.value}
                              onChange={(value) => patchServiceBilling(key, { value })}
                              ariaLabel={`Valor ${label}`}
                            />
                          </div>
                        </label>
                        <label className="block text-xs text-gray-400">
                          {dueRequired ? "Vencimento" : "Vencimento (opcional)"}
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <input
                              type="date"
                              value={line.dueAt}
                              onChange={(e) => patchServiceBilling(key, { dueAt: e.target.value })}
                              className={`${formInputClass} font-mono`}
                            />
                            {urgencyLabel && urgency && (
                              <span
                                className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                  urgency === "overdue"
                                    ? "bg-red-500/20 text-red-300"
                                    : "bg-amber-500/20 text-amber-200"
                                }`}
                              >
                                {urgencyLabel}
                              </span>
                            )}
                          </div>
                          {dueHint ? <p className="mt-1 text-[10px] text-zinc-500">{dueHint}</p> : null}
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-white/10 pt-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              Configurações da conta
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => onChange({ active: e.target.checked })}
                  className="h-4 w-4 accent-[#009739]"
                />
                Conta ativa
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={draft.musicProducerDeliveriesEnabled}
                  onChange={(e) => onChange({ musicProducerDeliveriesEnabled: e.target.checked })}
                  className="h-4 w-4 accent-[#009739]"
                />
                Entregas Music Producer
              </label>
            </div>
            <label className="block text-xs text-gray-400">
              Nova senha (opcional)
              <input
                type="text"
                autoComplete="new-password"
                placeholder="Mín. 8 caracteres — envia e-mail ao salvar"
                value={draft.password}
                onChange={(e) => onChange({ password: e.target.value })}
                className={`${formInputClass} mt-1 font-mono`}
              />
            </label>
            <p className="text-[11px] text-zinc-500">
              Cliente desde {formatDateBr(user.createdAt)} · atualizado em {formatDateBr(user.updatedAt)}
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 bg-[#0a1220] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={onDelete}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Remover cliente
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#009739] px-5 py-2 text-sm font-semibold text-white hover:bg-[#00B347] disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
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
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
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
          serviceBilling: billingFromUser(user.serviceBilling),
          monthlyValue: String(user.monthlyValue),
          nextDueAt: toDateInputValue(user.nextDueAt),
          active: user.active,
          musicProducerDeliveriesEnabled: Boolean(user.musicProducerDeliveriesEnabled),
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

    for (const { key, label, dueRequired } of SERVICE_BILLING_ITEMS) {
      if (!draft.services[key]) continue;

      const line = draft.serviceBilling[key];
      const value = parseBrlInput(line.value);
      if (value === null) {
        setError(`Valor inválido para ${label}.`);
        return;
      }
      if (dueRequired && !line.dueAt) {
        setError(`Informe o vencimento de ${label}.`);
        return;
      }
    }

    const newPassword = draft.password.trim();
    if (newPassword && newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    const serviceBilling = {
      poolsVip: {
        value: parseBrlInput(draft.serviceBilling.poolsVip.value) ?? 0,
        dueAt: draft.serviceBilling.poolsVip.dueAt || null,
      },
      deemix: {
        value: parseBrlInput(draft.serviceBilling.deemix.value) ?? 0,
        dueAt: draft.serviceBilling.deemix.dueAt || null,
      },
      allavsoft: {
        value: parseBrlInput(draft.serviceBilling.allavsoft.value) ?? 0,
        dueAt: draft.serviceBilling.allavsoft.dueAt || null,
      },
    };

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
          serviceBilling,
          active: draft.active,
          musicProducerDeliveriesEnabled: draft.musicProducerDeliveriesEnabled,
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
      setSelectedUserId(null);
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

  const selectedUser = selectedUserId != null ? users.find((user) => user.id === selectedUserId) : null;
  const selectedDraft = selectedUserId != null ? drafts[selectedUserId] : null;

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FFDF00]">Administração</p>
          <h1 className="font-display text-2xl text-white sm:text-3xl">Clientes do portal</h1>
          <p className="mt-1 text-sm text-gray-400 [overflow-wrap:anywhere]">
            {total} clientes · clique no nome para editar a conta
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
                    <th className={`${sheetHead} sticky left-0 z-30 w-12 bg-[#0b1524]`}>#</th>
                    <th className={`${sheetHead} sticky left-12 z-30 bg-[#0b1524]`}>Nome</th>
                    <th className={sheetHead}>E-mail</th>
                    <th className={sheetHead}>WhatsApp</th>
                    <th className={sheetHead}>Serviços</th>
                    <th className={sheetHead}>Valor</th>
                    <th className={sheetHead}>Vencimento</th>
                    <th className={sheetHead}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => {
                    const draft = drafts[user.id];
                    if (!draft) return null;
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
                          className={`${sheetCell} sticky left-0 z-10 w-12 font-mono text-[11px] font-bold text-[#FFDF00] ${rowBg}`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className={`${sheetCell} sticky left-12 z-10 min-w-[12rem] ${rowBg}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setSelectedUserId(user.id);
                            }}
                            className="group text-left"
                            title="Abrir conta do cliente"
                          >
                            <span className="block font-semibold text-white underline-offset-2 group-hover:text-[#FFDF00] group-hover:underline">
                              {draft.name || user.name}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-zinc-500 group-hover:text-zinc-400">
                              Abrir ações e configurações
                            </span>
                          </button>
                        </td>
                        <td className={`${sheetCell} min-w-[14rem] text-zinc-300`}>{draft.email}</td>
                        <td className={`${sheetCell} min-w-[9rem] text-zinc-300`}>{draft.whatsapp || "—"}</td>
                        <td className={`${sheetCell} whitespace-nowrap text-zinc-300`}>
                          {servicesSummary(draft.services)}
                        </td>
                        <td className={`${sheetCell} font-mono tabular-nums text-zinc-200`}>
                          {formatBrl(parseBrlInput(draft.monthlyValue) ?? 0)}
                        </td>
                        <td className={sheetCell}>
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-zinc-200">{formatDateBr(draft.nextDueAt)}</span>
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
                        <td className={sheetCell}>
                          <span
                            className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              draft.active
                                ? "bg-[#009739]/20 text-[#1ed760]"
                                : "bg-zinc-700/40 text-zinc-400"
                            }`}
                          >
                            {draft.active ? "Ativo" : "Inativo"}
                          </span>
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

      {selectedUser && selectedDraft && (
        <UserAccountModal
          user={selectedUser}
          draft={selectedDraft}
          isSaving={savingId === selectedUser.id}
          onClose={() => setSelectedUserId(null)}
          onChange={(patch) => updateDraft(selectedUser.id, patch)}
          onSave={() => void saveUser(selectedUser.id)}
          onDelete={() => void deleteUser(selectedUser.id, selectedDraft.name || selectedUser.name)}
        />
      )}
    </div>
  );
}
