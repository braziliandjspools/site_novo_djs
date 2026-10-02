import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, Bell, ChevronDown, Home, LogIn, Search, UserRound } from "lucide-react";
import { BrsLogo } from "../components/BrsLogo";
import { ProductionRail } from "../components/HomeProductions";
import { listPublishedProductionsPage } from "../lib/brs-productions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Descobrir | Brazilian Remix Service",
  description: "Descubra, ouça e baixe todas as produções publicadas do Brazilian Remix Service.",
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
  const catalog =
    firstResult.totalPages > 0 && firstResult.page > firstResult.totalPages
      ? await listPublishedProductionsPage(firstResult.totalPages, 50)
      : firstResult;

  const previousHref =
    catalog.page > 1 ? (catalog.page === 2 ? "/discover" : "/discover?page=" + (catalog.page - 1)) : null;
  const nextHref = catalog.page < catalog.totalPages ? "/discover?page=" + (catalog.page + 1) : null;
  const start = catalog.total === 0 ? 0 : (catalog.page - 1) * catalog.pageSize + 1;
  const end = Math.min(catalog.page * catalog.pageSize, catalog.total);

  return (
    <main className="min-h-screen bg-[#070909] text-white">
      <header className="fixed inset-x-0 top-0 z-50 h-[68px] border-b border-white/[0.08] bg-[#080a0a]/95">
        <div className="flex h-full items-center gap-4 px-4 lg:pl-[266px] lg:pr-6">
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search className="absolute left-4 h-4 w-4 text-zinc-500" />
            <div className="w-full max-w-[680px] rounded-full border border-white/[0.12] bg-[#101313] py-2.5 pl-11 pr-12 text-sm text-zinc-400">
              Buscar músicas ou produtores
            </div>
            <kbd className="absolute right-4 hidden rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-zinc-500 sm:block">/</kbd>
          </div>
          <Link href="/musicas" className="hidden items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white md:flex">
            <ArrowDownToLine className="h-4 w-4" />
            Downloader
          </Link>
          <Bell className="hidden h-4 w-4 text-zinc-500 sm:block" />
          <Link href="/musicas/entrar?return=%2Fdiscover" className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-[#1ed760]">
            <UserRound className="h-4 w-4" />
            <span className="hidden sm:inline">Entrar</span>
            <LogIn className="h-4 w-4 sm:hidden" />
          </Link>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[243px] border-r border-white/[0.08] bg-[#090b0b] lg:block">
        <div className="flex h-[68px] items-center border-b border-white/[0.08] px-5">
          <BrsLogo href="/" className="h-9 w-auto max-w-[150px]" sizes="150px" priority />
        </div>
        <nav className="px-2 py-6">
          <p className="px-4 pb-3 text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-600">Explorar</p>
          <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-white/[0.05] hover:text-white">
            <Home className="h-4 w-4" />
            Início
          </Link>
          <Link href="/discover" className="mt-1 flex items-center gap-3 rounded-xl border border-[#1db954]/25 bg-[#1db954]/10 px-4 py-3 text-sm font-semibold text-white">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#1db954] text-[8px] text-[#1db954]">✓</span>
            Descobrir
          </Link>
          <Link href="/producoes" className="mt-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-white/[0.05] hover:text-white">
            <span className="text-base">♔</span>
            BRS Produções
          </Link>
        </nav>
        <div className="absolute bottom-5 left-2 right-2 rounded-2xl border border-[#1db954]/25 bg-[#111a11] p-4">
          <p className="text-sm font-bold text-white">Comece a produzir</p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">Publique suas produções e alcance os DJs do BRS.</p>
          <Link href="/produtores" className="mt-3 inline-flex text-xs font-bold text-[#1ed760] hover:underline">Saiba mais</Link>
        </div>
      </aside>

      <section className="min-h-screen pt-[68px] lg:pl-[243px]">
        <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-7 sm:py-10 lg:px-6">
          <div className="mb-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fe9a8]">Catálogo</p>
            <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] text-white sm:text-[42px]">Descobrir</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Explore as produções BRS e baixe as faixas disponíveis para você.
            </p>
          </div>

          <div className="mb-7 flex flex-wrap items-center gap-2">
            <div className="flex h-11 min-w-[260px] flex-1 items-center rounded-xl border border-[#1db954]/45 bg-[#0d110e] px-3 ring-1 ring-[#1db954]/10 sm:max-w-[390px]">
              <Search className="mr-2.5 h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-500">Buscar por título</span>
            </div>
            <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0e1111] px-4 text-xs font-medium text-zinc-400">
              Mais recentes <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0e1111] px-4 text-xs font-medium text-zinc-400">
              Todos os gêneros <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.10] bg-[#0d0f0f]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-semibold text-white">Produções BRS</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">{start}–{end} de {catalog.total} produções · até 50 por página</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">Baixar</span>
            </div>

            {catalog.items.length > 0 ? (
              <ProductionRail productions={catalog.items} layout="list" />
            ) : (
              <div className="px-6 py-20 text-center text-sm text-zinc-500">Nenhuma produção publicada.</div>
            )}
          </div>

          {catalog.totalPages > 1 ? (
            <nav aria-label="Paginação" className="mt-6 flex items-center justify-center gap-2">
              {previousHref ? (
                <Link href={previousHref} className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.05]">Anterior</Link>
              ) : (
                <span className="rounded-full border border-white/5 px-4 py-2 text-xs font-bold text-zinc-700">Anterior</span>
              )}
              <span className="rounded-full border border-[#1db954]/30 bg-[#1db954]/10 px-4 py-2 text-xs font-bold text-[#8fe9a8]">{catalog.page} / {catalog.totalPages}</span>
              {nextHref ? (
                <Link href={nextHref} className="rounded-full bg-[#1db954] px-4 py-2 text-xs font-extrabold text-[#06150b] hover:bg-[#1ed760]">Próxima</Link>
              ) : (
                <span className="rounded-full border border-white/5 px-4 py-2 text-xs font-bold text-zinc-700">Próxima</span>
              )}
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  );
}
