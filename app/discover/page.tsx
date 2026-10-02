import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, Bell, ChevronDown, Crown, LogIn, Search, UserRound } from "lucide-react";
import { BrsLogo } from "../components/BrsLogo";
import { listPublishedProductionGenres, listPublishedProductionsPage } from "../lib/brs-productions";
import { DiscoverCatalog } from "./DiscoverCatalog";

export const dynamic = "force-dynamic";

const DISCOVER_BANNER =
  "https://pub-169b30d0b1454cd1abcbcc7f2a4d3a5f.r2.dev/capas/858aefb5-0c6d-4dc0-9569-e2c4124ffeb9.png";

export const metadata: Metadata = {
  title: "Descobrir | Brazilian Remix Service",
  description: "Descubra, ouça e baixe as produções publicadas do Brazilian Remix Service.",
};

type SearchParams = Promise<{
  page?: string;
  q?: string;
  genre?: string;
  sort?: string;
  club?: string;
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
  club,
}: {
  page?: number;
  query?: string;
  genre?: string;
  sort?: string;
  club?: boolean;
}) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (genre) params.set("genre", genre);
  if (sort && sort !== "recent") params.set("sort", sort);
  if (club) params.set("club", "1");
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
  const clubOnly = params.club === "1" || params.club === "true";

  const [firstResult, genres] = await Promise.all([
    listPublishedProductionsPage(requestedPage, 50, { query, genre, sort }),
    listPublishedProductionGenres(),
  ]);

  const catalog =
    firstResult.totalPages > 0 && firstResult.page > firstResult.totalPages
      ? await listPublishedProductionsPage(firstResult.totalPages, 50, { query, genre, sort })
      : firstResult;

  const items = clubOnly
    ? catalog.items.filter((item) => item.isFeatured || item.isNew)
    : catalog.items;

  const previousHref =
    catalog.page > 1
      ? discoverHref({ page: catalog.page - 1, query, genre, sort, club: clubOnly })
      : null;
  const nextHref =
    catalog.page < catalog.totalPages
      ? discoverHref({ page: catalog.page + 1, query, genre, sort, club: clubOnly })
      : null;

  const clubHref = discoverHref({
    page: 1,
    query,
    genre,
    sort,
    club: !clubOnly,
  });

  return (
    <main className="discover-theme min-h-screen bg-[#0b0b0b] text-white">
      <header className="sticky top-0 z-50 h-[64px] border-b border-white/[0.08] bg-[#101010]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1120px] items-center gap-4 px-4 sm:px-6">
          <BrsLogo href="/" className="h-8 w-auto max-w-[145px] shrink-0" sizes="145px" priority />
          <div className="relative hidden min-w-0 flex-1 items-center sm:flex">
            <Search className="absolute left-3.5 h-4 w-4 text-[#8f8f8f]" />
            <div className="w-full max-w-[560px] rounded-xl border border-white/[0.1] bg-[#171717] py-2.5 pl-10 pr-4 text-sm text-[#9a9a9a]">
              Buscar músicas ou produtores
            </div>
          </div>
          <Link
            href="/musicas"
            className="hidden items-center gap-2 rounded-xl border border-white/[0.1] bg-[#1a1a1a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#242424] md:flex"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Downloader
          </Link>
          <Bell className="hidden h-4 w-4 text-[#8f8f8f] sm:block" />
          <Link
            href="/musicas/entrar?return=%2Fdiscover"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#1a1a1a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#242424]"
          >
            <UserRound className="h-4 w-4" />
            <span className="hidden sm:inline">Entrar</span>
            <LogIn className="h-4 w-4 sm:hidden" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1120px] px-4 pb-16 pt-5 sm:px-6 sm:pt-6">
        <div className="relative mb-7 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414]">
          <Image
            src={DISCOVER_BANNER}
            alt="Banner Descobrir BRS"
            width={1600}
            height={420}
            priority
            unoptimized
            className="h-auto w-full object-cover object-center"
          />
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b6f03a]">Catálogo</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em] text-white sm:text-[42px]">Descobrir</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#9a9a9a]">
            Explore as músicas mais relevantes da semana ou filtre por gênero e Exclusivas CLUB.
          </p>
        </div>

        <form method="get" action="/discover" className="mb-6 flex flex-col gap-2 lg:flex-row">
          {clubOnly ? <input type="hidden" name="club" value="1" /> : null}
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-xl border border-[#b6f03a]/55 bg-[#121212] px-3.5 ring-1 ring-[#b6f03a]/15">
            <Search className="mr-2.5 h-4 w-4 shrink-0 text-[#8f8f8f]" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar por título (mín. 2 caracteres)"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6f6f6f]"
              aria-label="Buscar por título"
            />
          </div>

          <label className="relative">
            <span className="sr-only">Ordenação</span>
            <select
              name="sort"
              defaultValue={sort === "recent" ? "recent" : sort}
              className="h-12 w-full appearance-none rounded-xl border border-white/[0.1] bg-[#171717] px-4 pr-10 text-sm font-medium text-white outline-none lg:w-[180px]"
            >
              <option value="recent">Mais relevantes</option>
              <option value="oldest">Mais antigas</option>
              <option value="az">Título A–Z</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8f8f8f]" />
          </label>

          <label className="relative">
            <span className="sr-only">Gênero</span>
            <select
              name="genre"
              defaultValue={genre}
              className="h-12 w-full appearance-none rounded-xl border border-white/[0.1] bg-[#171717] px-4 pr-10 text-sm font-medium text-white outline-none lg:w-[190px]"
            >
              <option value="">Todos os gêneros</option>
              {genres.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8f8f8f]" />
          </label>

          <Link
            href={clubHref}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${
              clubOnly
                ? "border-orange-400/50 bg-orange-400/15 text-orange-200"
                : "border-white/[0.1] bg-[#171717] text-white hover:bg-[#222]"
            }`}
          >
            <Crown className="h-4 w-4" />
            Exclusivas CLUB
          </Link>

          <button
            type="submit"
            className="h-12 rounded-xl bg-[#b6f03a] px-5 text-sm font-extrabold text-black transition hover:bg-[#c6ff4d]"
          >
            Buscar
          </button>
        </form>

        {items.length > 0 ? (
          <DiscoverCatalog productions={items} />
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-[#141414] px-6 py-20 text-center text-sm text-[#8f8f8f]">
            {query || genre || clubOnly
              ? "Nenhuma produção encontrada com esses filtros."
              : "Nenhuma produção publicada."}
          </div>
        )}

        {catalog.totalPages > 1 ? (
          <nav aria-label="Paginação" className="mt-6 flex items-center justify-center gap-2">
            {previousHref ? (
              <Link
                href={previousHref}
                className="rounded-xl border border-white/[0.1] bg-[#171717] px-4 py-2 text-xs font-bold text-white hover:bg-[#222]"
              >
                Anterior
              </Link>
            ) : (
              <span className="rounded-xl border border-white/5 px-4 py-2 text-xs font-bold text-white/25">
                Anterior
              </span>
            )}
            <span className="rounded-xl border border-[#b6f03a]/30 bg-[#b6f03a]/10 px-4 py-2 text-xs font-bold text-[#b6f03a]">
              {catalog.page} / {catalog.totalPages}
            </span>
            {nextHref ? (
              <Link
                href={nextHref}
                className="rounded-xl bg-[#b6f03a] px-4 py-2 text-xs font-extrabold text-black hover:bg-[#c6ff4d]"
              >
                Próxima
              </Link>
            ) : (
              <span className="rounded-xl border border-white/5 px-4 py-2 text-xs font-bold text-white/25">
                Próxima
              </span>
            )}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
