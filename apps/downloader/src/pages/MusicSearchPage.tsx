import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckSquare,
  Download,
  ExternalLink,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  Search,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";
import { useDownloadManager } from "../context/DownloadManagerContext";
import { createJob } from "../lib/api/jobs";
import {
  buildAuthorizedStreamUrl,
  DEFAULT_TRACK_COVER,
  formatTrackDuration,
  resolveCatalogUrl,
  resolveCoverUrl,
  searchMusicCatalog,
  type MusicSearchTrack,
} from "../lib/api/music-search";
import { getCachedApiBaseUrl } from "../lib/api/config";
import { formatApiError } from "../lib/errors";
import { openPlatform } from "../lib/open-site";
import { supportWhatsAppUrl } from "../lib/site";
import { useLocale } from "../i18n/LocaleContext";

const DEBOUNCE_MS = 420;
const PAGE_SIZE = 24;
const SEARCH_BANNER_URL =
  "https://pub-169b30d0b1454cd1abcbcc7f2a4d3a5f.r2.dev/banners/cf5a5a0a-a57e-4b94-9e2a-fa5bc1488305.png";

function metaLine(track: MusicSearchTrack) {
  const bits: string[] = [];
  if (track.bpm) bits.push(`${track.bpm} BPM`);
  const duration = formatTrackDuration(track.duration);
  if (duration) bits.push(duration);
  if (track.year) bits.push(String(track.year));
  if (track.genre) bits.push(track.genre);
  return bits.join(" • ");
}

export function MusicSearchPage() {
  const { t } = useLocale();
  const { sessionToken, device } = useAuth();
  const { syncNow } = useDownloadManager();
  const { showToast } = useToast();

  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicSearchTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queuedIds, setQueuedIds] = useState<Set<string>>(() => new Set());
  const [queueBusyId, setQueueBusyId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<MusicSearchTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestIdRef = useRef(0);
  const showToastRef = useRef(showToast);
  const resultsRef = useRef<MusicSearchTrack[]>([]);
  const sessionTokenRef = useRef(sessionToken);
  const playTrackRef = useRef<(track: MusicSearchTrack) => Promise<void>>(async () => undefined);
  showToastRef.current = showToast;
  resultsRef.current = results;
  sessionTokenRef.current = sessionToken;

  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(draft.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [draft]);

  useEffect(() => {
    if (!sessionToken) return;
    if (query.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      setSelectedIds(new Set());
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    void searchMusicCatalog(sessionToken, query, PAGE_SIZE)
      .then((body) => {
        if (requestId !== requestIdRef.current) return;
        setResults(body.results ?? []);
        setSelectedIds(new Set());
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        setResults([]);
        setSelectedIds(new Set());
        setError(formatApiError(err));
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [query, sessionToken]);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setPlayingId(null);
    setPlayingTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const playTrack = useCallback(
    async (track: MusicSearchTrack) => {
      const token = sessionTokenRef.current;
      if (!token || !track.previewAvailable) return;
      const audio = audioRef.current;
      if (!audio) return;

      if (playingId === track.trackId) {
        if (audio.paused) {
          try {
            await audio.play();
          } catch (err) {
            showToast(formatApiError(err), "error");
          }
        } else {
          audio.pause();
        }
        return;
      }

      try {
        const streamId = track.previewTrackId || track.trackId;
        const url = await buildAuthorizedStreamUrl(streamId, token);
        audio.pause();
        audio.src = url;
        setPlayingId(track.trackId);
        setPlayingTrack(track);
        setCurrentTime(0);
        setDuration(0);
        await audio.play();
      } catch (err) {
        showToast(formatApiError(err), "error");
        stopPlayback();
      }
    },
    [playingId, showToast, stopPlayback],
  );
  playTrackRef.current = playTrack;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onMeta = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      const list = resultsRef.current;
      const currentId = audio.dataset.trackId;
      const index = list.findIndex((item) => item.trackId === currentId);
      const next = index >= 0 ? list[index + 1] : null;
      if (next?.previewAvailable) {
        void playTrackRef.current(next);
        return;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setPlayingId(null);
      setPlayingTrack(null);
    };

    const onError = () => {
      const code = audio.error?.code;
      const detail =
        code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? "Formato ou URL de áudio não suportados."
          : code === MediaError.MEDIA_ERR_NETWORK
            ? "Falha de rede ao carregar o áudio."
            : "Não foi possível reproduzir esta faixa.";
      showToastRef.current(detail, "error");
      setPlayingId(null);
      setPlayingTrack(null);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [muted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId) audio.dataset.trackId = playingId;
    else delete audio.dataset.trackId;
  }, [playingId]);

  async function queueTrack(track: MusicSearchTrack) {
    if (!sessionToken || !device) {
      showToast(t("searchLoginRequired"), "error");
      return;
    }
    if (!track.downloadAvailable) return;
    if (queuedIds.has(track.trackId) || queueBusyId === track.trackId) return;

    setQueueBusyId(track.trackId);
    try {
      await createJob(sessionToken, {
        fileId: track.trackId,
        fileName: track.fileName,
        relativePath: track.relativePath || null,
        targetDeviceId: device.deviceId,
        provider: track.provider || "google_drive",
      });
      setQueuedIds((current) => new Set(current).add(track.trackId));
      syncNow();
      showToast(t("searchQueued"), "success");
    } catch (err) {
      showToast(formatApiError(err), "error");
    } finally {
      setQueueBusyId(null);
    }
  }

  async function queueSelected() {
    if (!sessionToken || !device) {
      showToast(t("searchLoginRequired"), "error");
      return;
    }
    const tracks = results.filter(
      (track) => selectedIds.has(track.trackId) && track.downloadAvailable && !queuedIds.has(track.trackId),
    );
    if (tracks.length === 0) return;

    setBulkBusy(true);
    let ok = 0;
    try {
      for (const track of tracks) {
        try {
          await createJob(sessionToken, {
            fileId: track.trackId,
            fileName: track.fileName,
            relativePath: track.relativePath || null,
            targetDeviceId: device.deviceId,
            provider: track.provider || "google_drive",
          });
          setQueuedIds((current) => new Set(current).add(track.trackId));
          ok += 1;
        } catch (err) {
          showToast(formatApiError(err), "error");
        }
      }
      if (ok > 0) {
        syncNow();
        showToast(ok === 1 ? t("searchQueued") : t("searchQueuedMany", { count: ok }), "success");
        setSelectedIds(new Set());
      }
    } finally {
      setBulkBusy(false);
    }
  }

  function toggleSelected(trackId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }

  function toggleSelectAll() {
    const downloadable = results.filter((track) => track.downloadAvailable).map((track) => track.trackId);
    const allSelected = downloadable.length > 0 && downloadable.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(downloadable));
  }

  const apiBase = getCachedApiBaseUrl();
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const selectedCount = selectedIds.size;
  const whatsappHref = supportWhatsAppUrl(
    `Olá! Pesquisei “${query}” no BRS Downloader e não encontrei no catálogo. Podem incluir, por favor?`,
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
        <img
          src={SEARCH_BANNER_URL}
          alt="Pesquise no Downloader"
          className="h-auto w-full object-cover object-center"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212] shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
        <div className="h-px bg-gradient-to-r from-[#14532d] via-[#1f6b3a]/80 to-transparent" />
        <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#86efac]/80">Catálogo BRS</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">{t("searchTitle").replace(/^🔎\s*/, "")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{t("searchSubtitle")}</p>
          </div>
          {results.length > 0 ? (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white/70">
              {results.length}
            </span>
          ) : null}
        </div>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] py-3 pl-11 pr-11 text-sm text-white outline-none placeholder:text-white/35 transition-colors focus:border-[#1f6b3a] focus:bg-[#101610] focus:ring-1 focus:ring-[#14532d]/60"
            autoFocus
          />
          {draft ? (
            <button
              type="button"
              aria-label={t("searchClear")}
              onClick={() => setDraft("")}
              className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          </label>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-12 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          {t("searchSearching")}
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-400/25 bg-[#3a2020] px-4 py-6 text-center text-sm text-[#ffb3ba]">
          {error}
        </div>
      ) : null}

      {!loading && !error && query.length < 2 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#141414] px-4 py-12 text-center text-sm text-white/45">
          {t("searchIdle")}
        </div>
      ) : null}

      {!loading && !error && query.length >= 2 && results.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-10 text-center">
          <p className="text-sm text-white/60">{t("searchEmpty", { query })}</p>
          <p className="mx-auto mt-2 max-w-md text-xs text-white/40">{t("searchEmptyHint")}</p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => {
              event.preventDefault();
              void openPlatform(whatsappHref);
            }}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-[#052e16] transition hover:bg-[#3be07a]"
          >
            <MessageCircle className="h-4 w-4" />
            {t("searchRequestWhatsApp")}
          </a>
        </div>
      ) : null}

      {!loading && results.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#1a1a1a] px-3 py-2.5">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-white/55 transition hover:bg-white/5 hover:text-white"
            >
              {selectedCount > 0 &&
              results.filter((track) => track.downloadAvailable).every((track) => selectedIds.has(track.trackId)) ? (
                <CheckSquare className="h-4 w-4 text-white" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedCount > 0 ? t("searchClearSelection") : t("searchSelectAll")}
            </button>
            <Button
              type="button"
              className="h-9 gap-1.5 px-3 text-xs"
              disabled={selectedCount === 0 || bulkBusy}
              onClick={() => void queueSelected()}
            >
              {bulkBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {t("searchDownloadSelected", { count: selectedCount })}
            </Button>
          </div>

          <ul className="space-y-2">
            {results.map((track) => {
              const cover = resolveCoverUrl(track.coverUrl, apiBase);
              const catalogUrl = resolveCatalogUrl(track.catalogPath, apiBase);
              const playing = playingId === track.trackId && isPlaying;
              const active = playingId === track.trackId;
              const queued = queuedIds.has(track.trackId);
              const busy = queueBusyId === track.trackId;
              const selected = selectedIds.has(track.trackId);
              const collection = track.collectionLabel || track.relativePath || "BRS";
              return (
                <li
                  key={`${track.source}-${track.trackId}`}
                  className={`rounded-2xl border px-3 py-3 transition-colors ${
                    active
                      ? "border-[#1a4d32] bg-[#10281c]"
                      : "border-white/10 bg-[#141414] hover:border-[#163d28] hover:bg-[#0e2218]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      aria-label={selected ? t("searchClearSelection") : t("searchSelectAll")}
                      onClick={() => toggleSelected(track.trackId)}
                      disabled={!track.downloadAvailable}
                      className="mt-2 inline-flex h-5 w-5 shrink-0 items-center justify-center text-white/45 disabled:opacity-30"
                    >
                      {selected ? <CheckSquare className="h-4 w-4 text-white" /> : <Square className="h-4 w-4" />}
                    </button>
                    <CoverArt track={track} apiBase={apiBase} cover={cover} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.92rem] font-semibold text-white">{track.title}</p>
                      <p className="truncate text-xs text-white/55">{track.artist}</p>
                      <p className="mt-0.5 truncate text-[11px] text-white/35">
                        {[track.version, metaLine(track)].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-[11px] text-white/40">
                          <span className="font-semibold text-white/60">{t("searchCollection")}:</span> {collection}
                        </span>
                        {catalogUrl ? (
                          <button
                            type="button"
                            onClick={() => void openPlatform(catalogUrl)}
                            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white/80 transition hover:bg-white/10"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t("searchOpenCatalog")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 gap-1.5 px-2.5 text-xs"
                        onClick={() => void playTrack(track)}
                        disabled={!track.previewAvailable}
                      >
                        {playing ? (
                          <Pause className="h-3.5 w-3.5" fill="currentColor" />
                        ) : (
                          <Play className="h-3.5 w-3.5" fill="currentColor" />
                        )}
                        {playing ? t("searchPause") : t("searchPlay")}
                      </Button>
                      <Button
                        type="button"
                        className="h-9 gap-1.5 px-2.5 text-xs"
                        onClick={() => void queueTrack(track)}
                        disabled={!track.downloadAvailable || queued || busy}
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        {queued ? t("searchAlreadyQueued") : t("searchDownload")}
                      </Button>
                    </div>
                  </div>

                  {active && playingTrack ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3">
                      <div className="flex items-center gap-3">
                        <CoverArt track={playingTrack} apiBase={apiBase} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{playingTrack.title}</p>
                          <p className="truncate text-xs text-white/45">{playingTrack.artist}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void playTrack(playingTrack)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#2a2a2a] text-white hover:bg-[#333]"
                          aria-label={isPlaying ? t("searchPause") : t("searchPlay")}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" fill="currentColor" />
                          ) : (
                            <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMuted((value) => !value)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-[#222] text-white/60 hover:text-white"
                          aria-label={muted ? t("searchUnmute") : t("searchMute")}
                        >
                          {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={muted ? 0 : volume}
                          onChange={(event) => {
                            setMuted(false);
                            setVolume(Number(event.target.value));
                          }}
                          className="hidden w-24 accent-white sm:block"
                          aria-label={t("searchVolume")}
                        />
                        <button
                          type="button"
                          onClick={stopPlayback}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-[#222] text-white/45 hover:text-white"
                          aria-label={t("searchStop")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="w-10 text-[10px] tabular-nums text-white/40">
                          {formatTrackDuration(currentTime) ?? "0:00"}
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={duration || 0}
                          step={0.1}
                          value={Math.min(currentTime, duration || 0)}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            const audio = audioRef.current;
                            if (!audio) return;
                            audio.currentTime = next;
                            setCurrentTime(next);
                          }}
                          className="h-1.5 flex-1 accent-white"
                          aria-label={t("searchProgress")}
                          style={{ backgroundSize: `${progress}% 100%` }}
                        />
                        <span className="w-10 text-right text-[10px] tabular-nums text-white/40">
                          {formatTrackDuration(duration) ?? "--:--"}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CoverArt({
  track,
  apiBase,
  cover,
  size,
}: {
  track: MusicSearchTrack;
  apiBase: string;
  cover?: string | null;
  size: "sm" | "md";
}) {
  const fallback = resolveCoverUrl(DEFAULT_TRACK_COVER, apiBase);
  const [src, setSrc] = useState(cover ?? resolveCoverUrl(track.coverUrl, apiBase) ?? fallback);
  const box = size === "md" ? "h-12 w-12" : "h-11 w-11";

  useEffect(() => {
    setSrc(cover ?? resolveCoverUrl(track.coverUrl, apiBase) ?? fallback);
  }, [apiBase, cover, fallback, track.coverUrl]);

  return (
    <img
      src={src}
      alt=""
      className={`${box} shrink-0 rounded-[var(--radius-md)] object-cover`}
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}
