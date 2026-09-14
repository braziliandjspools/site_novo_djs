"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Disc3,
  FolderOpen,
  FolderTree,
  Home,
  Layers3,
} from "lucide-react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  childrenAreMonthFolders,
  childrenAreWeekFolders,
  displayFolderName,
  folderHref,
  isMonthFolderName,
  isWeekFolderName,
  slugifyFolderName,
  sortFoldersByMonthDate,
  sortFoldersByWeek,
  sortVipChildFolders,
} from "../../lib/vip-music-slugs";
import {
  getContinueListening,
  getRecentFolders,
  type ContinueListening,
  type RecentFolder,
} from "../lib/music-library-storage";
import { getTrackDisplayMetadata } from "../../lib/track-display-metadata";

export type BrowseNavPathPart = {
  slug: string;
  name: string;
  id?: string;
};

type AtualizacoesBrowseNavSidebarProps = {
  slugSegments: string[];
  resolvedPath?: BrowseNavPathPart[];
  /** Packs da raiz (tree) — atalhos de 1º nível. */
  rootPacks: VipMusicFolder[];
  /** Filhos do nível atual (após sync/resolve). */
  currentChildren?: VipMusicCatalogItem[] | VipMusicFolder[];
  /** Irmãos do nível atual. */
  siblings?: VipMusicFolder[];
  /** Meses do pack atual (quando já resolvidos). */
  packMonths?: VipMusicFolder[];
  /** Semanas do mês atual. */
  monthWeeks?: VipMusicFolder[];
  newChildIds?: Set<string>;
  loading?: boolean;
};

function SidebarSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  count,
}: {
  title: string;
  icon: typeof FolderOpen;
  children: ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/25">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-[#1ed760]/25 bg-[#1ed760]/10 text-[#1ed760]">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
        </span>
        <h3 className="min-w-0 flex-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
          {title}
        </h3>
        {typeof count === "number" ? (
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/40">
            {count}
          </span>
        ) : null}
        <ChevronDown
          className={`h-4 w-4 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? <div className="space-y-1 border-t border-white/[0.05] px-2 py-2">{children}</div> : null}
    </section>
  );
}

function NavLink({
  href,
  title,
  active,
  isNew,
  meta,
}: {
  href: string;
  title: string;
  active?: boolean;
  isNew?: boolean;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors ${
        active
          ? "border-[#1ed760]/40 bg-[rgba(30,215,96,0.12)] text-white"
          : "border-transparent bg-white/[0.02] text-white/85 hover:border-[#1ed760]/30 hover:bg-[rgba(30,215,96,0.06)] hover:text-white"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
          active ? "bg-[#1ed760]" : "bg-[#1ed760]/50 opacity-70 group-hover:opacity-100"
        }`}
      />
      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-snug">{title}</span>
      {isNew ? (
        <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-[0.1em] text-[#1ed760]">
          Novo
        </span>
      ) : null}
      {meta ? (
        <span className="flex-shrink-0 text-[10px] font-semibold tabular-nums text-white/35">{meta}</span>
      ) : null}
    </Link>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando navegação">
      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/25 p-3">
          <div className="mb-3 h-3 w-24 animate-pulse rounded bg-white/10" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, row) => (
              <div key={row} className="h-9 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function uniqueById(folders: VipMusicFolder[]) {
  const seen = new Set<string>();
  return folders.filter((folder) => {
    if (seen.has(folder.id)) return false;
    seen.add(folder.id);
    return true;
  });
}

/**
 * Sidebar de navegação independente dos botões da coluna principal.
 * Atalhos seguem Pack → Mês → Semana → Pastas conforme a sincronização.
 */
export function AtualizacoesBrowseNavSidebar({
  slugSegments,
  resolvedPath = [],
  rootPacks,
  currentChildren = [],
  siblings = [],
  packMonths = [],
  monthWeeks = [],
  newChildIds,
  loading = false,
}: AtualizacoesBrowseNavSidebarProps) {
  const [continueItem, setContinueItem] = useState<ContinueListening | null>(null);
  const [recentFolders, setRecentFolders] = useState<RecentFolder[]>([]);

  useEffect(() => {
    setContinueItem(getContinueListening());
    setRecentFolders(getRecentFolders().slice(0, 5));
  }, [slugSegments.join("/")]);

  const packSlug = slugSegments[0] ?? "";
  const monthSlug = slugSegments[1] ?? "";
  const weekSlug = slugSegments[2] ?? "";
  const currentSlug = slugSegments[slugSegments.length - 1] ?? "";

  const packs = useMemo(
    () => sortVipChildFolders(uniqueById(rootPacks)),
    [rootPacks],
  );

  const months = useMemo(() => {
    const fromProp = packMonths.filter((folder) => isMonthFolderName(folder.name));
    const fromChildren = currentChildren.filter((folder) => isMonthFolderName(folder.name));
    const fromSiblings = siblings.filter((folder) => isMonthFolderName(folder.name));
    const list =
      fromProp.length > 0
        ? fromProp
        : childrenAreMonthFolders(fromChildren)
          ? fromChildren
          : childrenAreMonthFolders(fromSiblings)
            ? fromSiblings
            : fromChildren.length > 0 && slugSegments.length === 1
              ? fromChildren
              : fromProp;
    return sortFoldersByMonthDate(uniqueById(list), false);
  }, [packMonths, currentChildren, siblings, slugSegments.length]);

  const weeks = useMemo(() => {
    const fromProp = monthWeeks.filter((folder) => isWeekFolderName(folder.name));
    const fromChildren = currentChildren.filter((folder) => isWeekFolderName(folder.name));
    const fromSiblings = siblings.filter((folder) => isWeekFolderName(folder.name));
    const list =
      fromProp.length > 0
        ? fromProp
        : childrenAreWeekFolders(fromChildren)
          ? fromChildren
          : childrenAreWeekFolders(fromSiblings)
            ? fromSiblings
            : fromProp;
    return sortFoldersByWeek(uniqueById(list));
  }, [monthWeeks, currentChildren, siblings]);

  const styleFolders = useMemo(() => {
    const source =
      !childrenAreWeekFolders(currentChildren) && !childrenAreMonthFolders(currentChildren)
        ? currentChildren
        : siblings.filter(
            (folder) => !isWeekFolderName(folder.name) && !isMonthFolderName(folder.name),
          );
    return sortVipChildFolders(
      uniqueById(
        source.filter(
          (folder) => !isWeekFolderName(folder.name) && !isMonthFolderName(folder.name),
        ),
      ),
    );
  }, [currentChildren, siblings]);

  const continueDisplay = continueItem ? getTrackDisplayMetadata(continueItem) : null;
  const currentTitle =
    resolvedPath[resolvedPath.length - 1]?.name ??
    (currentSlug ? currentSlug.replace(/-/g, " ") : "Acervo");

  if (loading && packs.length === 0 && months.length === 0 && weeks.length === 0) {
    return (
      <aside className="rounded-2xl border border-[#1ed760]/20 bg-[#17191d] p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:p-4">
        <SidebarSkeleton />
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-[#1ed760]/20 bg-[#17191d] p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:p-4">
      <div className="mb-3.5 rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#1ed760]/10 via-transparent to-transparent px-3.5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1ed760]/90">
          Navegação
        </p>
        <h2 className="mt-1 text-[15px] font-bold tracking-tight text-white">
          {displayFolderName(currentTitle)}
        </h2>
        <p className="mt-1 text-[11px] leading-relaxed text-white/45">
          Atalhos do Drive: Pack → Mês → Semana → Pastas. Atualizam após sincronizar.
        </p>
        <Link
          href="/musicas/atualizacoes"
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#1ed760]/30 bg-[#1ed760]/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1ed760] transition-colors hover:bg-[#1ed760]/20"
        >
          <Home className="h-3.5 w-3.5" aria-hidden />
          Acervo (raiz)
        </Link>
      </div>

      {resolvedPath.length > 0 ? (
        <nav className="mb-3 flex flex-wrap gap-1.5 px-0.5" aria-label="Caminho atual">
          {resolvedPath.map((part, index) => {
            const href = folderHref(resolvedPath.slice(0, index + 1).map((item) => item.slug));
            const last = index === resolvedPath.length - 1;
            return (
              <Link
                key={`${part.slug}-${index}`}
                href={href}
                className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${
                  last
                    ? "bg-[#1ed760]/15 text-[#1ed760]"
                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                {displayFolderName(part.name)}
              </Link>
            );
          })}
        </nav>
      ) : null}

      <div className="max-h-[min(70vh,42rem)] space-y-2.5 overflow-y-auto pr-0.5">
        <SidebarSection title="Packs" icon={FolderTree} count={packs.length}>
          {packs.length > 0 ? (
            packs.map((pack) => {
              const slug = slugifyFolderName(pack.name);
              return (
                <NavLink
                  key={pack.id}
                  href={folderHref([slug])}
                  title={displayFolderName(pack.name)}
                  active={packSlug === slug}
                  isNew={newChildIds?.has(pack.id)}
                />
              );
            })
          ) : (
            <p className="px-2 py-2 text-[12px] text-white/35">
              Sincronize para carregar os packs da raiz.
            </p>
          )}
        </SidebarSection>

        {packSlug ? (
          <SidebarSection title="Meses" icon={CalendarDays} count={months.length}>
            {months.length > 0 ? (
              months.map((month) => {
                const slug = slugifyFolderName(month.name);
                return (
                  <NavLink
                    key={month.id}
                    href={folderHref([packSlug, slug])}
                    title={displayFolderName(month.name)}
                    active={monthSlug === slug}
                    isNew={newChildIds?.has(month.id)}
                  />
                );
              })
            ) : (
              <p className="px-2 py-2 text-[12px] text-white/35">
                Meses aparecem ao abrir o pack (ex.: JANEIRO).
              </p>
            )}
          </SidebarSection>
        ) : null}

        {packSlug && (monthSlug || weeks.length > 0) ? (
          <SidebarSection title="Semanas" icon={Layers3} count={weeks.length}>
            {weeks.length > 0 && monthSlug ? (
              weeks.map((week) => {
                const slug = slugifyFolderName(week.name);
                return (
                  <NavLink
                    key={week.id}
                    href={folderHref([packSlug, monthSlug, slug])}
                    title={displayFolderName(week.name)}
                    active={weekSlug === slug}
                    isNew={newChildIds?.has(week.id)}
                  />
                );
              })
            ) : weeks.length > 0 && !monthSlug ? (
              weeks.map((week) => {
                const slug = slugifyFolderName(week.name);
                return (
                  <NavLink
                    key={week.id}
                    href={folderHref([packSlug, slug])}
                    title={displayFolderName(week.name)}
                    active={monthSlug === slug || currentSlug === slug}
                    isNew={newChildIds?.has(week.id)}
                  />
                );
              })
            ) : (
              <p className="px-2 py-2 text-[12px] text-white/35">
                Semanas (SEMANA 01…) entram após sincronizar o mês.
              </p>
            )}
          </SidebarSection>
        ) : null}

        {(weekSlug || styleFolders.length > 0) && packSlug ? (
          <SidebarSection title="Pastas" icon={FolderOpen} count={styleFolders.length}>
            {styleFolders.length > 0 ? (
              styleFolders.map((folder) => {
                const slug = slugifyFolderName(folder.name);
                const hrefSegments =
                  weekSlug && monthSlug
                    ? [packSlug, monthSlug, weekSlug, slug]
                    : monthSlug
                      ? [packSlug, monthSlug, slug]
                      : [packSlug, slug];
                const catalog = folder as VipMusicCatalogItem;
                const meta =
                  typeof catalog.trackCount === "number" && catalog.trackCount > 0
                    ? String(catalog.trackCount)
                    : typeof catalog.folderCount === "number" && catalog.folderCount > 0
                      ? String(catalog.folderCount)
                      : undefined;
                return (
                  <NavLink
                    key={folder.id}
                    href={folderHref(hrefSegments)}
                    title={displayFolderName(folder.name)}
                    active={slugSegments.join("/") === hrefSegments.join("/")}
                    isNew={newChildIds?.has(folder.id)}
                    meta={meta}
                  />
                );
              })
            ) : (
              <p className="px-2 py-2 text-[12px] text-white/35">
                As 30–35 pastas da semana aparecem aqui após a sync.
              </p>
            )}
          </SidebarSection>
        ) : null}

        {continueDisplay && continueItem ? (
          <SidebarSection title="Continuar" icon={Disc3}>
            <NavLink href={continueItem.href} title={continueDisplay.title} />
          </SidebarSection>
        ) : null}

        {recentFolders.length > 0 ? (
          <SidebarSection title="Visitadas" icon={Clock3}>
            {recentFolders.map((folder) => (
              <NavLink
                key={`${folder.href}-${folder.visitedAt}`}
                href={folder.href}
                title={folder.name}
              />
            ))}
          </SidebarSection>
        ) : null}
      </div>
    </aside>
  );
}
