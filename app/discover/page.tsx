import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, Bell, ChevronDown, LogIn, Search, UserRound } from "lucide-react";
import { BrsLogo } from "../components/BrsLogo";
import { ProductionRail } from "../components/HomeProductions";
import { listPublishedProductionGenres, listPublishedProductionsPage } from "../lib/brs-productions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Descobrir | Brazilian Remix Service",
  description: "Descubra, ouça e baixe todas as produções publicadas do Brazilian Remix Service.",
};

type SearchParams = Promise<{
  page?: string;
  q?: string;
  genre?: string;
  sort?: string;
}>;

function normalizePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeSort(value: string | undefined): "recent" | "oldest" | "az" {
  return value === "oldest" || value === "az" ? value : "recent";
}

function discoverHref({
  page,
  query,
  genre,
  sort,
}: {
  page?: number;
  query?: string;
  genre?: string;
  sort?: string;
}) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (genre) params.set("genre", genre);
  if (sort && sort !== "recent") params.set("sort", sort);
  if (page && page > 1) params.set("page", String(page));
  const queryString = params.toString();
  return queryString ? `/discover?${queryString}` : "/discover";
}

export default async function DiscoveryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedPage = normalizePage(params.page);
  const query = params.q?.trim() ?? "";
  const genre = params.genre?.trim() ?? "";
  const sort = normalizeSort(params.sort);

  const [firstResult, genres] = await Promise.all([
    listPublishedProductionsPage(requestedPage, 50, { query, genre, sort }),
    listPublishedProductionGenres(),
  ]);

  const catalog =
    firstResult.totalPages > 0 && firstResult.page > firstResult.totalPages
      ? await listPublishedProductionsPage(firstResult.totalPages, 50, { query, genre, sort })
      : firstResult;

  const previousHref =
    catalog.page > 1
      ? discoverHref({ page: catalog.page - 1, query, genre, sort })
      : null;
  const nextHref =
    catalog.page < catalog.totalPages
      ? discoverHref({ page: catalog.page + 1, query, genre, sort })
      : null;

  const start = catalog.total === 0 ? 0 : (catalog.page - 1) * catalog.pageSize + 1;
  const end = Math.min(catalog.page * catalog.pageSize, catalog.total);

  return (
    <main className="discover-theme min-h-screen bg-[#202020] text-white">
      <header className="fixed inset-x-0 top-0 z-50 h-[64px] border-b border-white/[0.08] bg-[#1c1c1c]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1280px] items-center gap-4 px-4 sm:px-6">
          <BrsLogo href="/" className="h-8 w-auto max-w-[145px] shrink-0" sizes="145px" priority />

          <div className="relative hidden min-w-0 flex-1 items-center sm:flex">
            <Search className="absolute left-3.5 h-4 w-4 text-[#9b9b9b]" />
            <div className="w-full max-w-[640px] rounded-[6px] border border-white/[0.08] bg-[#2f2f2f] py-2.5 pl-10 pr-12 text-sm text-[#cfcfcf]">
              Buscar músicas ou produtores
            </div>
            <kbd className="absolute right-3 hidden rounded-[4px] border border-white/10 px-1.5 py-0.5 text-[9px] text-[#9b9b9b] lg:block">
              /
            </kbd>
          </div>

          <Link
            href="/musicas"
            className="hidden items-center gap-2 rounded-[6px] border border-white/[0.08] bg-[#2f2f2f] px-3 py-2 text-sm font-medium text-white hover:bg-[#3a3a3a] md:flex"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Downloader
          </Link>
          <Bell className="hidden h-4 w-4 text-[#9b9b9b] sm:block" />
          <Link
            href="/musicas/entrar?return=%2Fdiscover"
            className="inline-flex items-center gap-2 rounded-[6px] border border-white/[0.08] bg-[#2f2f2f] px-3 py-2 text-sm font-medium text-white hover:bg-[#3a3a3a]"
          >
            <UserRound className="h-4 w-4" />
            <span className="hidden sm:inline">Entrar</span>
            <LogIn className="h-4 w-4 sm:hidden" />
          </Link>
        </div>
      </header>

      <section className="min-h-screen pt-[64px]">
        <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-7 sm:py-10 lg:px-6">
          <div className="mb-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#60cdff]">Catálogo</p>
            <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.02em] text-white sm:text-[40px]">Descobrir</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#cfcfcf]">
              Explore as produções BRS e baixe as faixas disponíveis para você.
            </p>
          </div>

          <form method="get" action="/discover" className="mb-7 flex flex-col gap-2 sm:flex-row">
            <div className="flex h-11 min-w-0 flex-1 items-center rounded-[6px] border border-white/[0.08] bg-[#2f2f2f] px-3">
              <Search className="mr-2.5 h-4 w-4 shrink-0 text-[#9b9b9b]" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Buscar por título"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#9b9b9b]"
                aria-label="Buscar por título"
              />
            </div>

            <label className="relative">
              <span className="sr-only">Ordenação</span>
              <select
                name="sort"
                defaultValue={sort}
                className="h-11 w-full appearance-none rounded-[6px] border border-white/[0.08] bg-[#2f2f2f] px-4 pr-10 text-sm font-medium text-white outline-none sm:w-[175px]"
              >
                <option value="recent">Mais recentes</option>
                <option value="oldest">Mais antigas</option>
                <option value="az">Título A–Z</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9b9b9b]" />
            </label>

            <label className="relative">
              <span className="sr-only">Gênero</span>
              <select
                name="genre"
                defaultValue={genre}
                className="h-11 w-full appearance-none rounded-[6px] border border-white/[0.08] bg-[#2f2f2f] px-4 pr-10 text-sm font-medium text-white outline-none sm:w-[190px]"
              >
                <option value="">Todos os gêneros</option>
                {genres.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9b9b9b]" />
            </label>

            <button
              type="submit"
              className="h-11 rounded-[6px] border border-white/[0.1] bg-[#2f2f2f] px-5 text-sm font-semibold text-white transition hover:bg-[#3a3a3a]"
            >
              Buscar
            </button>
          </form>

          {(query || genre || sort !== "recent") && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#cfcfcf]">
              <span>Filtros:</span>
              {query && (
                <span className="rounded-[4px] border border-white/10 bg-white/[0.05] px-3 py-1 text-white">
                  “{query}”
                </span>
              )}
              {genre && (
                <span className="rounded-[4px] border border-white/10 bg-white/[0.05] px-3 py-1 text-white">
                  {genre}
                </span>
              )}
              {sort !== "recent" && (
                <span className="rounded-[4px] border border-white/10 bg-white/[0.05] px-3 py-1 text-white">
                  {sort === "oldest" ? "Mais antigas" : "Título A–Z"}
                </span>
              )}
              <Link href="/discover" className="ml-1 text-[#60cdff] underline underline-offset-2 hover:text-[#8ad4ff]">
                Limpar
              </Link>
            </div>
          )}

          <div className="overflow-hidden rounded-[8px] border border-white/[0.08] bg-[#2b2b2b]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-semibold text-white">Produções BRS</p>
                <p className="mt-0.5 text-[10px] text-[#9b9b9b]">
                  {start}–{end} de {catalog.total} produções · até 50 por página
                </p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9b9b9b]">Baixar</span>
            </div>

            {catalog.items.length > 0 ? (
              <ProductionRail productions={catalog.items} layout="list" />
            ) : (
              <div className="px-6 py-20 text-center text-sm text-[#9b9b9b]">
                {query || genre ? "Nenhuma produção encontrada com esses filtros." : "Nenhuma produção publicada."}
              </div>
            )}
          </div>

          {catalog.totalPages > 1 ? (
            <nav aria-label="Paginação" className="mt-6 flex items-center justify-center gap-2">
              {previousHref ? (
                <Link
                  href={previousHref}
                  className="rounded-[6px] border border-white/[0.08] bg-[#2f2f2f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3a3a3a]"
                >
                  Anterior
                </Link>
              ) : (
                <span className="rounded-[6px] border border-white/5 px-4 py-2 text-xs font-semibold text-white/25">
                  Anterior
                </span>
              )}
              <span className="rounded-[6px] border border-white/[0.08] bg-[#252525] px-4 py-2 text-xs font-semibold text-white">
                {catalog.page} / {catalog.totalPages}
              </span>
              {nextHref ? (
                <Link
                  href={nextHref}
                  className="rounded-[6px] border border-white/[0.08] bg-[#2f2f2f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3a3a3a]"
                >
                  Próxima
                </Link>
              ) : (
                <span className="rounded-[6px] border border-white/5 px-4 py-2 text-xs font-semibold text-white/25">
                  Próxima
                </span>
              )}
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  );
}
