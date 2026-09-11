"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Copy,
  Download,
  Folder,
  FolderTree,
  Loader2,
  MonitorDown,
  Share2,
} from "lucide-react";
import { buildPackDownloadUrl } from "../../lib/pack-download-link";
import { displayFolderName, folderHref, slugifyFolderName } from "../../lib/vip-music-slugs";
import { prefetchMusicasJson } from "../lib/musicas-fetch-cache";
import { sendPackSlugToDownloader } from "../lib/send-to-downloader";
import { CollectionContextMenu, type CollectionMenuAction } from "./CollectionContextMenu";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";

const SENT_PACKS_KEY = "brs-dl-sent-packs";

function readSentPacks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SENT_PACKS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function markPackSent(slug: string) {
  const next = readSentPacks();
  next.add(slug);
  try {
    sessionStorage.setItem(SENT_PACKS_KEY, JSON.stringify([...next]));
  } catch {
    /* ignore quota */
  }
}

export type LibraryFolderItem = {
  id: string;
  name: string;
  /** Override do título exibido (senão usa displayFolderName). */
  title?: string;
  folderCount?: number;
  trackCount?: number;
  /** Texto extra no mobile / sob o título (ex.: intervalo da semana). */
  detail?: string | null;
  /** Badge ao lado do nome. */
  badge?: string | null;
  badgeTone?: "green" | "amber" | "muted";
};

type LibraryFolderListProps = {
  folders: LibraryFolderItem[];
  slugSegments: string[];
  newFolderIds?: Set<string>;
  title?: string;
  description?: string;
  descriptionMobile?: string;
  emptyMessage?: string;
  /** Conteúdo acima da lista (ex.: calendário). */
  before?: ReactNode;
  className?: string;
};

type FolderRowProps = {
  folder: LibraryFolderItem;
  slugSegments: string[];
  isNew: boolean;
  sent: boolean;
  onMarkedSent: (slug: string) => void;
};

function formatMeta(folderCount: number, trackCount: number, detail?: string | null) {
  const parts: string[] = [];
  if (folderCount > 0) {
    parts.push(`${folderCount} ${folderCount === 1 ? "subpasta" : "subpastas"}`);
  }
  if (trackCount > 0) {
    parts.push(`${trackCount} ${trackCount === 1 ? "faixa" : "faixas"}`);
  }
  if (detail?.trim()) parts.push(detail.trim());
  return parts;
}

function badgeClass(tone: LibraryFolderItem["badgeTone"]) {
  if (tone === "amber") return "text-amber-300";
  if (tone === "muted") return "text-zinc-500";
  return "text-[#1ed760]";
}

const FolderDownloaderButton = memo(function FolderDownloaderButton({
  slug,
  label,
  sent,
  onMarkedSent,
}: {
  slug: string;
  label: string;
  sent: boolean;
  onMarkedSent: (slug: string) => void;
}) {
  const { authenticated, openLogin, hasVip } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const [sending, setSending] = useState(false);
  const isDone = sent;

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (sending || isDone) return;

    if (!authenticated) {
      openLogin();
      return;
    }
    if (!hasVip) {
      showToast("Plano VIP necessário para usar o Downloader.", "error");
      return;
    }

    setSending(true);
    try {
      const result = await sendPackSlugToDownloader(slug, {
        target: sync?.selectedTarget,
        devices: sync?.devices,
        root: "vip",
      });
      markPackSent(slug);
      onMarkedSent(slug);
      showToast(
        result.count === 1
          ? "1 faixa adicionada ao BRS Downloader"
          : `${result.count} faixas adicionadas ao BRS Downloader`,
      );
      await sync?.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível enviar a pasta.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(event) => void handleClick(event)}
      disabled={sending || isDone}
      title={isDone ? `${label} · já enviada` : label}
      aria-label={isDone ? `${label} · já enviada` : label}
      className={`inline-flex h-8 flex-shrink-0 items-center justify-center gap-1 rounded-md border px-2 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-80 ${
        isDone
          ? "border-[#1ed760]/50 bg-[#1ed760]/20 text-[#1ed760]"
          : sending
            ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
            : "border-[#1ed760]/40 bg-[#1ed760]/10 text-[#1ed760] hover:bg-[#1ed760]/20"
      }`}
    >
      {sending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isDone ? (
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      ) : (
        <MonitorDown className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">{isDone ? "Enviada" : sending ? "Enviando" : null}</span>
      <span className="sm:hidden">{isDone ? "✓" : null}</span>
    </button>
  );
});

const LibraryFolderRow = memo(function LibraryFolderRow({
  folder,
  slugSegments,
  isNew,
  sent,
  onMarkedSent,
}: FolderRowProps) {
  const router = useRouter();
  const { showToast } = useMusicasToast();
  const { authenticated, openLogin, hasVip } = useMusicasSession();
  const sync = useDownloaderSync();
  const [sending, setSending] = useState(false);

  const folderSlug = slugifyFolderName(folder.name);
  const nextSegments = useMemo(() => [...slugSegments, folderSlug], [slugSegments, folderSlug]);
  const href = folderHref(nextSegments);
  const resolveSlug = nextSegments.join("/");
  const label = (folder.title?.trim() || displayFolderName(folder.name)).toLocaleUpperCase("pt-BR");
  const folderCount = folder.folderCount ?? 0;
  const trackCount = folder.trackCount ?? 0;
  const hasSubfolders = folderCount > 0;
  const metaParts = formatMeta(folderCount, trackCount, folder.detail);
  const badge = folder.badge?.trim() || (isNew ? "Novo" : null);
  const badgeTone = folder.badgeTone ?? "green";

  const prefetch = useCallback(() => {
    prefetchMusicasJson(`/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`);
  }, [resolveSlug]);

  const openFolder = useCallback(() => {
    router.push(href);
  }, [href, router]);

  const sendToDownloader = useCallback(async () => {
    if (sending || sent) return;
    if (!authenticated) {
      openLogin();
      return;
    }
    if (!hasVip) {
      showToast("Plano VIP necessário para usar o Downloader.", "error");
      return;
    }
    setSending(true);
    try {
      const result = await sendPackSlugToDownloader(resolveSlug, {
        target: sync?.selectedTarget,
        devices: sync?.devices,
        root: "vip",
      });
      markPackSent(resolveSlug);
      onMarkedSent(resolveSlug);
      showToast(
        result.count === 1
          ? "1 faixa adicionada ao BRS Downloader"
          : `${result.count} faixas adicionadas ao BRS Downloader`,
      );
      await sync?.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível enviar a pasta.", "error");
    } finally {
      setSending(false);
    }
  }, [
    authenticated,
    hasVip,
    onMarkedSent,
    openLogin,
    resolveSlug,
    sending,
    sent,
    showToast,
    sync,
  ]);

  const copyLink = useCallback(() => {
    const url = buildPackDownloadUrl(nextSegments);
    void navigator.clipboard
      .writeText(url)
      .then(() => showToast("Link copiado"))
      .catch(() => showToast("Não foi possível copiar o link.", "error"));
  }, [nextSegments, showToast]);

  const shareFolder = useCallback(async () => {
    const url = buildPackDownloadUrl(nextSegments);
    try {
      if (navigator.share) {
        await navigator.share({ title: label, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast("Link copiado para compartilhar");
    } catch {
      /* cancelado */
    }
  }, [label, nextSegments, showToast]);

  const downloadFolderLink = useCallback(() => {
    const url = buildPackDownloadUrl(nextSegments);
    void navigator.clipboard
      .writeText(url)
      .then(() => showToast("Link da pasta copiado — cole no BRS Downloader"))
      .catch(() => showToast("Não foi possível copiar o link.", "error"));
  }, [nextSegments, showToast]);

  const menuActions = useMemo((): CollectionMenuAction[] => {
    return [
      { id: "open", label: "Abrir pasta", icon: Folder, onClick: openFolder },
      {
        id: "downloader",
        label: sent ? "Já enviada ao Downloader" : "Enviar ao Downloader",
        icon: MonitorDown,
        disabled: sending || sent,
        onClick: () => void sendToDownloader(),
      },
      { id: "copy", label: "Copiar link", icon: Copy, onClick: copyLink },
      { id: "share", label: "Compartilhar", icon: Share2, onClick: () => void shareFolder() },
      { id: "download", label: "Baixar pasta", icon: Download, onClick: downloadFolderLink },
    ];
  }, [copyLink, downloadFolderLink, openFolder, sendToDownloader, sending, sent, shareFolder]);

  const FolderIcon = hasSubfolders ? FolderTree : Folder;

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openFolder}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openFolder();
        }
      }}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      className="group/folder relative cursor-pointer border-b border-[#1ed760]/15 bg-[#0f1012] transition-[background-color,transform,box-shadow] duration-200 ease-out last:border-b-0 hover:bg-[rgba(0,255,110,0.05)] hover:shadow-[inset_3px_0_0_0_#1ed760]"
      aria-label={`Abrir ${label}`}
    >
      <div className="px-3 py-3 transition-transform duration-200 ease-out group-hover/folder:translate-x-0.5 md:hidden">
        <div className="flex min-w-0 items-start gap-2.5">
          <FolderIcon
            className={`mt-0.5 h-5 w-5 flex-shrink-0 transition-all duration-200 ease-out group-hover/folder:scale-110 ${
              hasSubfolders
                ? "text-[#1ed760]/80 group-hover/folder:text-[#1ed760]"
                : "text-white/40 group-hover/folder:text-[#1ed760]/80"
            }`}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[14px] font-medium text-white transition-colors duration-200 group-hover/folder:text-[#1ed760]">
                {label}
              </span>
              {badge ? (
                <span
                  className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider ${badgeClass(badgeTone)}`}
                >
                  {badge}
                </span>
              ) : null}
            </span>
            {metaParts.length > 0 ? (
              <span className="mt-0.5 block truncate text-[12px] text-white/45">
                {metaParts.join(" · ")}
              </span>
            ) : null}
          </span>
        </div>
        <div
          className="mt-2.5 flex items-center gap-1.5 pl-7"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Link
            href={href}
            onMouseEnter={prefetch}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 text-[11px] font-bold uppercase tracking-wider text-white/80"
          >
            Abrir
          </Link>
          <FolderDownloaderButton
            slug={resolveSlug}
            label={`Enviar ${label} ao Downloader`}
            sent={sent}
            onMarkedSent={onMarkedSent}
          />
          <CollectionContextMenu
            label={`Opções · ${label}`}
            buttonClassName="!h-8 !w-8 text-white/50 hover:text-white"
            actions={menuActions}
          />
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-[32px_minmax(0,1fr)_auto_auto_32px_auto_32px] md:items-center md:gap-x-3 md:px-4 md:py-3 md:transition-transform md:duration-200 md:ease-out md:group-hover/folder:translate-x-0.5">
        <span className="flex items-center justify-center">
          <FolderIcon
            className={`h-5 w-5 transition-all duration-200 ease-out group-hover/folder:scale-110 ${
              hasSubfolders
                ? "text-[#1ed760]/80 group-hover/folder:text-[#1ed760]"
                : "text-white/40 group-hover/folder:text-[#1ed760]/80"
            }`}
            aria-hidden
          />
        </span>
        <span className="min-w-0">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[14px] font-medium text-white transition-colors duration-200 group-hover/folder:text-[#1ed760]">
              {label}
            </span>
            {badge ? (
              <span
                className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider ${badgeClass(badgeTone)}`}
              >
                {badge}
              </span>
            ) : null}
          </span>
          {folder.detail ? (
            <span className="mt-0.5 block truncate text-[12px] text-white/40 transition-colors duration-200 group-hover/folder:text-white/55">
              {folder.detail}
            </span>
          ) : null}
        </span>
        <span className="whitespace-nowrap text-right text-[12px] tabular-nums text-white/45 transition-colors duration-200 group-hover/folder:text-white/65">
          {trackCount > 0 ? `${trackCount} ${trackCount === 1 ? "faixa" : "faixas"}` : null}
        </span>
        <span className="whitespace-nowrap text-right text-[12px] tabular-nums text-white/45 transition-colors duration-200 group-hover/folder:text-white/65">
          {folderCount > 0
            ? `${folderCount} ${folderCount === 1 ? "subpasta" : "subpastas"}`
            : null}
        </span>
        <span className="flex items-center justify-center text-white/30 transition-all duration-200 group-hover/folder:translate-x-0.5 group-hover/folder:text-[#1ed760]">
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>

        <div
          className="flex items-center justify-center"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <FolderDownloaderButton
            slug={resolveSlug}
            label={`Enviar ${label} ao Downloader`}
            sent={sent}
            onMarkedSent={onMarkedSent}
          />
        </div>

        <div
          className="flex items-center justify-end"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <CollectionContextMenu
            label={`Opções · ${label}`}
            buttonClassName="!h-8 !w-8 text-white/40 opacity-70 transition-opacity hover:text-white group-hover/folder:opacity-100"
            actions={menuActions}
          />
        </div>
      </div>
    </article>
  );
});

/** Lista de pastas/subpastas no padrão biblioteca (até chegar nas faixas). */
export function LibraryFolderList({
  folders,
  slugSegments,
  newFolderIds,
  title = "Pastas",
  description = "Explore as categorias e subpastas deste pack",
  descriptionMobile = "Categorias e subpastas",
  emptyMessage = "Nenhuma pasta neste nível. Adicione subpastas no Google Drive.",
  before,
  className = "",
}: LibraryFolderListProps) {
  const [sentSlugs, setSentSlugs] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setSentSlugs(readSentPacks());
  }, []);

  const onMarkedSent = useCallback((slug: string) => {
    setSentSlugs((current) => {
      if (current.has(slug)) return current;
      const next = new Set(current);
      next.add(slug);
      return next;
    });
  }, []);

  if (folders.length === 0) {
    return (
      <div className={className}>
        {before}
        <p className="rounded-[20px] border border-white/5 bg-[#0f1012] px-4 py-8 text-center text-sm text-zinc-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {before}
      <section className="overflow-hidden rounded-[20px] border border-white/5 bg-[#0f1012]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">{title}</h2>
            {description ? (
              <p className="mt-0.5 hidden text-sm text-white/45 sm:block">{description}</p>
            ) : null}
            {descriptionMobile ? (
              <p className="mt-0.5 text-xs text-white/40 sm:hidden">{descriptionMobile}</p>
            ) : null}
          </div>
          <p className="text-[12px] tabular-nums text-white/40">
            {folders.length} pasta{folders.length === 1 ? "" : "s"}
          </p>
        </div>

        <div>
          {folders.map((folder) => {
            const folderSlug = slugifyFolderName(folder.name);
            const resolveSlug = [...slugSegments, folderSlug].join("/");
            return (
              <LibraryFolderRow
                key={folder.id}
                folder={folder}
                slugSegments={slugSegments}
                isNew={Boolean(newFolderIds?.has(folder.id))}
                sent={sentSlugs.has(resolveSlug)}
                onMarkedSent={onMarkedSent}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
