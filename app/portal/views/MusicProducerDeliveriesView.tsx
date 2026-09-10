"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Loader2, Music2, RefreshCw, Sparkles } from "lucide-react";
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1DB954]/15">
          <Music2 className="h-8 w-8 text-[#1DB954]" />
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
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:bg-[#1ed760]"
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
  const canEdit = briefing.status === "EM_EDICAO";
  const [idea, setIdea] = useState(briefing.idea);
  const [lyrics, setLyrics] = useState(briefing.lyrics ?? "");
  const [style, setStyle] = useState(briefing.style ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resubmit() {
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
          occasion: briefing.occasion,
          deadline: briefing.deadline,
          additionalNotes: briefing.additionalNotes,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Não foi possível reenviar.");
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reenviar.");
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
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1DB954]">
          {briefing.statusLabel}
        </span>
      </div>

      {briefing.adminNote ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {briefing.adminNote}
        </p>
      ) : null}

      {canEdit ? (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-zinc-400">
            Ideia
            <textarea
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs font-semibold text-zinc-400">
            Letra (opcional)
            <textarea
              value={lyrics}
              onChange={(event) => setLyrics(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs font-semibold text-zinc-400">
            Estilo (opcional)
            <input
              value={style}
              onChange={(event) => setStyle(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void resubmit()}
            className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Corrigir e reenviar
          </button>
        </div>
      ) : (
        <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-zinc-300">{briefing.idea}</p>
      )}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PortalPageHeader
          title="Minhas produções"
          subtitle="Acompanhe pedidos e faixas liberadas — status iguais aos do painel admin."
        />
        {!isEmpty && (
          <button
            type="button"
            onClick={() => void loadDeliveries()}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </button>
        )}
      </div>

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
