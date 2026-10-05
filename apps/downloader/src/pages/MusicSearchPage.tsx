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
  SkipBack,
  SkipForward,
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
        audio.dataset.trackId = track.trackId;
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
      const next = index >= 0 ? list.slice(index + 1).find((item) => item.previewAvailable) : undefined;
      if (next) {
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
  const playingIndex = playingId ? results.findIndex((track) => track.trackId === playingId) : -1;
  const prevTrack = playingIndex > 0 ? results.slice(0, playingIndex).reverse().find((track) => track.previewAvailable) : undefined;
  const nextTrack = playingIndex >= 0 ? results.slice(playingIndex + 1).find((track) => track.previewAvailable) : undefined;
  const whatsappHref = supportWhatsAppUrl(
    `Olá! Pesquisei “${query}” no BRS Downloader e não encontrei no catálogo. Podem incluir, por favor?`,
  );

  return (
    <div className={playingTrack ? "space-y-4 pb-28" : "space-y-4"}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
        <img
          src={SEARCH_BANNER_URL}
          alt="Pesquise no Downloader"
          className="h-auto w-full object-cover object-center"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
        <div className="h-px bg-gradient-to-r from-white/50 via-white/15 to-transparent" />
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Catálogo BRS</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">{t("searchTitle").replace(/^🔎\s*/, "")}</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/55">{t("searchSubtitle")}</p>
            </div>
            {results.length > 0 ? (
              <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tabular-nums text-white">
                {results.length}
              </span>
            ) : null}
          </div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-2xl border border-white/12 bg-black py-4 pl-12 pr-12 text-[15px] text-white outline-none placeholder:text-white/35 transition focus:border-white/45 focus:ring-2 focus:ring-white/15"
              autoFocus
            />
            {draft ? (
              <button
                type="button"
                aria-label={t("searchClear")}
                onClick={() => setDraft("")}
                className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/45 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black px-4 py-16 text-sm text-white">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("searchSearching")}
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-400/25 bg-[#3a2020] px-4 py-6 text-center text-sm text-[#ffb3ba]">
          {error}
        </div>
      ) : null}

      {!loading && !error && query.length < 2 ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-black px-4 py-16 text-center text-sm text-white/50">
          {t("searchIdle")}
        </div>
      ) : null}

      {!loading && !error && query.length >= 2 && results.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black px-4 py-12 text-center">
          <p className="text-sm text-white/70">{t("searchEmpty", { query })}</p>
          <p className="mx-auto mt-2 max-w-md text-xs text-white/40">{t("searchEmptyHint")}</p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => {
              event.preventDefault();
              void openPlatform(whatsappHref);
            }}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-black transition hover:bg-white/90"
          >
            <MessageCircle className="h-4 w-4" />
            {t("searchRequestWhatsApp")}
          </a>
        </div>
      ) : null}

      {!loading && results.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/5 hover:text-white"
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

          <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
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
                  className={`px-3 py-3 transition-colors ${
                    active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={selected ? t("searchClearSelection") : t("searchSelectAll")}
                      onClick={() => toggleSelected(track.trackId)}
                      disabled={!track.downloadAvailable}
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-white/45 disabled:opacity-30"
                    >
                      {selected ? <CheckSquare className="h-4 w-4 text-white" /> : <Square className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      className="relative shrink-0"
                      onClick={() => void playTrack(track)}
                      disabled={!track.previewAvailable}
                      aria-label={playing ? t("searchPause") : t("searchPlay")}
                    >
                      <CoverArt track={track} apiBase={apiBase} cover={cover} size="sm" />
                      <span className={`absolute inset-0 flex items-center justify-center rounded-[var(--radius-md)] bg-black/50 transition ${playing || active ? "opacity-100" : "opacity-0 hover:opacity-100"}`}>
                        {playing ? (
                          <Pause className="h-4 w-4 text-white" fill="currentColor" />
                        ) : (
                          <Play className="ml-0.5 h-4 w-4 text-white" fill="currentColor" />
                        )}
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.95rem] font-semibold text-white">{track.title}</p>
                      <p className="truncate text-xs text-white/60">{track.artist}</p>
                      <p className="mt-0.5 truncate text-[11px] text-white/35">
                        {[track.version, metaLine(track), collection].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {catalogUrl ? (
                        <button
                          type="button"
                          onClick={() => void openPlatform(catalogUrl)}
                          className="hidden h-9 items-center gap-1 rounded-lg border border-white/12 px-2 text-[10px] font-bold uppercase tracking-[0.06em] text-white/70 hover:bg-white/10 hover:text-white sm:inline-flex"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t("searchOpenCatalog")}
                        </button>
                      ) : null}
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
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {playingTrack ? (
        <div className="fixed bottom-0 left-[248px] right-0 z-40 border-t border-white/15 bg-black/95 px-5 py-3.5 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/50 via-white/15 to-transparent" />
          <div className="relative flex items-center gap-4">
            <CoverArt track={playingTrack} apiBase={apiBase} size="md" />
            <div className="min-w-0 w-44 shrink-0 sm:w-56">
              <p className="truncate text-sm font-semibold text-white">{playingTrack.title}</p>
              <p className="truncate text-xs text-white/50">{playingTrack.artist}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={!prevTrack}
                  onClick={() => prevTrack && void playTrack(prevTrack)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
                  aria-label={t("searchPrev")}
                >
                  <SkipBack className="h-4 w-4" fill="currentColor" />
                </button>
                <button
                  type="button"
                  onClick={() => void playTrack(playingTrack)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black hover:bg-white/90"
                  aria-label={isPlaying ? t("searchPause") : t("searchPlay")}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" fill="currentColor" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={!nextTrack}
                  onClick={() => nextTrack && void playTrack(nextTrack)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
                  aria-label={t("searchNext")}
                >
                  <SkipForward className="h-4 w-4" fill="currentColor" />
                </button>
              </div>
              <div className="flex items-center gap-3">
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
                  className="player-range flex-1"
                  aria-label={t("searchProgress")}
                  style={{ background: `linear-gradient(to right, #fff ${progress}%, rgba(255,255,255,0.14) ${progress}%)` }}
                />
                <span className="w-10 text-right text-[10px] tabular-nums text-white/40">
                  {formatTrackDuration(duration) ?? "--:--"}
                </span>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setMuted((value) => !value)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
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
                className="player-range w-24"
                aria-label={t("searchVolume")}
              />
              <button
                type="button"
                onClick={stopPlayback}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white"
                aria-label={t("searchStop")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
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
  const box = size === "md" ? "h-16 w-16 shadow-[0_8px_24px_rgba(0,0,0,0.45)]" : "h-11 w-11";

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
