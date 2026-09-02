"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Loader2, Music2, RefreshCw, Sparkles } from "lucide-react";
import { PortalCard, PortalPageHeader } from "../PortalShell";
import { MusicProducerDeliveryCard } from "./MusicProducerDeliveryCard";

type DeliveriesResponse = {
  enabled: boolean;
  deliveries: Parameters<typeof MusicProducerDeliveryCard>[0]["delivery"][];
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
  const isEmpty = deliveries.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PortalPageHeader
          title="Minhas produções"
          subtitle={
            isEmpty
              ? "Suas faixas finalizadas aparecem aqui assim que forem liberadas."
              : "Clique na música para avaliar ou solicitar correção."
          }
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
      )}
    </div>
  );
}
