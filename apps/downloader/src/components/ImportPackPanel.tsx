import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleHelp, Link2, Loader2, Download } from "lucide-react";
import { Button } from "./ui/Button";
import { Panel } from "./ui/Panel";
import { useAuth } from "../context/AuthContext";
import { useDownloadManager } from "../context/DownloadManagerContext";
import { importPackLink, previewPackLink, stripForcedFolderTreePrefix, type PackImportTarget, type PackPreview } from "../lib/api/pack-import";
import { ImportDayPicker } from "./ImportDayPicker";
import { formatApiError } from "../lib/errors";
import { useLocale } from "../i18n/LocaleContext";

const IMPORT_BLOCK = 200;
const IMPORT_BURST = 600;
const IMPORT_PAUSE_MS = 8 * 60 * 1000;

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function ImportPackPanel({ embedded = false }: { embedded?: boolean }) {
  const { t } = useLocale();
  const { sessionToken } = useAuth();
  const { syncNow } = useDownloadManager();
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<PackPreview | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [queued, setQueued] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [helpOpen, setHelpOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const cancelRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleValidate() {
    if (!sessionToken) {
      setError(t("importLoginRequired"));
      return;
    }
    const trimmed = url.trim();
    if (!trimmed) {
      setError(t("importInvalidLink"));
      setPreview(null);
      return;
    }

    // Sempre tenta a API (pasta ou artista). O servidor também parseia a URL.

    setValidating(true);
    setError(null);
    setSuccess(null);
    setPreview(null);
    setPickerOpen(false);
    try {
      const result = await previewPackLink(sessionToken, trimmed);
      setPreview(result);
      if ((result.dates?.length ?? 0) > 0) {
        setPickerOpen(true);
      } else if (result.trackCount === 0 && !result.hasSubfolders) {
        setError(t("importNoTracks"));
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setValidating(false);
    }
  }

  useEffect(() => {
    if (!cooldownUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  async function waitCooldown(until: number) {
    setCooldownUntil(until);
    while (!cancelRef.current && Date.now() < until) {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
    setCooldownUntil(null);
  }

  async function handleImport(targets?: PackImportTarget[]) {
    if (!sessionToken || !preview || importing) return;
    cancelRef.current = false;
    setImporting(true);
    setPickerOpen(false);
    setError(null);
    setSuccess(null);
    setQueued(0);
    try {
      let offset = 0;
      let totalQueued = 0;
      let total = preview.trackCount;
      while (!cancelRef.current) {
        const result = await importPackLink(sessionToken, url.trim() || preview.slug, {
          root: preview.root === "colecoes" ? "colecoes" : "vip",
          kind: preview.kind === "artist" ? "artist" : "pack",
          offset,
          limit: IMPORT_BLOCK,
          targets,
        });
        total = result.trackCount || total;
        totalQueued += result.count;
        offset = result.nextOffset ?? offset + result.count;
        setQueued(totalQueued);
        syncNow();
        if (!result.hasMore || result.count === 0) break;
        if (totalQueued > 0 && totalQueued % IMPORT_BURST === 0) {
          await waitCooldown(Date.now() + IMPORT_PAUSE_MS);
        }
      }
      if (!cancelRef.current) {
        setSuccess(
          totalQueued === 1
            ? t("importAddedOne")
            : t("importAddedMany", { count: totalQueued }),
        );
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setImporting(false);
      setCooldownUntil(null);
    }
  }

  const cooldownLeft = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;

  const form = (
    <>
      <div className="space-y-3">
        <label htmlFor="pack-link" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
          {t("importFolderLink")}
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              id="pack-link"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setPreview(null);
                setSuccess(null);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleValidate();
                }
              }}
              placeholder={t("importPlaceholder")}
              className="w-full rounded-lg border border-zinc-800 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#1db954]"
            />
          </div>
          <Button
            variant="secondary"
            disabled={validating || !url.trim()}
            onClick={() => void handleValidate()}
            className="flex-shrink-0"
          >
            {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("importValidate")}
          </Button>
        </div>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
        {success && (
          <p className="flex items-center gap-2 rounded-lg bg-[#1db954]/10 px-3 py-2 text-xs text-[#1db954]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {success}
          </p>
        )}

        {preview && (
          <div className="rounded-xl border border-white/[0.06] bg-[#141414] px-4 py-3">
            <p className="text-sm font-bold text-white">{preview.folderName}</p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {preview.kind === "artist"
                ? t("importArtistLabel")
                : stripForcedFolderTreePrefix(preview.relativePath) || preview.relativePath}
            </p>
            <p className="mt-3 flex items-center gap-2 text-lg font-black tabular-nums text-[#1db954]">
              <span>
              {(preview.dates?.length ?? 0) > 0 ? (
                <>
                  {preview.dates?.length}{" "}
                  <span className="text-sm font-semibold text-zinc-400">{t("importDaysLabel")}</span>
                </>
              ) : preview.trackCountIsEstimate || preview.hasSubfolders ? (
                <>
                  {preview.subfolderCount && preview.subfolderCount > 0
                    ? preview.subfolderCount
                    : preview.sampleTitles.length}{" "}
                  <span className="text-sm font-semibold text-zinc-400">
                    {t("importSubfoldersFound")}
                  </span>
                </>
              ) : (
                <>
                  {preview.trackCount}{" "}
                  <span className="text-sm font-semibold text-zinc-400">
                    {preview.trackCount === 1 ? t("importTrackSingular") : t("importTrackPlural")}
                  </span>
                </>
              )}
              </span>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-zinc-300 hover:border-[#1ed760]/50 hover:text-[#1ed760]"
                aria-label={t("importBackupHelp")}
                title={t("importBackupHelp")}
              >
                <CircleHelp className="h-3.5 w-3.5" />
              </button>
            </p>
            {(preview.trackCountIsEstimate || preview.hasSubfolders) && (
              <p className="mt-1 text-[11px] text-zinc-500">{t("importTracksCountedOnImport")}</p>
            )}
            {preview.sampleTitles.length > 0 && (
              <ul className="mt-2 space-y-1 text-[11px] text-zinc-500">
                {preview.sampleTitles.map((title) => (
                  <li key={title} className="truncate">
                    · {title}
                  </li>
                ))}
                {!preview.trackCountIsEstimate &&
                  preview.trackCount > preview.sampleTitles.length && (
                  <li className="text-zinc-600">
                    ·{" "}
                    {t("importAndMore", {
                      count: preview.trackCount - preview.sampleTitles.length,
                    })}
                  </li>
                )}
              </ul>
            )}
            {cooldownLeft > 0 && (
              <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
                <p className="font-mono text-base font-bold tabular-nums text-amber-200">{formatCountdown(cooldownLeft)}</p>
                <p className="mt-1">{t("importCooldownBody")}</p>
                <p className="mt-1 text-amber-100/80">{t("importMarkOnSite")}</p>
              </div>
            )}
            {importing && queued > 0 && cooldownLeft === 0 && (
              <p className="mt-3 text-xs text-zinc-400">{t("importBatchProgress", { queued })}</p>
            )}
            <Button
              className="mt-4 w-full"
              disabled={importing || ((preview.dates?.length ?? 0) === 0 && preview.trackCount === 0 && !preview.hasSubfolders)}
              onClick={() => {
                if ((preview.dates?.length ?? 0) > 0) {
                  setPickerOpen(true);
                  return;
                }
                void handleImport();
              }}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {(preview.dates?.length ?? 0) > 0 ? t("importChooseWhat") : t("importDownloadAll")}
            </Button>
          </div>
        )}
      </div>
      {pickerOpen && preview?.dates && preview.dates.length > 0 && sessionToken && (
        <ImportDayPicker
          token={sessionToken}
          dates={preview.dates}
          rootIsDate={preview.dates.length === 1 && preview.dates[0]?.folderId === preview.folderId}
          onClose={() => setPickerOpen(false)}
          onConfirm={(targets) => void handleImport(targets)}
        />
      )}
      {helpOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" role="presentation" onClick={() => setHelpOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-5 text-sm leading-relaxed text-zinc-300 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-base font-bold text-white">{t("importBackupTitle")}</h2>
            <p className="mt-3">{t("importBackupBody")}</p>
            <a
              href="https://wa.me/5551935052274"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex font-semibold text-[#1ed760] hover:underline"
            >
              WhatsApp +55 51 93505-2274
            </a>
            <button type="button" onClick={() => setHelpOpen(false)} className="mt-4 w-full rounded-full bg-[#1ed760] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black">
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="rounded-2xl border border-white/15 bg-black/55 p-4 backdrop-blur-md">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#1ed760]">{t("importTitle")}</p>
        <p className="mt-1 text-xs text-zinc-300">{t("importPanelDesc")}</p>
        <div className="mt-3">{form}</div>
      </div>
    );
  }

  return (
    <Panel title={t("importTitle")} description={t("importPanelDesc")}>
      {form}
    </Panel>
  );
}
