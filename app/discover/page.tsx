import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Crown, Search } from "lucide-react";
import { listPublishedProductionGenres, listPublishedProductionsPage } from "../lib/brs-productions";
import { getDownloaderReleaseManifest } from "../lib/downloader-updates";
import { DiscoverCatalog } from "./DiscoverCatalog";
import { DiscoverHeader } from "./DiscoverHeader";

export const dynamic = "force-dynamic";

const DISCOVER_BANNER =
  "https://pub-169b30d0b1454cd1abcbcc7f2a4d3a5f.r2.dev/capas/858aefb5-0c6d-4dc0-9569-e2c4124ffeb9.png";

export const metadata: Metadata = {
  title: "Descobrir | Brazilian Remix Service",
  description:
    "Descubra, ouça e encontre remixes, edits, versões exclusivas e produções do Brazilian Remix Service para o seu set.",
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

  const release = getDownloaderReleaseManifest();
  const downloadUrl =
    release?.downloadUrl ??
    "https://www.brazilianremixservice.com.br/downloads/BRS-Downloader_1.0.27_x64-setup.exe";

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
      <DiscoverHeader initialQuery={query} downloadUrl={downloadUrl} />

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
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#60cdff]">Catálogo</p>
          <h1 className="mt-2 hidden text-[34px] font-semibold tracking-[-0.04em] text-white sm:block sm:text-[42px]">
            DESCUBRA NOVOS SONS PARA O SEU SET
          </h1>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:hidden">
            DESCUBRA. OUÇA. ENCONTRE. TOQUE.
          </h1>
          <div className="mt-3 hidden max-w-3xl space-y-3 text-sm leading-relaxed text-[#9a9a9a] sm:block">
            <p>
              Explore o catálogo do Brazilian Remix Service e encontre remixes, edits, versões exclusivas e
              produções criadas para DJs e produtores. Pesquise por título, navegue pelos gêneros e descubra
              novos artistas e produtores em um só lugar.
            </p>
            <p>Novas versões, novas ideias e novos sons para deixar cada set diferente.</p>
            <p className="text-[13px] text-[#7a7a7a]">
              Encontre sua próxima faixa favorita. Do clássico ao lançamento, do remix ao edit exclusivo:
              explore o catálogo, conheça os produtores e encontre versões prontas para ganhar espaço no seu
              set.
            </p>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9a9a9a] sm:hidden">
            Remixes, edits, versões exclusivas e produções de DJs e produtores parceiros do Brazilian Remix
            Service. Explore por gênero, pesquise por título e descubra novos sons para o seu próximo set.
          </p>
        </div>

        <form method="get" action="/discover" className="mb-6 flex flex-col gap-2 lg:flex-row">
          {clubOnly ? <input type="hidden" name="club" value="1" /> : null}
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-xl border border-[#60cdff]/45 bg-[#121212] px-3.5 ring-1 ring-[#60cdff]/10">
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
                ? "border-[#60cdff]/55 bg-[#60cdff]/15 text-[#60cdff]"
                : "border-white/[0.1] bg-[#171717] text-white hover:border-[#60cdff]/40 hover:bg-[#60cdff]/10 hover:text-[#60cdff]"
            }`}
          >
            <Crown className="h-4 w-4" />
            Exclusivas BRS
          </Link>

          <button
            type="submit"
            className="h-12 rounded-xl bg-[#60cdff] px-5 text-sm font-extrabold text-black transition hover:bg-[#60cdff]/80"
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
            <span className="rounded-xl border border-[#60cdff]/30 bg-[#60cdff]/10 px-4 py-2 text-xs font-bold text-[#60cdff]">
              {catalog.page} / {catalog.totalPages}
            </span>
            {nextHref ? (
              <Link
                href={nextHref}
                className="rounded-xl bg-[#60cdff] px-4 py-2 text-xs font-extrabold text-black hover:bg-[#60cdff]/80"
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
