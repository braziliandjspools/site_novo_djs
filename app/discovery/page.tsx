import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Compass, Music2 } from "lucide-react";
import { ProductionRail } from "../components/HomeProductions";
import { listPublishedProductionsPage } from "../lib/brs-productions";

export const metadata: Metadata = {
  title: "Descobrir | Brazilian Remix Service",
  description: "Descubra todas as produções publicadas do Brazilian Remix Service em um catálogo organizado.",
};

type SearchParams = Promise<{ page?: string }>;

export default async function DiscoveryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const catalog = await listPublishedProductionsPage(page, 50);

  const previousHref = catalog.page > 1 ? `/discovery?page=${catalog.page - 1}` : null;
  const nextHref = catalog.page < catalog.totalPages ? `/discovery?page=${catalog.page + 1}` : null;

  return (
    <main className="min-h-screen bg-[#070908] text-white">
      <section className="relative overflow-hidden border-b border-white/[0.07] px-4 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(29,185,84,0.18),transparent_35%),radial-gradient(ellipse_at_90%_15%,rgba(0,39,118,0.2),transparent_32%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#1db954]/25 bg-[#1db954]/10 text-[#1db954]">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1db954]">Brazilian Remix Service</p>
              <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Descobrir</h1>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Explore todas as produções publicadas do BRS. Novas faixas, remixes, edits e versões exclusivas em um só lugar.
            </p>
            <div className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
              <Music2 className="h-4 w-4 text-[#1db954]" />
              {catalog.total} {catalog.total === 1 ? "produção" : "produções"}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          {catalog.items.length > 0 ? (
            <ProductionRail
              productions={catalog.items}
              layout="grid"
              headerTitle={`Todas as produções · Página ${catalog.page}`}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <Music2 className="mx-auto h-8 w-8 text-zinc-600" />
              <h2 className="mt-4 text-lg font-bold text-white">Nenhuma produção publicada</h2>
              <p className="mt-2 text-sm text-zinc-500">As produções aparecerão aqui assim que forem publicadas.</p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-center gap-3">
            {previousHref ? (
              <Link
                href={previousHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-zinc-300 transition hover:border-[#1db954]/40 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/5 px-4 py-2.5 text-xs font-bold text-zinc-700">
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </span>
            )}

            <span className="rounded-full border border-[#1db954]/20 bg-[#1db954]/10 px-4 py-2.5 text-xs font-black text-[#8ef0b0]">
              {catalog.page} / {catalog.totalPages}
            </span>

            {nextHref ? (
              <Link
                href={nextHref}
                className="inline-flex items-center gap-2 rounded-full border border-[#1db954]/35 bg-[#1db954]/10 px-4 py-2.5 text-xs font-bold text-[#8ef0b0] transition hover:bg-[#1db954]/20 hover:text-white"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/5 px-4 py-2.5 text-xs font-bold text-zinc-700">
                Próxima
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
