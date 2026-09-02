"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  ShieldOff,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { toDeliveryDateInputValue } from "../lib/music-producer-deliveries";

type BriefingItem = {
  id: number;
  portalUserId: number;
  name: string;
  email: string;
  whatsapp: string;
  servicePlan: string;
  estimatedQuote: string | null;
  idea: string;
  lyrics: string | null;
  style: string | null;
  occasion: string | null;
  deadline: string | null;
  deadlineSurcharge: string | null;
  additionalNotes: string | null;
  createdAt: string;
  createdAtLabel: string;
};

type DeliveryItem = {
  id: number;
  title: string;
  servicePlan: string | null;
  chargedAmount: string | null;
  orderDate: string;
  orderDateLabel: string;
  releasedAt: string | null;
  releasedAtLabel: string | null;
  downloadUrl: string | null;
  notes: string | null;
  visible: boolean;
  status: string;
  statusLabel: string;
  clientRating: number | null;
  clientReview: string | null;
  redoRequested: boolean;
  redoReason: "ai" | "producer" | "both" | null;
  redoReasonLabel: string | null;
  redoNotes: string | null;
  redoRequestedAt: string | null;
};

type DeliveryAdminItem = {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  planLabel: string;
  active: boolean;
  musicProducerDeliveriesEnabled: boolean;
  deliveries: DeliveryItem[];
  briefings: BriefingItem[];
};

type DeliveriesAdminResponse = {
  total: number;
  items: DeliveryAdminItem[];
};

type DeliveryDraft = {
  title: string;
  servicePlan: string;
  chargedAmount: string;
  orderDate: string;
  releasedAt: string;
  downloadUrl: string;
  notes: string;
  visible: boolean;
};

type AdminMusicProducerDeliveriesProps = {
  onLogout: () => void;
};

const inputClass =
  "w-full min-w-0 rounded-md border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-white outline-none focus:border-[#009739]/50";

const emptyDraft = (): DeliveryDraft => ({
  title: "",
  servicePlan: "",
  chargedAmount: "",
  orderDate: new Date().toISOString().slice(0, 10),
  releasedAt: "",
  downloadUrl: "",
  notes: "",
  visible: false,
});

async function readApiJson(res: Response) {
  const text = await res.text();
  if (!text.trim()) throw new Error("Resposta vazia do servidor.");
  try {
    return JSON.parse(text) as { error?: string; ok?: boolean };
  } catch {
    throw new Error("Resposta inválida do servidor.");
  }
}

export function AdminMusicProducerDeliveries({ onLogout }: AdminMusicProducerDeliveriesProps) {
  const [data, setData] = useState<DeliveriesAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<number | null>(null);
  const [expandedBriefingId, setExpandedBriefingId] = useState<number | null>(null);
  const [newDrafts, setNewDrafts] = useState<Record<number, DeliveryDraft>>({});
  const [editDrafts, setEditDrafts] = useState<Record<number, DeliveryDraft>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/music-producer/deliveries", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error ?? "Não foi possível carregar as entregas.");
      }
      const payload = (await res.json()) as DeliveriesAdminResponse;
      setData(payload);

      const nextEdits: Record<number, DeliveryDraft> = {};
      for (const user of payload.items) {
        for (const delivery of user.deliveries) {
          nextEdits[delivery.id] = {
            title: delivery.title,
            servicePlan: delivery.servicePlan ?? "",
            chargedAmount: delivery.chargedAmount ?? "",
            orderDate: toDeliveryDateInputValue(delivery.orderDate),
            releasedAt: toDeliveryDateInputValue(delivery.releasedAt),
            downloadUrl: delivery.downloadUrl ?? "",
            notes: delivery.notes ?? "",
            visible: delivery.visible,
          };
        }
      }
      setEditDrafts(nextEdits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as entregas.");
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    onLogout();
  }

  function getNewDraft(userId: number) {
    return newDrafts[userId] ?? emptyDraft();
  }

  function updateNewDraft(userId: number, patch: Partial<DeliveryDraft>) {
    setNewDrafts((prev) => ({
      ...prev,
      [userId]: { ...getNewDraft(userId), ...patch },
    }));
  }

  function updateEditDraft(deliveryId: number, patch: Partial<DeliveryDraft>) {
    setEditDrafts((prev) => ({
      ...prev,
      [deliveryId]: { ...(prev[deliveryId] ?? emptyDraft()), ...patch },
    }));
  }

  async function toggleAccess(user: DeliveryAdminItem) {
    setSavingId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musicProducerDeliveriesEnabled: !user.musicProducerDeliveriesEnabled,
        }),
      });
      const payload = await readApiJson(res);
      if (!res.ok) throw new Error(payload.error ?? "Erro ao salvar.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSavingId(null);
    }
  }

  async function createDelivery(userId: number) {
    const draft = getNewDraft(userId);
    if (!draft.title.trim() || !draft.orderDate || !draft.downloadUrl.trim()) {
      setError("Preencha título, data do pedido e link de download.");
      return;
    }

    setSavingId(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/music-producer/deliveries/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalUserId: userId,
          title: draft.title,
          servicePlan: draft.servicePlan || undefined,
          chargedAmount: draft.chargedAmount || undefined,
          orderDate: draft.orderDate,
          releasedAt: draft.releasedAt || null,
          downloadUrl: draft.downloadUrl,
          notes: draft.notes || undefined,
          visible: draft.visible,
        }),
      });
      const payload = await readApiJson(res);
      if (!res.ok) throw new Error(payload.error ?? "Erro ao cadastrar.");
      setNewDrafts((prev) => ({ ...prev, [userId]: emptyDraft() }));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveDelivery(deliveryId: number) {
    const draft = editDrafts[deliveryId];
    if (!draft?.title.trim() || !draft.orderDate || !draft.downloadUrl.trim()) {
      setError("Preencha título, data do pedido e link de download.");
      return;
    }

    setSavingId(deliveryId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/music-producer/deliveries/orders/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          servicePlan: draft.servicePlan || null,
          chargedAmount: draft.chargedAmount || null,
          orderDate: draft.orderDate,
          releasedAt: draft.releasedAt || null,
          downloadUrl: draft.downloadUrl,
          notes: draft.notes || null,
          visible: draft.visible,
        }),
      });
      const payload = await readApiJson(res);
      if (!res.ok) throw new Error(payload.error ?? "Erro ao salvar.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveDeliveryAndResolve(deliveryId: number) {
    const draft = editDrafts[deliveryId];
    if (!draft?.title.trim() || !draft.orderDate || !draft.downloadUrl.trim()) {
      setError("Preencha título, data do pedido e link de download antes de enviar a correção.");
      return;
    }

    setSavingId(deliveryId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/music-producer/deliveries/orders/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          servicePlan: draft.servicePlan || null,
          chargedAmount: draft.chargedAmount || null,
          orderDate: draft.orderDate,
          releasedAt: draft.releasedAt || null,
          downloadUrl: draft.downloadUrl,
          notes: draft.notes || null,
          visible: draft.visible,
          clearRedo: true,
        }),
      });
      const payload = await readApiJson(res);
      if (!res.ok) throw new Error(payload.error ?? "Erro ao enviar correção.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar correção.");
    } finally {
      setSavingId(null);
    }
  }

  async function clearRedoRequest(deliveryId: number) {
    setSavingId(deliveryId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/music-producer/deliveries/orders/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearRedo: true }),
      });
      const payload = await readApiJson(res);
      if (!res.ok) throw new Error(payload.error ?? "Erro ao marcar refazer como resolvido.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao marcar refazer como resolvido.");
    } finally {
      setSavingId(null);
    }
  }

  async function removeDelivery(deliveryId: number, title: string) {
    if (!window.confirm(`Remover a entrega "${title}"?`)) return;

    setSavingId(deliveryId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/music-producer/deliveries/orders/${deliveryId}`, {
        method: "DELETE",
      });
      const payload = await readApiJson(res);
      if (!res.ok) throw new Error(payload.error ?? "Erro ao remover.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#FFDF00]" />
      </div>
    );
  }

  const enabledCount = data?.items.filter((item) => item.musicProducerDeliveriesEnabled).length ?? 0;
  const deliveryCount = data?.items.reduce((sum, item) => sum + item.deliveries.length, 0) ?? 0;
  const briefingCount = data?.items.reduce((sum, item) => sum + item.briefings.length, 0) ?? 0;
  const redoCount =
    data?.items.reduce((sum, item) => sum + item.deliveries.filter((d) => d.redoRequested).length, 0) ?? 0;

  const sortedItems = [...(data?.items ?? [])].sort((a, b) => {
    const aScore = (a.briefings.length > 0 ? 2 : 0) + (a.deliveries.some((d) => d.redoRequested) ? 1 : 0);
    const bScore = (b.briefings.length > 0 ? 2 : 0) + (b.deliveries.some((d) => d.redoRequested) ? 1 : 0);
    return bScore - aScore;
  });

  function sortDeliveries(deliveries: DeliveryItem[]) {
    return [...deliveries].sort((a, b) => {
      if (a.redoRequested !== b.redoRequested) return a.redoRequested ? -1 : 1;
      return b.id - a.id;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#FFDF00]">Administração</p>
          <h1 className="font-display text-3xl text-white">Produções musicais</h1>
          <p className="mt-1 text-sm text-gray-400">
            {data?.total ?? 0} clientes · {enabledCount} com acesso · {deliveryCount} entregas · {briefingCount} pedidos
            {redoCount > 0 ? ` · ${redoCount} refazer pendente${redoCount === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-300 hover:border-red-500/40 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111] p-4 text-sm text-gray-400">
        <p>
          Cadastre cada pedido com <strong className="text-white">data do pedido</strong>,{" "}
          <strong className="text-white">data de liberação</strong> e{" "}
          <strong className="text-white">link de download</strong>. Briefings enviados pelo cliente em{" "}
          <code className="text-[#FFDF00]">/musicproducer</code> aparecem aqui como novos pedidos.
        </p>
      </div>

      {briefingCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-[#4285F4]/40 bg-[#4285F4]/10 px-4 py-4">
          <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8ab4f8]" />
          <div>
            <p className="font-semibold text-[#8ab4f8]">
              {briefingCount} pedido{briefingCount === 1 ? "" : "s"} de produção aguardando análise
            </p>
            <p className="mt-1 text-sm text-[#8ab4f8]/80">
              Abra o cliente correspondente para ver ideia, letra, estilo e dados do briefing.
            </p>
          </div>
        </div>
      )}

      {redoCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-200">
              {redoCount} produção{redoCount === 1 ? "" : "ões"} aguardando revisão
            </p>
            <p className="mt-1 text-sm text-amber-100/80">
              Abra a faixa com o ícone de aviso, corrija o arquivo e envie o novo link ao cliente.
            </p>
          </div>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        {sortedItems.map((user) => {
          const expanded = expandedUserId === user.id;
          const newDraft = getNewDraft(user.id);
          const userPendingCount = user.deliveries.filter((d) => d.redoRequested).length;
          const userDeliveries = sortDeliveries(user.deliveries);
          const userBriefings = user.briefings;

          return (
            <section
              key={user.id}
              className={`overflow-hidden rounded-xl border ${
                userPendingCount > 0
                  ? "border-amber-500/40"
                  : userBriefings.length > 0
                    ? "border-[#4285F4]/40"
                    : "border-white/10"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 bg-black/30 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExpandedUserId(expanded ? null : user.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-[#FFDF00]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-500" />
                  )}
                  {userPendingCount > 0 && (
                    <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-black">
                        {userPendingCount}
                      </span>
                    </span>
                  )}
                  {userBriefings.length > 0 && userPendingCount === 0 && (
                    <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#4285F4]/20">
                      <FileText className="h-4 w-4 text-[#8ab4f8]" />
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4285F4] text-[9px] font-black text-white">
                        {userBriefings.length}
                      </span>
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className="ml-2 rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {user.deliveries.length} entrega{user.deliveries.length === 1 ? "" : "s"}
                  </span>
                  {userBriefings.length > 0 && (
                    <span className="rounded bg-[#4285F4]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8ab4f8]">
                      {userBriefings.length} pedido{userBriefings.length === 1 ? "" : "s"}
                    </span>
                  )}
                  {userPendingCount > 0 && (
                    <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                      Revisão pendente
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!user.active || savingId === user.id}
                  onClick={() => void toggleAccess(user)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    user.musicProducerDeliveriesEnabled
                      ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {savingId === user.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : user.musicProducerDeliveriesEnabled ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldOff className="h-3.5 w-3.5" />
                  )}
                  {user.musicProducerDeliveriesEnabled ? "Acesso liberado" : "Liberar ao cliente"}
                </button>
              </div>

              {expanded && (
                <div className="space-y-4 border-t border-white/5 p-4">
                  {userBriefings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#8ab4f8]">Pedidos de produção</p>
                      {userBriefings.map((briefing) => {
                        const briefingExpanded = expandedBriefingId === briefing.id;
                        return (
                          <div
                            key={briefing.id}
                            className="overflow-hidden rounded-lg border border-[#4285F4]/30 bg-[#4285F4]/5"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedBriefingId((current) => (current === briefing.id ? null : briefing.id))
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
                            >
                              <ChevronDown
                                className={`h-4 w-4 flex-shrink-0 text-[#8ab4f8] transition-transform ${briefingExpanded ? "rotate-180" : ""}`}
                              />
                              <FileText className="h-4 w-4 flex-shrink-0 text-[#8ab4f8]" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-white">{briefing.servicePlan}</span>
                                  {briefing.estimatedQuote && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1DB954]">
                                      {briefing.estimatedQuote}
                                    </span>
                                  )}
                                </div>
                                <p className="truncate text-xs text-gray-500">
                                  {briefing.createdAtLabel}
                                  {briefing.deadline ? ` · ${briefing.deadline}` : ""}
                                </p>
                              </div>
                            </button>
                            {briefingExpanded && (
                              <div className="space-y-3 border-t border-[#4285F4]/20 p-4 text-sm">
                                <p className="whitespace-pre-wrap text-gray-300">{briefing.idea}</p>
                                {briefing.lyrics && (
                                  <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                      Letra
                                    </p>
                                    <pre className="overflow-x-auto rounded-md bg-black/30 p-3 text-xs leading-relaxed text-gray-300">
                                      {briefing.lyrics}
                                    </pre>
                                  </div>
                                )}
                                {briefing.style && (
                                  <p className="text-gray-400">
                                    <span className="font-semibold text-gray-300">Estilo:</span> {briefing.style}
                                  </p>
                                )}
                                {briefing.occasion && (
                                  <p className="text-gray-400">
                                    <span className="font-semibold text-gray-300">Ocasião:</span> {briefing.occasion}
                                  </p>
                                )}
                                {briefing.deadlineSurcharge && (
                                  <p className="text-gray-400">
                                    <span className="font-semibold text-gray-300">Acréscimo de prazo:</span>{" "}
                                    {briefing.deadlineSurcharge}
                                  </p>
                                )}
                                {briefing.additionalNotes && (
                                  <p className="text-gray-400">
                                    <span className="font-semibold text-gray-300">Observações:</span>{" "}
                                    {briefing.additionalNotes}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {briefing.name} · {briefing.email} · {briefing.whatsapp}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {user.deliveries.length === 0 ? (
                    userBriefings.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhuma entrega cadastrada para este cliente.</p>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhuma entrega cadastrada ainda — use o briefing acima para criar a produção.</p>
                    )
                  ) : (
                    <div className="space-y-2">
                      {userDeliveries.map((delivery) => {
                        const draft = editDrafts[delivery.id];
                        if (!draft) return null;
                        const deliveryExpanded = expandedDeliveryId === delivery.id;

                        return (
                          <div
                            key={delivery.id}
                            className={`overflow-hidden rounded-lg border ${
                              delivery.redoRequested ? "border-amber-500/40 bg-amber-500/5" : "border-white/10 bg-black/20"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedDeliveryId((current) => (current === delivery.id ? null : delivery.id))
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
                            >
                              <ChevronDown
                                className={`h-4 w-4 flex-shrink-0 text-gray-500 transition-transform ${deliveryExpanded ? "rotate-180" : ""}`}
                              />
                              {delivery.redoRequested ? (
                                <ClipboardCheck className="h-4 w-4 flex-shrink-0 text-amber-400" />
                              ) : (
                                <span className="h-4 w-4 flex-shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-white">{draft.title || delivery.title}</span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {delivery.statusLabel}
                                  </span>
                                  {delivery.redoRequested && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                                      <AlertTriangle className="h-3 w-3" />
                                      Revisar
                                    </span>
                                  )}
                                  {delivery.clientRating && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-[#FFDF00]">
                                      <Star className="h-3 w-3 fill-current" />
                                      {delivery.clientRating}/5
                                    </span>
                                  )}
                                </div>
                                <p className="truncate text-xs text-gray-500">
                                  Pedido {delivery.orderDateLabel}
                                  {delivery.releasedAtLabel ? ` · ${delivery.releasedAtLabel}` : ""}
                                </p>
                              </div>
                            </button>

                            {deliveryExpanded && (
                              <div className="space-y-4 border-t border-white/5 p-4">
                                {delivery.redoRequested && (
                                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                                    <div className="flex items-start gap-3">
                                      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                                      <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-amber-200">Cliente solicitou correção</p>
                                        <p className="mt-1 text-sm text-amber-100">
                                          {delivery.redoReasonLabel ?? "Motivo não informado"}
                                        </p>
                                        {delivery.redoNotes && (
                                          <p className="mt-2 rounded-md bg-black/20 px-3 py-2 text-sm text-amber-50/90">
                                            “{delivery.redoNotes}”
                                          </p>
                                        )}
                                        <p className="mt-3 text-xs text-amber-100/70">
                                          Atualize o link abaixo com o arquivo corrigido e clique em{" "}
                                          <strong>Enviar correção</strong> para liberar ao cliente.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {!delivery.redoRequested && (delivery.clientRating || delivery.clientReview) && (
                                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                      Avaliação do cliente
                                    </p>
                                    {delivery.clientRating && (
                                      <p className="mt-2 flex items-center gap-1 text-sm text-white">
                                        <Star className="h-4 w-4 fill-[#FFDF00] text-[#FFDF00]" />
                                        {delivery.clientRating}/5
                                        {delivery.clientReview && (
                                          <span className="text-gray-400"> — “{delivery.clientReview}”</span>
                                        )}
                                      </p>
                                    )}
                                  </div>
                                )}

                                <div className="flex flex-wrap justify-end gap-1">
                                  {delivery.redoRequested && (
                                    <button
                                      type="button"
                                      disabled={savingId === delivery.id}
                                      onClick={() => void saveDeliveryAndResolve(delivery.id)}
                                      className="inline-flex items-center gap-1.5 rounded-md border border-[#FFDF00]/50 bg-[#FFDF00]/20 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#FFDF00] hover:bg-[#FFDF00]/30 disabled:opacity-50"
                                      title="Salvar novo arquivo e marcar revisão como concluída"
                                    >
                                      {savingId === delivery.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Upload className="h-3.5 w-3.5" />
                                      )}
                                      Enviar correção
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={savingId === delivery.id}
                                    onClick={() => void saveDelivery(delivery.id)}
                                    className="rounded-md border border-[#009739]/40 bg-[#009739]/15 p-2 text-[#00B347] hover:bg-[#009739]/25 disabled:opacity-50"
                                    title="Salvar"
                                  >
                                    {savingId === delivery.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Save className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                  {delivery.redoRequested && (
                                    <button
                                      type="button"
                                      disabled={savingId === delivery.id}
                                      onClick={() => void clearRedoRequest(delivery.id)}
                                      className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                                      title="Marcar revisão como resolvida sem alterar arquivo"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={savingId === delivery.id}
                                    onClick={() => void removeDelivery(delivery.id, draft.title)}
                                    className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                                    title="Remover"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <label className="block text-xs text-gray-400 sm:col-span-2 lg:col-span-3">
                              Título da faixa
                              <input
                                value={draft.title}
                                onChange={(e) => updateEditDraft(delivery.id, { title: e.target.value })}
                                className={`${inputClass} mt-1`}
                              />
                            </label>
                            <label className="block text-xs text-gray-400">
                              Tipo de produção
                              <input
                                value={draft.servicePlan}
                                onChange={(e) => updateEditDraft(delivery.id, { servicePlan: e.target.value })}
                                placeholder="Ex.: Música produzida"
                                className={`${inputClass} mt-1`}
                              />
                            </label>
                            <label className="block text-xs text-gray-400">
                              Valor cobrado
                              <input
                                value={draft.chargedAmount}
                                onChange={(e) => updateEditDraft(delivery.id, { chargedAmount: e.target.value })}
                                placeholder="Ex.: R$ 100,00"
                                className={`${inputClass} mt-1`}
                              />
                            </label>
                            <label className="block text-xs text-gray-400">
                              Data do pedido
                              <input
                                type="date"
                                value={draft.orderDate}
                                onChange={(e) => updateEditDraft(delivery.id, { orderDate: e.target.value })}
                                className={`${inputClass} mt-1`}
                              />
                            </label>
                            <label className="block text-xs text-gray-400">
                              Data de liberação
                              <input
                                type="date"
                                value={draft.releasedAt}
                                onChange={(e) => updateEditDraft(delivery.id, { releasedAt: e.target.value })}
                                className={`${inputClass} mt-1`}
                              />
                            </label>
                            <label className="block text-xs text-gray-400 sm:col-span-2 lg:col-span-3">
                              Link de download
                              <input
                                value={draft.downloadUrl}
                                onChange={(e) => updateEditDraft(delivery.id, { downloadUrl: e.target.value })}
                                placeholder="https://drive.google.com/..."
                                className={`${inputClass} mt-1`}
                              />
                            </label>
                            <label className="block text-xs text-gray-400 sm:col-span-2">
                              Observações
                              <input
                                value={draft.notes}
                                onChange={(e) => updateEditDraft(delivery.id, { notes: e.target.value })}
                                className={`${inputClass} mt-1`}
                              />
                            </label>
                            <label className="flex items-center gap-2 self-end text-xs text-gray-300">
                              <input
                                type="checkbox"
                                checked={draft.visible}
                                onChange={(e) => updateEditDraft(delivery.id, { visible: e.target.checked })}
                                className="h-4 w-4 accent-[#009739]"
                              />
                              Visível no portal
                            </label>
                          </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="rounded-lg border border-[#009739]/30 bg-[#009739]/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#00B347]">Nova entrega</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="block text-xs text-gray-400 sm:col-span-2 lg:col-span-3">
                        Título da faixa
                        <input
                          value={newDraft.title}
                          onChange={(e) => updateNewDraft(user.id, { title: e.target.value })}
                          className={`${inputClass} mt-1`}
                        />
                      </label>
                      <label className="block text-xs text-gray-400">
                        Tipo de produção
                        <input
                          value={newDraft.servicePlan}
                          onChange={(e) => updateNewDraft(user.id, { servicePlan: e.target.value })}
                          className={`${inputClass} mt-1`}
                        />
                      </label>
                      <label className="block text-xs text-gray-400">
                        Valor cobrado
                        <input
                          value={newDraft.chargedAmount}
                          onChange={(e) => updateNewDraft(user.id, { chargedAmount: e.target.value })}
                          placeholder="Ex.: R$ 100,00"
                          className={`${inputClass} mt-1`}
                        />
                      </label>
                      <label className="block text-xs text-gray-400">
                        Data do pedido
                        <input
                          type="date"
                          value={newDraft.orderDate}
                          onChange={(e) => updateNewDraft(user.id, { orderDate: e.target.value })}
                          className={`${inputClass} mt-1`}
                        />
                      </label>
                      <label className="block text-xs text-gray-400">
                        Data de liberação
                        <input
                          type="date"
                          value={newDraft.releasedAt}
                          onChange={(e) => updateNewDraft(user.id, { releasedAt: e.target.value })}
                          className={`${inputClass} mt-1`}
                        />
                      </label>
                      <label className="block text-xs text-gray-400 sm:col-span-2 lg:col-span-3">
                        Link de download
                        <input
                          value={newDraft.downloadUrl}
                          onChange={(e) => updateNewDraft(user.id, { downloadUrl: e.target.value })}
                          placeholder="https://drive.google.com/..."
                          className={`${inputClass} mt-1`}
                        />
                      </label>
                      <label className="block text-xs text-gray-400 sm:col-span-2">
                        Observações
                        <input
                          value={newDraft.notes}
                          onChange={(e) => updateNewDraft(user.id, { notes: e.target.value })}
                          className={`${inputClass} mt-1`}
                        />
                      </label>
                      <label className="flex items-center gap-2 self-end text-xs text-gray-300">
                        <input
                          type="checkbox"
                          checked={newDraft.visible}
                          onChange={(e) => updateNewDraft(user.id, { visible: e.target.checked })}
                          className="h-4 w-4 accent-[#009739]"
                        />
                        Visível no portal
                      </label>
                    </div>
                    <button
                      type="button"
                      disabled={savingId === user.id}
                      onClick={() => void createDelivery(user.id)}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFDF00] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#002776] disabled:opacity-60"
                    >
                      {savingId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Adicionar entrega
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
