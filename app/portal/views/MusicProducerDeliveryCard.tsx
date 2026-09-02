"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  Download,
  Loader2,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Star,
} from "lucide-react";
import { PortalBadge } from "../PortalShell";

type PortalDelivery = {
  id: number;
  title: string;
  servicePlan: string | null;
  chargedAmount: string | null;
  orderDateLabel: string;
  releasedAtLabel: string | null;
  downloadUrl: string | null;
  downloadApiUrl: string | null;
  playUrl: string | null;
  notes: string | null;
  status: "hidden" | "released" | "in_progress";
  statusLabel: string;
  clientRating: number | null;
  clientReview: string | null;
  redoRequested: boolean;
  redoReason: "ai" | "producer" | "both" | null;
  redoReasonLabel: string | null;
  redoNotes: string | null;
  canReview: boolean;
};

type DeliveryCardProps = {
  delivery: PortalDelivery;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: () => void;
};

type AccordionPanel = "rate" | "correct";

function statusBadgeVariant(status: PortalDelivery["status"]) {
  if (status === "released") return "green" as const;
  if (status === "in_progress") return "amber" as const;
  return "red" as const;
}

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className="rounded p-0.5 transition-colors hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
        >
          <Star
            className={`h-5 w-5 ${star <= value ? "fill-[#FFDF00] text-[#FFDF00]" : "text-zinc-600"}`}
          />
        </button>
      ))}
    </div>
  );
}

export function MusicProducerDeliveryCard({ delivery, expanded, onToggle, onUpdated }: DeliveryCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [panel, setPanel] = useState<AccordionPanel>("rate");
  const [rating, setRating] = useState(delivery.clientRating ?? 0);
  const [review, setReview] = useState(delivery.clientReview ?? "");
  const [redoReason, setRedoReason] = useState<"ai" | "producer" | "both">("producer");
  const [redoNotes, setRedoNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    setRating(delivery.clientRating ?? 0);
    setReview(delivery.clientReview ?? "");
  }, [delivery.clientRating, delivery.clientReview]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !delivery.playUrl) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    setPlayerError(null);
    void audio.play().catch(() => {
      setPlayerError("Não foi possível reproduzir. Tente baixar a faixa.");
      setPlaying(false);
    });
  }

  async function submitRating() {
    if (!delivery.canReview) return;
    if (rating < 1) {
      setFeedbackError("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    setSubmitting(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const res = await fetch(`/api/portal/music-producer/deliveries/${delivery.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ rating, review }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar.");

      setFeedbackSuccess("Avaliação enviada. Obrigado pelo feedback!");
      onUpdated();
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitCorrection() {
    if (!delivery.canReview) return;
    if (redoNotes.trim().length < 10) {
      setFeedbackError("Descreva o que precisa ser corrigido com pelo menos 10 caracteres.");
      return;
    }

    setSubmitting(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const res = await fetch(`/api/portal/music-producer/deliveries/${delivery.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          rating: rating > 0 ? rating : undefined,
          review: review || undefined,
          requestRedo: true,
          redoReason,
          redoNotes,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar.");

      setFeedbackSuccess("Pedido de correção enviado! Nossa equipe irá revisar e enviar uma nova versão.");
      setRedoNotes("");
      onUpdated();
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  const panels: { id: AccordionPanel; label: string; icon: typeof Star }[] = delivery.canReview
    ? [
        { id: "rate", label: "Avaliar", icon: Star },
        { id: "correct", label: "Corrigir", icon: RotateCcw },
      ]
    : [];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#1a1a1a]">
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onToggle}
            className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:opacity-90"
          >
            <ChevronDown
              className={`h-5 w-5 flex-shrink-0 text-[#00ff9d] transition-transform ${expanded ? "rotate-180" : ""}`}
            />
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1DB954]/15">
              <Music2 className="h-5 w-5 text-[#1DB954]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-display text-lg tracking-wide text-white">{delivery.title}</span>
                <PortalBadge variant={statusBadgeVariant(delivery.status)}>{delivery.statusLabel}</PortalBadge>
                {delivery.clientRating && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-[#FFDF00]">
                    <Star className="h-3 w-3 fill-current" />
                    {delivery.clientRating}
                  </span>
                )}
                {delivery.redoRequested && <PortalBadge variant="amber">Correção em análise</PortalBadge>}
              </div>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                Pedido {delivery.orderDateLabel}
                {delivery.releasedAtLabel ? ` · Liberado ${delivery.releasedAtLabel}` : ""}
                {delivery.servicePlan ? ` · ${delivery.servicePlan}` : ""}
              </p>
            </div>
          </button>

          {delivery.playUrl ? (
            <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0 sm:justify-end">
              <button
                type="button"
                onClick={togglePlay}
                className="inline-flex items-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-black hover:bg-[#00e68a]"
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {playing ? "Pausar" : "Ouvir"}
              </button>
              <a
                href={delivery.downloadApiUrl ?? "#"}
                download
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:border-[#00ff9d]/40 hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar
              </a>
              <audio
                ref={audioRef}
                src={delivery.playUrl}
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onError={() => {
                  setPlayerError("Não foi possível carregar o áudio.");
                  setPlaying(false);
                }}
                className="hidden"
              />
            </div>
          ) : (
            <span className="inline-flex items-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-300 sm:flex-shrink-0">
              Aguardando liberação
            </span>
          )}
        </div>

        {playerError && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{playerError}</p>
        )}
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 px-4 pb-5 pt-4 sm:px-5">
          {delivery.chargedAmount && (
            <p className="mb-4 text-sm text-[#00ff9d]">
              Valor cobrado: <span className="font-bold text-white">{delivery.chargedAmount}</span>
            </p>
          )}

          {delivery.notes && (
            <p className="mb-4 rounded-lg bg-zinc-900/80 px-3 py-2 text-sm text-zinc-400">{delivery.notes}</p>
          )}

          {delivery.redoRequested && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <p className="font-semibold">Correção solicitada — aguardando nova versão</p>
              <p className="mt-1 text-xs text-amber-100/90">
                {delivery.redoReasonLabel}
                {delivery.redoNotes ? ` — ${delivery.redoNotes}` : ""}
              </p>
            </div>
          )}

          {delivery.canReview && panels.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {panels.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setPanel(id);
                    setFeedbackError(null);
                    setFeedbackSuccess(null);
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                    panel === id
                      ? id === "correct"
                        ? "bg-[#FFDF00] text-[#002776]"
                        : "bg-[#00ff9d] text-black"
                      : "border border-zinc-700 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {panel === "rate" && delivery.canReview && (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-zinc-500">
                Ouça a faixa e nos diga o que achou. Sua avaliação ajuda a melhorar nossas produções.
              </p>

              {delivery.clientRating && (
                <p className="text-xs text-zinc-400">
                  Avaliação atual: {delivery.clientRating}/5
                  {delivery.clientReview ? ` — “${delivery.clientReview}”` : ""}
                </p>
              )}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Nota</p>
                <StarRating value={rating} onChange={setRating} disabled={submitting} />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Comentário (opcional)
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                  disabled={submitting}
                  placeholder="Conte o que achou da faixa..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-[#00ff9d]/50"
                />
              </div>

              {feedbackError && (
                <p className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {feedbackError}
                </p>
              )}
              {feedbackSuccess && (
                <p className="rounded-lg bg-[#00ff9d]/10 px-3 py-2 text-sm text-[#00ff9d]">{feedbackSuccess}</p>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitRating()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#FFDF00] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#002776] hover:bg-[#FFE566] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                Enviar avaliação
              </button>
            </div>
          )}

          {panel === "correct" && delivery.canReview && (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-zinc-500">
                Algo saiu errado na letra, estilo ou produção? Solicite uma correção informando se o erro foi da IA,
                do produtor ou de ambos.
              </p>

              <div className="space-y-3 rounded-lg border border-[#FFDF00]/20 bg-[#FFDF00]/5 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#FFDF00]">Motivo da correção</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["ai", "Erro da IA"],
                      ["producer", "Erro do produtor"],
                      ["both", "IA e produtor"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      disabled={submitting}
                      onClick={() => setRedoReason(value)}
                      className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        redoReason === value
                          ? "bg-[#FFDF00] text-[#002776]"
                          : "border border-zinc-700 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={redoNotes}
                  onChange={(e) => setRedoNotes(e.target.value)}
                  rows={4}
                  disabled={submitting}
                  placeholder="Explique o que precisa ser corrigido na faixa..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-[#FFDF00]/50"
                />
              </div>

              {feedbackError && (
                <p className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {feedbackError}
                </p>
              )}
              {feedbackSuccess && (
                <p className="rounded-lg bg-[#00ff9d]/10 px-3 py-2 text-sm text-[#00ff9d]">{feedbackSuccess}</p>
              )}

              <button
                type="button"
                disabled={submitting || delivery.redoRequested}
                onClick={() => void submitCorrection()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#FFDF00] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#002776] hover:bg-[#FFE566] disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                {delivery.redoRequested ? "Correção já solicitada" : "Solicitar correção"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
