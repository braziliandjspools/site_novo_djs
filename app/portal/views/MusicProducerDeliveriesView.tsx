"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, AudioLines, ChevronDown, CircleCheck, ClipboardList, Loader2, Music2, Pencil, Plus, RefreshCw, Sparkles, Trash2, X } from "lucide-react";
import { PortalCard, PortalPageHeader } from "../PortalShell";
import { MusicProducerDeliveryCard } from "./MusicProducerDeliveryCard";

type BriefingItem = {
  id: number;
  servicePlan: string;
  estimatedQuote: string | null;
  idea: string;
  lyrics: string | null;
  style: string | null;
  occasion: string | null;
  deadline: string | null;
  additionalNotes: string | null;
  status: string;
  statusLabel: string;
  adminNote: string | null;
  createdAtLabel: string;
};

type DeliveriesResponse = {
  enabled: boolean;
  deliveries: Parameters<typeof MusicProducerDeliveryCard>[0]["delivery"][];
  briefings?: BriefingItem[];
};

function EmptyDeliveriesState({ enabled }: { enabled: boolean }) {
  return (
    <PortalCard>
      <div className="flex flex-col items-center py-6 text-center sm:py-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1db954]/15">
          <Music2 className="h-8 w-8 text-[#1db954]" />
        </div>
        <h3 className="mt-5 font-display text-2xl tracking-wide text-white">Nenhuma produção disponível ainda</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
          Que tal produzir sua primeira música? Nossa equipe cuida de tudo — da ideia à faixa final, com briefing
          assistido por IA.
        </p>
        {enabled && (
          <p className="mt-3 max-w-md text-xs text-zinc-500">
            Quando liberadas, você poderá ouvir, avaliar e pedir refazer se necessário.
          </p>
        )}
        <Link
          href="/musicproducer#conte-sua-ideia"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1db954] px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:bg-[#1db954]"
        >
          <Sparkles className="h-4 w-4" />
          Produzir minha música
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </PortalCard>
  );
}

function BriefingCard({
  briefing,
  onUpdated,
}: {
  briefing: BriefingItem;
  onUpdated: () => void;
}) {
  const canEdit = briefing.status === "PENDENTE" || briefing.status === "EM_EDICAO";
  const [idea, setIdea] = useState(briefing.idea);
  const [lyrics, setLyrics] = useState(briefing.lyrics ?? "");
  const [style, setStyle] = useState(briefing.style ?? "");
  const [occasion, setOccasion] = useState(briefing.occasion ?? "");
  const [deadline, setDeadline] = useState(briefing.deadline ?? "");
  const [additionalNotes, setAdditionalNotes] = useState(briefing.additionalNotes ?? "");
  const [editing, setEditing] = useState(briefing.status === "EM_EDICAO");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetDraft() {
    setIdea(briefing.idea);
    setLyrics(briefing.lyrics ?? "");
    setStyle(briefing.style ?? "");
    setOccasion(briefing.occasion ?? "");
    setDeadline(briefing.deadline ?? "");
    setAdditionalNotes(briefing.additionalNotes ?? "");
  }

  async function saveChanges() {
    if (!idea.trim()) {
      setError("Descreva a ideia da música.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/music-producer/briefings/${briefing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim(),
          lyrics: lyrics.trim() || null,
          style: style.trim() || null,
          occasion: occasion.trim() || null,
          deadline: deadline.trim() || null,
          additionalNotes: additionalNotes.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar o pedido.");
      setEditing(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar o pedido.");
    } finally {
      setBusy(false);
    }
  }

  async function removeBriefing() {
    if (!window.confirm("Excluir este pedido do Portal e da administração? Essa ação não pode ser desfeita.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/music-producer/briefings/${briefing.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Não foi possível excluir o pedido.");
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir o pedido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Pedido</p>
          <h3 className="mt-1 font-semibold text-white">{briefing.servicePlan}</h3>
          <p className="mt-1 text-xs text-zinc-500">{briefing.createdAtLabel}</p>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1db954]">
          {briefing.statusLabel}
        </span>
      </div>

      {briefing.adminNote ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {briefing.adminNote}
        </p>
      ) : null}

      {!editing ? <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-zinc-300">{briefing.idea}</p> : null}

      {detailsOpen && !editing ? (
        <dl className="mt-4 grid gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ocasião</dt><dd className="mt-1 text-zinc-200">{briefing.occasion || "Não informada"}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Prazo</dt><dd className="mt-1 text-zinc-200">{briefing.deadline || "Não informado"}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Estilo</dt><dd className="mt-1 whitespace-pre-wrap text-zinc-200">{briefing.style || "Não informado"}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Orçamento estimado</dt><dd className="mt-1 text-zinc-200">{briefing.estimatedQuote || "A confirmar"}</dd></div>
          {briefing.lyrics ? <div className="sm:col-span-2"><dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Letra</dt><dd className="mt-1 whitespace-pre-wrap text-zinc-300">{briefing.lyrics}</dd></div> : null}
          {briefing.additionalNotes ? <div className="sm:col-span-2"><dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Observações</dt><dd className="mt-1 whitespace-pre-wrap text-zinc-300">{briefing.additionalNotes}</dd></div> : null}
        </dl>
      ) : null}

      {editing ? (
        <div className="mt-4 space-y-3 rounded-xl border border-white/[0.07] bg-black/20 p-4">
          <label className="block text-xs font-semibold text-zinc-400">Ideia
            <textarea value={idea} onChange={(event) => setIdea(event.target.value)} rows={4} maxLength={4000} className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#1db954]/50" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-zinc-400">Ocasião
              <input value={occasion} onChange={(event) => setOccasion(event.target.value)} maxLength={120} className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#1db954]/50" />
            </label>
            <label className="block text-xs font-semibold text-zinc-400">Prazo
              <input value={deadline} onChange={(event) => setDeadline(event.target.value)} maxLength={120} className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#1db954]/50" />
            </label>
          </div>
          <label className="block text-xs font-semibold text-zinc-400">Estilo musical
            <input value={style} onChange={(event) => setStyle(event.target.value)} maxLength={240} className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#1db954]/50" />
          </label>
          <label className="block text-xs font-semibold text-zinc-400">Letra (opcional)
            <textarea value={lyrics} onChange={(event) => setLyrics(event.target.value)} rows={4} maxLength={12000} className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#1db954]/50" />
          </label>
          <label className="block text-xs font-semibold text-zinc-400">Observações
            <textarea value={additionalNotes} onChange={(event) => setAdditionalNotes(event.target.value)} rows={3} maxLength={2000} className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#1db954]/50" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void saveChanges()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1db954] px-4 py-2 text-xs font-bold text-black disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}{briefing.status === "EM_EDICAO" ? "Salvar e reenviar" : "Salvar alterações"}
            </button>
            <button type="button" disabled={busy} onClick={() => { resetDraft(); setEditing(false); setError(null); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/5 disabled:opacity-50">
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3">
        {!editing ? <button type="button" onClick={() => setDetailsOpen((open) => !open)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white">
          {detailsOpen ? "Ocultar detalhes" : "Ver detalhes"}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
        </button> : null}
        {canEdit && !editing ? <button type="button" onClick={() => { setEditing(true); setDetailsOpen(false); setError(null); }} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#1db954]/25 bg-[#1db954]/[0.06] px-3 text-xs font-semibold text-[#a5f3bf] transition hover:bg-[#1db954]/[0.12]"><Pencil className="h-3.5 w-3.5" />Editar pedido</button> : null}
        {canEdit ? <button type="button" disabled={busy} onClick={() => void removeBriefing()} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-400/20 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Excluir pedido</button> : null}
      </div>
      {error ? <p role="alert" className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-sm text-red-200">{error}</p> : null}
    </PortalCard>
  );
}

export function MusicProducerDeliveriesView() {
  const [data, setData] = useState<DeliveriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/music-producer/deliveries", { cache: "no-store" });
      if (!res.ok) throw new Error("Não foi possível carregar suas produções.");
      setData((await res.json()) as DeliveriesResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDeliveries();
  }, [loadDeliveries]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#00ff9d]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PortalPageHeader title="Minhas produções" subtitle="Pedidos e entregas de produção musical." />
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => void loadDeliveries()}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  const deliveries = data?.deliveries ?? [];
  const briefings = data?.briefings ?? [];
  const isEmpty = deliveries.length === 0 && briefings.length === 0;
  const pendingBriefings = briefings.filter((briefing) => briefing.status === "PENDENTE" || briefing.status === "EM_REVISAO").length;
  const productionBriefings = briefings.filter((briefing) => briefing.status === "EM_PRODUCAO").length;
  const releasedDeliveries = deliveries.filter((delivery) => delivery.status === "released").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PortalPageHeader
          title="Minhas produções"
          subtitle="Acompanhe pedidos e faixas liberadas — status iguais aos do painel admin."
        />
        <div className="flex flex-wrap items-center gap-2">
          {!isEmpty ? <Link href="/musicproducer#conte-sua-ideia" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1db954] px-4 text-xs font-bold text-black transition hover:bg-[#55e986]">
            <Plus className="h-4 w-4" /> Nova produção
          </Link> : null}
          {!isEmpty && (
            <button
              type="button"
              onClick={() => void loadDeliveries()}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
          )}
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumo das produções">
        {[
          { label: "Pedidos em análise", value: pendingBriefings, icon: ClipboardList, color: "text-sky-200", tint: "bg-sky-300/10" },
          { label: "Em produção", value: productionBriefings, icon: AudioLines, color: "text-amber-200", tint: "bg-amber-300/10" },
          { label: "Faixas liberadas", value: releasedDeliveries, icon: CircleCheck, color: "text-[#a5f3bf]", tint: "bg-[#1db954]/10" },
        ].map(({ label, value, icon: Icon, color, tint }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#181818] p-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tint} ${color}`}><Icon className="h-5 w-5" /></span>
            <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</span><span className="mt-1 block text-xl font-bold text-white">{value}</span></span>
          </div>
        ))}
      </section>

      {isEmpty ? (
        <EmptyDeliveriesState enabled={Boolean(data?.enabled)} />
      ) : (
        <div className="space-y-6">
          {briefings.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Pedidos</h2>
              <div className="grid gap-3">
                {briefings.map((briefing) => (
                  <BriefingCard key={briefing.id} briefing={briefing} onUpdated={() => void loadDeliveries()} />
                ))}
              </div>
            </section>
          )}

          {deliveries.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Entregas</h2>
              <div className="grid gap-3">
                {deliveries.map((delivery) => (
                  <MusicProducerDeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    expanded={expandedId === delivery.id}
                    onToggle={() => setExpandedId((current) => (current === delivery.id ? null : delivery.id))}
                    onUpdated={() => void loadDeliveries()}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
