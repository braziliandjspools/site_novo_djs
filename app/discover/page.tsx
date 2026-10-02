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
    <main className="min-h-screen bg-[#070909] text-white">
      <header className="fixed inset-x-0 top-0 z-50 h-[68px] border-b border-white/[0.08] bg-[#080a0a]/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1280px] items-center gap-5 px-4 sm:px-6">
          <BrsLogo href="/" className="h-9 w-auto max-w-[145px] shrink-0" sizes="145px" priority />

          <div className="relative hidden min-w-0 flex-1 items-center sm:flex">
            <Search className="absolute left-4 h-4 w-4 text-white/45" />
            <div className="w-full max-w-[680px] rounded-full border border-white/[0.12] bg-[#101313] py-2.5 pl-11 pr-12 text-sm text-white/70">
              Buscar músicas ou produtores
            </div>
            <kbd className="absolute right-4 hidden rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-white/40 lg:block">/</kbd>
          </div>

          <Link href="/musicas" className="hidden items-center gap-2 text-sm font-semibold text-white/70 hover:text-white md:flex">
            <ArrowDownToLine className="h-4 w-4" />
            Downloader
          </Link>
          <Bell className="hidden h-4 w-4 text-white/50 sm:block" />
          <Link href="/musicas/entrar?return=%2Fdiscover" className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-[#1ed760]">
            <UserRound className="h-4 w-4" />
            <span className="hidden sm:inline">Entrar</span>
            <LogIn className="h-4 w-4 sm:hidden" />
          </Link>
        </div>
      </header>

      <section className="min-h-screen pt-[68px]">
        <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-7 sm:py-10 lg:px-6">
          <div className="mb-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-400">Catálogo</p>
            <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] text-white sm:text-[42px]">Descobrir</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">
              Explore as produções BRS e baixe as faixas disponíveis para você.
            </p>
          </div>

          <form method="get" action="/discover" className="mb-7 flex flex-col gap-2 sm:flex-row">
            <div className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-white/[0.14] bg-[#0d110e] px-3 ring-1 ring-white/[0.04]">
              <Search className="mr-2.5 h-4 w-4 shrink-0 text-white/50" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Buscar por título"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
                aria-label="Buscar por título"
              />
            </div>

            <label className="relative">
              <span className="sr-only">Ordenação</span>
              <select
                name="sort"
                defaultValue={sort}
                className="h-11 w-full appearance-none rounded-xl border border-white/[0.10] bg-[#0e1111] px-4 pr-10 text-sm font-medium text-white outline-none sm:w-[175px]"
              >
                <option value="recent">Mais recentes</option>
                <option value="oldest">Mais antigas</option>
                <option value="az">Título A–Z</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/55" />
            </label>

            <label className="relative">
              <span className="sr-only">Gênero</span>
              <select
                name="genre"
                defaultValue={genre}
                className="h-11 w-full appearance-none rounded-xl border border-white/[0.10] bg-[#0e1111] px-4 pr-10 text-sm font-medium text-white outline-none sm:w-[190px]"
              >
                <option value="">Todos os gêneros</option>
                {genres.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/55" />
            </label>

            <button
              type="submit"
              className="h-11 rounded-xl bg-[#1db954] px-5 text-sm font-extrabold text-[#06150b] transition hover:bg-[#1ed760]"
            >
              Buscar
            </button>
          </form>

          {(query || genre || sort !== "recent") && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white/65">
              <span>Filtros:</span>
              {query && <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-orange-300">“{query}”</span>}
              {genre && <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-orange-300">{genre}</span>}
              {sort !== "recent" && (
                <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-orange-300">
                  {sort === "oldest" ? "Mais antigas" : "Título A–Z"}
                </span>
              )}
              <Link href="/discover" className="ml-1 text-white underline underline-offset-2 hover:text-orange-300">
                Limpar
              </Link>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-white/[0.10] bg-[#0d0f0f]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-semibold text-white">Produções BRS</p>
                <p className="mt-0.5 text-[10px] text-white/50">
                  {start}–{end} de {catalog.total} produções · até 50 por página
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Baixar</span>
            </div>

            {catalog.items.length > 0 ? (
              <ProductionRail productions={catalog.items} layout="list" />
            ) : (
              <div className="px-6 py-20 text-center text-sm text-white/55">
                {query || genre ? "Nenhuma produção encontrada com esses filtros." : "Nenhuma produção publicada."}
              </div>
            )}
          </div>

          {catalog.totalPages > 1 ? (
            <nav aria-label="Paginação" className="mt-6 flex items-center justify-center gap-2">
              {previousHref ? (
                <Link href={previousHref} className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/75 hover:bg-white/[0.05]">
                  Anterior
                </Link>
              ) : (
                <span className="rounded-full border border-white/5 px-4 py-2 text-xs font-bold text-white/25">Anterior</span>
              )}
              <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-xs font-bold text-orange-300">
                {catalog.page} / {catalog.totalPages}
              </span>
              {nextHref ? (
                <Link href={nextHref} className="rounded-full bg-[#1db954] px-4 py-2 text-xs font-extrabold text-[#06150b] hover:bg-[#1ed760]">
                  Próxima
                </Link>
              ) : (
                <span className="rounded-full border border-white/5 px-4 py-2 text-xs font-bold text-white/25">Próxima</span>
              )}
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  );
}
