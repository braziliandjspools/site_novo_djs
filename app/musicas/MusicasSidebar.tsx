"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Layers, LogIn, LogOut, Menu, RefreshCw } from "lucide-react";
import { BrsLogo } from "../components/BrsLogo";
import { PLACEHOLDER } from "../lib/theme";
import type { VipMusicFolder } from "../lib/vip-music-catalog";
import {
  childrenAreDateFolders,
  displayFolderName,
  folderHref,
  formatDateFolderLabel,
  isYearFolderName,
  slugifyFolderName,
  sortFoldersByDateFolder,
  sortFoldersByYear,
} from "../lib/vip-music-slugs";
import { DownloaderDevicePanel } from "./components/DownloaderDevicePanel";
import { SITE_NAV_LINKS } from "../lib/site-nav";

type MusicasSidebarProps = {
  authenticated: boolean;
  userName: string;
  hasVip: boolean;
  onLogout: () => void;
  onLogin: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

const PLATFORM_NAV = [
  { href: "/musicas/home", label: "Início", icon: Home },
  { href: "/musicas/atualizacoes", label: "Atualizações", icon: RefreshCw },
  { href: "/musicas/colecoes", label: "Coleções", icon: Layers },
] as const;

type ResolveResponse = {
  folderName: string;
  level: "folders" | "tracks";
  items: VipMusicFolder[];
};

export function MusicasSidebar({
  authenticated,
  userName,
  hasVip,
  onLogout,
  onLogin,
  mobileOpen,
  onMobileOpenChange,
}: MusicasSidebarProps) {
  const pathname = usePathname();
  const firstName = authenticated ? userName.split(" ")[0] : "Visitante";
  const onAtualizacoes = pathname.startsWith("/musicas/atualizacoes");

  const pathParts = useMemo(() => {
    const raw = pathname.replace(/^\/musicas\/atualizacoes\/?/, "");
    if (!raw || pathname === "/musicas/atualizacoes") return [];
    return raw.split("/").filter(Boolean);
  }, [pathname]);

  const activeYearSlug = pathParts[0];
  const [years, setYears] = useState<VipMusicFolder[]>([]);
  const [sources, setSources] = useState<VipMusicFolder[]>([]);
  const [sourcesAreDates, setSourcesAreDates] = useState(false);
  const [selectedYearSlug, setSelectedYearSlug] = useState<string>("");

  useEffect(() => {
    void fetch("/api/musicas/tree", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => {
        const folders = (body as { folders?: VipMusicFolder[] }).folders ?? [];
        const yearList = sortFoldersByYear(
          folders.filter((f) => isYearFolderName(f.name)),
          true,
        );
        setYears(yearList.length > 0 ? yearList : folders);
      })
      .catch(() => setYears([]));
  }, []);

  useEffect(() => {
    if (!onAtualizacoes) return;
    const fromPath = activeYearSlug;
    const fallback = years[0] ? slugifyFolderName(years[0].name) : "";
    setSelectedYearSlug(fromPath || fallback);
  }, [onAtualizacoes, activeYearSlug, years]);

  useEffect(() => {
    if (!onAtualizacoes || !selectedYearSlug) {
      setSources([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/musicas/resolve?slug=${encodeURIComponent(selectedYearSlug)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json()) as ResolveResponse & { error?: string };
        if (!res.ok || cancelled) return;
        const items = body.items ?? [];
        const asDates = childrenAreDateFolders(items);
        setSourcesAreDates(asDates);
        setSources(asDates ? sortFoldersByDateFolder(items, true) : items);
      })
      .catch(() => {
        if (!cancelled) setSources([]);
      });
    return () => {
      cancelled = true;
    };
  }, [onAtualizacoes, selectedYearSlug]);

  const sidebarContent = (
    <>
      <div className="px-5 py-6">
        <BrsLogo href="/musicas/home" className="h-10 w-auto max-w-[220px] object-contain object-left" />
        <p className="mt-2 text-xs text-zinc-500">Sua biblioteca de músicas</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Menu</p>
        {PLATFORM_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/musicas/home" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onMobileOpenChange(false)}
              className={`flex items-center gap-4 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                active ? "bg-[#282828] text-white" : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}

        {onAtualizacoes && (
          <>
            <p className="mt-6 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              Sources
            </p>

            {years.length > 1 && (
              <div className="mb-2 flex flex-wrap gap-1 px-1">
                {years.map((year) => {
                  const slug = slugifyFolderName(year.name);
                  const active = selectedYearSlug === slug;
                  const label = displayFolderName(year.name);
                  return (
                    <Link
                      key={year.id}
                      href={folderHref([slug])}
                      title={label}
                      onClick={() => {
                        setSelectedYearSlug(slug);
                        onMobileOpenChange(false);
                      }}
                      className={`max-w-full truncate rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        active
                          ? "bg-[#1ed760]/15 text-[#1ed760]"
                          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}

            {sources.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-600">
                {selectedYearSlug
                  ? "Nenhum pool/data neste ano."
                  : "Abra Atualizações para carregar Sources."}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {sources.map((item) => {
                  const slug = slugifyFolderName(item.name);
                  const label = sourcesAreDates
                    ? formatDateFolderLabel(item.name)
                    : displayFolderName(item.name);
                  const href = selectedYearSlug
                    ? folderHref([selectedYearSlug, slug])
                    : folderHref([slug]);
                  const active =
                    pathname === href ||
                    pathname.startsWith(`${href}/`) ||
                    (pathParts[0] === selectedYearSlug && pathParts[1] === slug) ||
                    (sourcesAreDates === false &&
                      pathParts.length === 2 &&
                      pathParts[1] === slug);

                  return (
                    <li key={item.id}>
                      <Link
                        href={href}
                        title={displayFolderName(item.name)}
                        onClick={() => onMobileOpenChange(false)}
                        className={`flex items-center gap-3 rounded-md px-2 py-2 transition-colors ${
                          active
                            ? "bg-[#282828] text-white"
                            : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-white"
                        }`}
                      >
                        <span className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-md bg-zinc-900 ring-1 ring-white/10">
                          <Image
                            src={PLACEHOLDER.trackCover}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{label}</span>
                          <span className="block truncate text-[10px] text-zinc-600">
                            {sourcesAreDates ? "Data" : "Pool"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        <p className="mt-6 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Site</p>
        {SITE_NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = href !== "/" && pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onMobileOpenChange(false)}
              className={`flex items-center gap-4 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                active ? "bg-[#282828] text-white" : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}

        <div className="mt-3 space-y-3 border-t border-zinc-800/80 pt-3">
          <p className="truncate px-3 text-xs font-medium text-zinc-400">
            <span className="font-bold text-white">{firstName}</span>
            {" · "}
            {hasVip ? "Premium" : authenticated ? "Gratuito" : "Visitante"}
          </p>

          {hasVip && authenticated && <DownloaderDevicePanel className="mx-0 mb-0" />}

          {authenticated ? (
            <button
              type="button"
              onClick={() => void onLogout()}
              className="flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-sm font-semibold text-zinc-400 transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-sm font-semibold text-zinc-400 transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <LogIn className="h-5 w-5" />
              Entrar
            </button>
          )}
        </div>
      </nav>
    </>
  );

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-black transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/80 lg:hidden"
          onClick={() => onMobileOpenChange(false)}
        />
      )}
    </>
  );
}

export function MusicasMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-full p-2 text-zinc-400 hover:bg-[#282828] hover:text-white lg:hidden"
      onClick={onClick}
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
