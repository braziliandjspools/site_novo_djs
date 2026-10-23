"use client";

import Image from "next/image";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowUpRight,
  Check,
  CirclePlay,
  ListMusic,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
  Video,
} from "lucide-react";
import { PortalCard, PortalPageHeader } from "../PortalShell";

type Recommendation = {
  id: string;
  kind: "video" | "playlist";
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
  embedUrl: string;
};

type RecommendationSection = {
  title: string;
  reason: string;
  query: string;
  results: Recommendation[];
};

type RecommendationResponse = {
  overview: string;
  sections: RecommendationSection[];
  error?: string;
};

const EXAMPLE_PROMPTS = [
  "Casamento: músicas para cerimônia, jantar leve e uma pista animada com clássicos brasileiros e internacionais.",
  "Festa de 15 anos com pop atual, funk leve e hits dos anos 2000 para várias gerações.",
  "Flashback dançante com disco, dance e eurodance para uma festa de adultos.",
];

function recommendationKey(item: Recommendation) {
  return `${item.kind}:${item.id}`;
}

export function PortalMusicAssistantView() {
  const [prompt, setPrompt] = useState("");
  const [overview, setOverview] = useState("");
  const [sections, setSections] = useState<RecommendationSection[]>([]);
  const [selected, setSelected] = useState<Recommendation[]>([]);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestPrompt = prompt.trim();
    if (requestPrompt.length < 8) {
      setError("Conte um pouco mais sobre o evento, o público ou o clima que você quer criar.");
      return;
    }

    setLoading(true);
    setError(null);
    setPlayingKey(null);

    try {
      const response = await fetch("/api/portal/music-assistant/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ prompt: requestPrompt }),
      });
      const responseText = await response.text();
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("json")) {
        if (response.status === 404) {
          throw new Error("A busca ainda não está disponível nesta versão do site. Confirme se o último deploy foi concluído e tente novamente.");
        }
        if (response.status >= 500) {
          throw new Error(`O servidor retornou uma página de erro (HTTP ${response.status}). Confira os logs do Dokploy.`);
        }
        throw new Error(`O servidor respondeu em um formato inesperado (HTTP ${response.status}). Atualize a página e tente novamente.`);
      }

      let data: RecommendationResponse;
      try {
        data = JSON.parse(responseText) as RecommendationResponse;
      } catch {
        throw new Error("O servidor retornou uma resposta inválida. Tente novamente em instantes.");
      }
      if (!response.ok) throw new Error(data.error || "Não foi possível buscar sugestões agora.");
      setOverview(data.overview);
      setSections(data.sections ?? []);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Não foi possível buscar sugestões agora.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelection(item: Recommendation) {
    const key = recommendationKey(item);
    setSelected((current) =>
      current.some((selectedItem) => recommendationKey(selectedItem) === key)
        ? current.filter((selectedItem) => recommendationKey(selectedItem) !== key)
        : [...current, item],
    );
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Assistente Musical"
        subtitle="Conte o que você está preparando. A IA organiza a busca e encontra vídeos e playlists reais para inspirar seu set."
      />

      <section className="overflow-hidden rounded-2xl border border-[#1db954]/20 bg-[radial-gradient(ellipse_at_top_left,rgba(29,185,84,0.14),transparent_50%),linear-gradient(120deg,#111714,#111315_62%)] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.25)] sm:p-7">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#1db954]/25 bg-[#1db954]/10 text-[#75e39c] sm:h-12 sm:w-12">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#75e39c]">Curadoria para sua pista</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">O que você está preparando?</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
              Diga o tipo de evento, o público, os estilos, a época ou o idioma que procura. Quanto mais contexto,
              mais alinhadas ficam as buscas.
            </p>
          </div>
        </div>

        <form onSubmit={(event) => void handleSearch(event)} className="mt-5">
          <label htmlFor="portal-music-assistant-prompt" className="sr-only">Descreva sua ideia musical</label>
          <textarea
            id="portal-music-assistant-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value.slice(0, 600))}
            maxLength={600}
            rows={4}
            placeholder="Ex.: casamento ao ar livre, cerimônia emocionante, jantar com MPB suave e pista crescente com pop e clássicos dos anos 2000..."
            className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-[#0b0d0c]/90 px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-zinc-600 focus:border-[#1db954]/45 focus:ring-2 focus:ring-[#1db954]/10"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
            <span>Use estilos, referências e idioma específicos se já tiver uma direção.</span>
            <span>{prompt.length}/600</span>
          </div>
          <button
            type="submit"
            disabled={loading || prompt.trim().length < 8}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1db954] px-5 py-3 text-sm font-black text-[#071009] transition hover:bg-[#56e786] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9cf2b8] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Montando sua curadoria…" : "Buscar sugestões"}
          </button>
        </form>

        <div className="mt-5 border-t border-white/[0.07] pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">Experimente um exemplo</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="min-w-[230px] max-w-[280px] shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-left text-xs leading-relaxed text-zinc-400 transition hover:border-[#1db954]/30 hover:bg-[#1db954]/[0.06] hover:text-white"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {overview ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#1db954]/15 bg-[#1db954]/[0.045] px-4 py-3.5 text-sm leading-relaxed text-zinc-200">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#75e39c]" />
          <p>{overview}</p>
        </div>
      ) : null}

      {loading && sections.length === 0 ? (
        <PortalCard>
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#1db954]" />
            <span>A IA está organizando os momentos e pesquisando no YouTube…</span>
          </div>
        </PortalCard>
      ) : null}

      {sections.length > 0 ? (
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-5">
            {sections.map((section, sectionIndex) => (
              <PortalCard
                key={`${section.title}-${sectionIndex}`}
                title={section.title}
                action={
                  <span className="hidden rounded-md border border-white/[0.08] bg-black/20 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500 sm:inline-flex">
                    Sugestões do YouTube
                  </span>
                }
              >
                <p className="mb-4 text-xs leading-relaxed text-zinc-400">{section.reason}</p>
                <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                  <span className="font-bold uppercase tracking-wider">Busca</span>
                  <span className="rounded-md border border-white/[0.08] bg-black/20 px-2 py-1 text-zinc-400">{section.query}</span>
                </div>

                {section.results.length ? (
                  <div className="space-y-3">
                    {section.results.map((item) => {
                      const key = recommendationKey(item);
                      const isSelected = selected.some((selectedItem) => recommendationKey(selectedItem) === key);
                      const isPlaying = playingKey === key;
                      return (
                        <article key={key} className="grid min-w-0 gap-4 rounded-xl border border-white/[0.07] bg-[#111311] p-3 transition-colors hover:border-[#1db954]/20 sm:p-4 md:grid-cols-[190px_minmax(0,1fr)]">
                          <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                            {isPlaying ? (
                              <iframe
                                src={item.embedUrl}
                                title={`Player do YouTube: ${item.title}`}
                                className="absolute inset-0 h-full w-full border-0"
                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                              />
                            ) : item.thumbnailUrl ? (
                              <Image
                                src={item.thumbnailUrl}
                                alt={item.title}
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 100vw, 190px"
                                className="object-contain"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                                <Video className="h-9 w-9" />
                              </div>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-col">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded border border-red-400/15 bg-red-400/[0.06] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-red-200">
                                <Video className="h-3 w-3" /> YouTube
                              </span>
                              <span className="rounded border border-white/[0.08] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                                {item.kind === "playlist" ? "Playlist" : "Faixa / vídeo"}
                              </span>
                            </div>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 break-words text-sm font-bold leading-snug text-white underline-offset-4 hover:text-[#9cecb3] hover:underline"
                            >
                              {item.title}
                            </a>
                            <p className="mt-1 text-xs text-zinc-500">{item.channelTitle}</p>

                            <div className="mt-auto flex flex-wrap gap-2 pt-4">
                              <button
                                type="button"
                                onClick={() => setPlayingKey(isPlaying ? null : key)}
                                aria-pressed={isPlaying}
                                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold text-white transition hover:border-[#1db954]/35 hover:bg-[#1db954]/[0.08]"
                              >
                                <CirclePlay className="h-4 w-4 text-[#75e39c]" />
                                {isPlaying ? "Fechar player" : "Tocar aqui"}
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleSelection(item)}
                                aria-pressed={isSelected}
                                className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold transition ${isSelected ? "border-[#1db954]/30 bg-[#1db954]/10 text-[#8ce5a8]" : "border-white/10 bg-transparent text-zinc-300 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"}`}
                              >
                                {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                {isSelected ? "Na seleção" : "Adicionar à seleção"}
                              </button>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold text-zinc-500 transition hover:text-white"
                              >
                                Abrir no YouTube <ArrowUpRight className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-white/10 px-4 py-7 text-center text-xs text-zinc-500">
                    Nenhum resultado para este momento. Tente uma descrição mais específica.
                  </p>
                )}
              </PortalCard>
            ))}
          </div>

          <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
            <PortalCard
              title="Minha seleção"
              action={selected.length ? <span className="text-xs font-bold text-[#75e39c]">{selected.length}</span> : undefined}
            >
              {selected.length ? (
                <div className="space-y-2">
                  {selected.map((item) => (
                    <div key={recommendationKey(item)} className="flex min-w-0 items-start gap-2 rounded-lg border border-white/[0.07] bg-black/20 p-2.5">
                      <ListMusic className="mt-0.5 h-4 w-4 shrink-0 text-[#75e39c]" />
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 break-words text-xs font-medium leading-relaxed text-zinc-200 hover:text-white">
                        {item.title}
                        <span className="mt-0.5 block text-[10px] text-zinc-500">{item.channelTitle}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => toggleSelection(item)}
                        aria-label={`Remover ${item.title} da seleção`}
                        className="rounded p-1 text-zinc-600 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <p className="pt-2 text-[10px] leading-relaxed text-zinc-600">Seleção temporária desta sessão. Abra cada item no YouTube para conferir a faixa completa.</p>
                </div>
              ) : (
                <div className="py-3 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-zinc-500">
                    <ListMusic className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-zinc-300">Monte sua seleção</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">Adicione faixas e playlists encontradas para organizar suas referências.</p>
                </div>
              )}
            </PortalCard>
          </aside>
        </div>
      ) : null}

      <p className="text-[10px] leading-relaxed text-zinc-600">
        Os resultados e players são fornecidos pelo YouTube. A BRS organiza sugestões a partir do seu pedido; confira as faixas antes do evento. Ao usar os players, aplicam-se os{" "}
        <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-zinc-400 underline underline-offset-2 hover:text-white">
          Termos de Serviço do YouTube
        </a>.
      </p>
    </div>
  );
}
