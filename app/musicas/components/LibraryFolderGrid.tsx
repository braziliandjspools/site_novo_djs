"use client";

/** Folder grid — category cards premium do acervo. */
import {
  memo,
  useCallback,
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
import {
  isDownloaderSendCancelled,
  previewPackTrackCount,
} from "./DownloaderBulkConfirm";
import { LibraryCategoryCard } from "./LibraryCategoryCard";
import { resolveLibraryCategoryMeta } from "../lib/library-category-meta";
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
  /** Capa da pasta (folder.jpg / API); fallback no grid. */
  coverUrl?: string | null;
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
  /** Cabeçalho acima do grid (ex.: raiz de atualizações). */
  sectionTitle?: string;
  sectionDescription?: string;
  /** Conteúdo acima da lista (ex.: calendário). */
  before?: ReactNode;
  className?: string;
  /** list = file manager; grid = category cards; buttons = lista tipo botão. */
  layout?: "list" | "grid" | "buttons";
  /** Preenche a coluna (layout com sidebar) em vez de max-width estreito. */
  fillColumn?: boolean;
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
  knownTrackCount,
  tone = "dark",
}: {
  slug: string;
  label: string;
  sent: boolean;
  onMarkedSent: (slug: string) => void;
  knownTrackCount?: number;
  tone?: "dark" | "onDark";
}) {
  const { authenticated, openLogin, hasVip } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const [sending, setSending] = useState(false);
  const isDone = sent;

  const runSend = useCallback(async () => {
    setSending(true);
    try {
      let previewCount = typeof knownTrackCount === "number" && knownTrackCount > 0 ? knownTrackCount : 1;
      try {
        if (!(typeof knownTrackCount === "number" && knownTrackCount > 0)) {
          previewCount = await previewPackTrackCount(slug, "vip");
        }
      } catch {
        /* ignore */
      }
      const result = await sendPackSlugToDownloader(slug, {
        target: sync?.selectedTarget,
        devices: sync?.devices,
        root: "vip",
        previewCount,
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
      if (isDownloaderSendCancelled(err)) return;
      showToast(err instanceof Error ? err.message : "Não foi possível enviar a pasta.", "error");
    } finally {
      setSending(false);
    }
  }, [knownTrackCount, onMarkedSent, showToast, slug, sync]);

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

    await runSend();
  }

  const onDark = tone === "onDark";

  return (
    <button
      type="button"
      onClick={(event) => void handleClick(event)}
      disabled={sending || isDone}
      title={isDone ? `${label} · já enviada` : label}
      aria-label={isDone ? `${label} · já enviada` : label}
      className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-colors disabled:opacity-80 ${
        isDone
          ? "border-[#1ed760]/50 bg-[#1ed760]/20 text-[#1ed760]"
          : onDark
            ? "border-white/15 bg-white/[0.06] text-white/80 hover:bg-white/[0.1] hover:text-white"
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

  const runSendToDownloader = useCallback(async () => {
    setSending(true);
    try {
      let previewCount = trackCount > 0 ? trackCount : 1;
      try {
        if (trackCount <= 0) previewCount = await previewPackTrackCount(resolveSlug, "vip");
      } catch {
        /* ignore */
      }
      const result = await sendPackSlugToDownloader(resolveSlug, {
        target: sync?.selectedTarget,
        devices: sync?.devices,
        root: "vip",
        previewCount,
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
      if (isDownloaderSendCancelled(err)) return;
      showToast(err instanceof Error ? err.message : "Não foi possível enviar a pasta.", "error");
    } finally {
      setSending(false);
    }
  }, [onMarkedSent, resolveSlug, showToast, sync, trackCount]);

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

    await runSendToDownloader();
  }, [
    authenticated,
    hasVip,
    openLogin,
    runSendToDownloader,
    sending,
    sent,
    showToast,
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
            knownTrackCount={trackCount}
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
            knownTrackCount={trackCount}
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
  sectionTitle,
  sectionDescription,
  before,
  className = "",
  layout = "grid",
  fillColumn = false,
}: LibraryFolderListProps) {
  const [sentSlugs, setSentSlugs] = useState<Set<string>>(() => readSentPacks());
  const { showToast } = useMusicasToast();
  const router = useRouter();

  const onMarkedSent = useCallback((slug: string) => {
    setSentSlugs((current) => {
      if (current.has(slug)) return current;
      const next = new Set(current);
      next.add(slug);
      return next;
    });
  }, []);

  const useCards = layout === "grid";
  const useButtons = layout === "buttons";

  if (folders.length === 0) {
    return (
      <div className={className}>
        {before}
        <p className="mx-auto max-w-md rounded-2xl border border-white/5 bg-[#0f1012] px-4 py-10 text-center text-sm text-zinc-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  if (useCards) {
    return (
      <div className={className} data-layout="folder-cards">
        {before}
        <section className={`mx-auto w-full ${fillColumn ? "max-w-none" : "max-w-[1440px]"}`}>
          {sectionTitle ? (
            <div className="mb-5 text-center sm:mb-6">
              <h2 className="text-xl font-extrabold uppercase tracking-[0.08em] text-white sm:text-2xl">
                {sectionTitle}
              </h2>
              <div className="mx-auto mt-2 h-0.5 w-16 rounded-full bg-[#1ed760]/50" aria-hidden />
              {sectionDescription ? (
                <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/50 sm:text-[15px]">
                  {sectionDescription}
                </p>
              ) : null}
              <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-[#1ed760]/35 bg-[#17191d] px-4 py-4 text-center shadow-[0_8px_20px_rgba(0,0,0,0.35)] sm:mt-6 sm:px-6 sm:py-5">
                <p className="text-[13px] leading-relaxed text-white/80 sm:text-sm sm:leading-[1.6]">
                  🎉 Bem-vindo ao nosso acervo exclusivo! 🚀 Usuários VIP têm acesso a downloads
                  ilimitados de todo o nosso conteúdo. Se você é um visitante, para baixar os
                  arquivos e ter acesso completo, é necessário assinar um de nossos planos.
                  Torne-se VIP e aproveite o melhor da música sem limites! ✨
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 justify-items-center gap-3.5 min-[360px]:grid-cols-2 min-[360px]:justify-items-stretch md:grid-cols-2 md:gap-4 lg:grid-cols-5">
            {folders.map((folder, index) => {
              const folderSlug = slugifyFolderName(folder.name);
              const nextSegments = [...slugSegments, folderSlug];
              const resolveSlug = nextSegments.join("/");
              const href = folderHref(nextSegments);
              const titleLabel = folder.title?.trim() || displayFolderName(folder.name);
              const meta = resolveLibraryCategoryMeta(folder.name, index);
              const badge = folder.badge?.trim() || (newFolderIds?.has(folder.id) ? "Novo" : null);

              return (
                <article key={folder.id} className="group/cardwrap relative w-full max-w-[280px] md:max-w-none">
                  <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 opacity-100 transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/cardwrap:opacity-100 [@media(hover:hover)]:group-focus-within/cardwrap:opacity-100">
                    <FolderDownloaderButton
                      slug={resolveSlug}
                      label={`Enviar ${titleLabel} ao Downloader`}
                      sent={sentSlugs.has(resolveSlug)}
                      onMarkedSent={onMarkedSent}
                      knownTrackCount={folder.trackCount}
                      tone="onDark"
                    />
                    <CollectionContextMenu
                      label={`Opções · ${titleLabel}`}
                      buttonClassName="!h-8 !w-8 rounded-lg border border-[#1ed760]/35 bg-[#121212] text-white/75 hover:border-[#1ed760]/55 hover:bg-[#0f1012] hover:text-white"
                      actions={[
                        {
                          id: "open",
                          label: "Abrir pasta",
                          icon: Folder,
                          onClick: () => {
                            router.push(href);
                          },
                        },
                        {
                          id: "copy",
                          label: "Copiar link",
                          icon: Copy,
                          onClick: () => {
                            const url = buildPackDownloadUrl(nextSegments);
                            void navigator.clipboard
                              .writeText(url)
                              .then(() => showToast("Link copiado"))
                              .catch(() => showToast("Não foi possível copiar o link.", "error"));
                          },
                        },
                      ]}
                    />
                  </div>

                  <LibraryCategoryCard
                    title={titleLabel}
                    eyebrow={meta.eyebrow}
                    description={meta.description}
                    folderCount={folder.folderCount}
                    trackCount={folder.trackCount}
                    href={href}
                    resolveSlug={resolveSlug}
                    gradient={meta.gradient}
                    icon={meta.icon}
                    cta={meta.cta}
                    singularFolderLabel={meta.singularFolderLabel}
                    badge={badge}
                    index={index}
                  />
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  if (useButtons) {
    const newlyAdded = folders.filter((folder) => newFolderIds?.has(folder.id));
    const previousFolders = folders.filter((folder) => !newFolderIds?.has(folder.id));
    const buttonGroups =
      newlyAdded.length > 0
        ? [
            { id: "new", title: "Adicionadas recentemente", folders: newlyAdded },
            ...(previousFolders.length > 0
              ? [{ id: "all", title: "Demais pastas", folders: previousFolders }]
              : []),
          ]
        : [{ id: "all", title: null as string | null, folders }];

    function renderFolderButton(folder: LibraryFolderItem) {
      const folderSlug = slugifyFolderName(folder.name);
      const nextSegments = [...slugSegments, folderSlug];
      const resolveSlug = nextSegments.join("/");
      const href = folderHref(nextSegments);
      const titleLabel = (
        folder.title?.trim() || displayFolderName(folder.name)
      ).toLocaleUpperCase("pt-BR");
      const badge = folder.badge?.trim() || (newFolderIds?.has(folder.id) ? "Adicionada" : null);
      const badgeTone = folder.badgeTone ?? "green";
      const muted = badgeTone === "muted";
      const isNew = Boolean(newFolderIds?.has(folder.id));

      return (
        <div
          key={folder.id}
          className={`group/folderbtn relative mx-auto flex w-full items-center gap-2 overflow-hidden rounded-lg border bg-[#17191d] px-3.5 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color,background-color] duration-200 sm:gap-3 sm:px-5 sm:py-3.5 ${
            muted
              ? "border-white/10 bg-[#121212]/70 opacity-55"
              : isNew
                ? "border-[#1ed760]/55 bg-[rgba(30,215,96,0.06)] hover:-translate-y-0.5 hover:border-[#1ed760]/70 hover:bg-[rgba(30,215,96,0.1)]"
                : badgeTone === "amber"
                  ? "border-[#1ed760]/40 hover:-translate-y-0.5 hover:border-amber-300/55 hover:bg-[#121212]"
                  : "border-[#1ed760]/35 hover:-translate-y-0.5 hover:border-[#1ed760]/55 hover:bg-[#121212]"
          }`}
        >
          <Link
            href={muted ? "#" : href}
            aria-disabled={muted}
            onClick={(event) => {
              if (muted) event.preventDefault();
              else {
                prefetchMusicasJson(
                  `/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`,
                );
              }
            }}
            onMouseEnter={() => {
              if (!muted) {
                prefetchMusicasJson(
                  `/api/musicas/resolve?slug=${encodeURIComponent(resolveSlug)}`,
                );
              }
            }}
            className={`flex min-w-0 flex-1 items-center gap-2.5 ${
              muted ? "pointer-events-none cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <Download
              className={`h-4 w-4 flex-shrink-0 ${muted ? "text-white/40" : isNew ? "text-[#1ed760]" : "text-white/75"}`}
              strokeWidth={2.4}
              aria-hidden
            />
            <span
              className={`min-w-0 flex-1 truncate text-[13px] font-bold uppercase tracking-[0.04em] sm:text-[14px] ${
                muted ? "text-white/45" : "text-white"
              }`}
            >
              {titleLabel}
            </span>
            {badge ? (
              <span
                className={`flex-shrink-0 text-[9px] font-semibold uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-[0.1em] ${
                  muted
                    ? "text-white/35"
                    : isNew || badgeTone === "green"
                      ? "text-[#1ed760]"
                      : badgeTone === "amber"
                        ? "text-amber-300/90"
                        : "text-white/55"
                }`}
              >
                [{badge}]
              </span>
            ) : null}
          </Link>

          {!muted ? (
            <div className="flex flex-shrink-0 items-center gap-1">
              <FolderDownloaderButton
                slug={resolveSlug}
                label={`Enviar ${titleLabel} ao Downloader`}
                sent={sentSlugs.has(resolveSlug)}
                onMarkedSent={onMarkedSent}
                knownTrackCount={folder.trackCount}
                tone="onDark"
              />
              <CollectionContextMenu
                label={`Opções · ${titleLabel}`}
                buttonClassName="!h-8 !w-8 rounded-lg border border-white/12 bg-white/[0.04] text-white/65 hover:bg-white/[0.08] hover:text-white sm:!h-9 sm:!w-9"
                actions={[
                  {
                    id: "open",
                    label: "Abrir pasta",
                    icon: Folder,
                    onClick: () => {
                      router.push(href);
                    },
                  },
                  {
                    id: "copy",
                    label: "Copiar link",
                    icon: Copy,
                    onClick: () => {
                      const url = buildPackDownloadUrl(nextSegments);
                      void navigator.clipboard
                        .writeText(url)
                        .then(() => showToast("Link copiado"))
                        .catch(() => showToast("Não foi possível copiar o link.", "error"));
                    },
                  },
                ]}
              />
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className={className} data-layout="folder-buttons">
        {before}
        <section
          className={`mx-auto flex w-full flex-col items-center px-1 sm:px-2 ${
            fillColumn ? "max-w-none" : "max-w-3xl"
          }`}
        >
          {sectionTitle ? (
            <div className="mb-5 w-full text-center sm:mb-6">
              <h2 className="text-xl font-extrabold uppercase tracking-[0.08em] text-white sm:text-2xl">
                {sectionTitle}
              </h2>
              <div className="mx-auto mt-2 h-0.5 w-16 rounded-full bg-[#1ed760]/50" aria-hidden />
              {sectionDescription ? (
                <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/50 sm:text-[15px]">
                  {sectionDescription}
                </p>
              ) : null}
            </div>
          ) : null}

          <div
            className={`flex w-full flex-col gap-5 ${
              fillColumn ? "max-w-none" : "w-[92%] sm:w-[88%] md:w-[85%]"
            }`}
          >
            {buttonGroups.map((group) => (
              <div key={group.id} className="flex flex-col gap-2">
                {group.title ? (
                  <div
                    className={`flex items-center gap-2 px-1 ${
                      group.id === "new" ? "text-[#1ed760]" : "text-white/50"
                    }`}
                  >
                    {group.id === "new" ? (
                      <span className="rounded-full bg-[#1ed760] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-black">
                        Novo
                      </span>
                    ) : null}
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.14em]">
                      {group.title}
                    </h3>
                    <span className="text-[11px] tabular-nums opacity-60">
                      {group.folders.length}
                    </span>
                  </div>
                ) : null}
                <div className="flex flex-col items-stretch gap-2">
                  {group.folders.map((folder) => renderFolderButton(folder))}
                </div>
              </div>
            ))}
          </div>
        </section>
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
