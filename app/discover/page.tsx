import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, ChevronLeft, ChevronRight, Compass, Headphones, Music2 } from "lucide-react";
import { ProductionRail } from "../components/HomeProductions";
import { listPublishedProductionsPage } from "../lib/brs-productions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Descobrir | Brazilian Remix Service",
  description:
    "Descubra, ouça e baixe todas as produções publicadas do Brazilian Remix Service. Remixes, edits, versões extended, mashups e bootlegs.",
};

type SearchParams = Promise<{ page?: string }>;

function normalizePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function DiscoveryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedPage = normalizePage(params.page);
  const firstResult = await listPublishedProductionsPage(requestedPage, 50);

  // Se alguém abrir uma página que não existe, leva para a última página válida.
  const catalog =
    firstResult.totalPages > 0 && firstResult.page > firstResult.totalPages
      ? await listPublishedProductionsPage(firstResult.totalPages, 50)
      : firstResult;

  const previousHref = catalog.page > 1
    ? catalog.page === 2
      ? "/discover"
      : `/discover?page=${catalog.page - 1}`
    : null;
  const nextHref = catalog.page < catalog.totalPages ? `/discover?page=${catalog.page + 1}` : null;
  const start = catalog.total === 0 ? 0 : (catalog.page - 1) * catalog.pageSize + 1;
  const end = Math.min(catalog.page * catalog.pageSize, catalog.total);

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_12%_0%,rgba(29,185,84,0.15),transparent_34%),radial-gradient(ellipse_at_90%_8%,rgba(0,39,118,0.2),transparent_30%),linear-gradient(180deg,#070908_0%,#050706_100%)] text-white">
      <section className="relative overflow-hidden border-b border-white/[0.07] px-4 pb-9 pt-10 sm:px-6 md:pb-12 md:pt-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(29,185,84,0.08),transparent_28%)]" />
        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35 transition hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Home
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#1db954]/25 bg-[#1db954]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#8ef0b0]">
                <Compass className="h-3.5 w-3.5" />
                Descobrir
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
                Descubra as produções BRS
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Explore as produções publicadas no Brazilian Remix Service, ouça as faixas
                e baixe o que você quiser. Aqui não é uma loja: é um catálogo de conteúdo
                para DJs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                <div className="flex items-center gap-2 text-white/35">
                  <Music2 className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em]">Catálogo</span>
                </div>
                <p className="mt-1 text-lg font-black text-white">{catalog.total}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                <div className="flex items-center gap-2 text-white/35">
                  <Headphones className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em]">Página</span>
                </div>
                <p className="mt-1 text-lg font-black text-white">
                  {catalog.page}/{catalog.totalPages}
                </p>
              </div>
            </div>
          </div>

          {catalog.total > 0 ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1db954]/25 bg-[#1db954]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8ef0b0]">
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Download direto
              </span>
              <span className="text-xs text-white/35">
                {start}–{end} de {catalog.total} produções
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 md:py-10">
        <div className="mx-auto max-w-6xl">
          {catalog.items.length > 0 ? (
            <ProductionRail
              productions={catalog.items}
              layout="grid"
              headerTitle="Todas as produções"
            />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
              <Music2 className="mx-auto h-9 w-9 text-white/15" />
              <h2 className="mt-4 text-lg font-bold text-white">Nenhuma produção publicada</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                As produções aparecerão aqui assim que forem publicadas no catálogo BRS.
              </p>
            </div>
          )}

          {catalog.totalPages > 1 ? (
            <nav aria-label="Paginação das produções" className="mt-9 flex items-center justify-center gap-2">
              {previousHref ? (
                <Link
                  href={previousHref}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-xs font-bold text-zinc-300 transition hover:border-[#1db954]/40 hover:bg-white/[0.06] hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Link>
              ) : (
                <span className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-full border border-white/5 px-4 text-xs font-bold text-zinc-700">
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </span>
              )}

              <span className="inline-flex h-10 items-center gap-2 rounded-full border border-[#1db954]/25 bg-[#1db954]/10 px-4 text-xs font-black text-[#8ef0b0]">
                {catalog.page} / {catalog.totalPages}
              </span>

              {nextHref ? (
                <Link
                  href={nextHref}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1db954] px-4 text-xs font-extrabold text-[#06150b] transition hover:bg-[#1ed760]"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-full border border-white/5 px-4 text-xs font-bold text-zinc-700">
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  );
}
