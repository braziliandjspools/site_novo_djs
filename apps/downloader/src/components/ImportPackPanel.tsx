import { useState } from "react";
import { CheckCircle2, Link2, Loader2, Download } from "lucide-react";
import { Button } from "./ui/Button";
import { Panel } from "./ui/Panel";
import { useAuth } from "../context/AuthContext";
import { useDownloadManager } from "../context/DownloadManagerContext";
import { importPackLink, parsePackLinkInput, previewPackLink, stripForcedFolderTreePrefix, type PackPreview } from "../lib/api/pack-import";
import { formatApiError } from "../lib/errors";
import { useLocale } from "../i18n/LocaleContext";

export function ImportPackPanel() {
  const { t } = useLocale();
  const { sessionToken } = useAuth();
  const { syncNow } = useDownloadManager();
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<PackPreview | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleValidate() {
    if (!sessionToken) {
      setError(t("importLoginRequired"));
      return;
    }
    const parsed = parsePackLinkInput(url);
    if (!parsed) {
      setError(t("importInvalidLink"));
      setPreview(null);
      return;
    }

    setValidating(true);
    setError(null);
    setSuccess(null);
    setPreview(null);
    try {
      const result = await previewPackLink(sessionToken, url);
      setPreview(result);
      if (result.trackCount === 0) {
        setError(t("importNoTracks"));
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setValidating(false);
    }
  }

  async function handleImport() {
    if (!sessionToken || !preview) return;
    setImporting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await importPackLink(sessionToken, preview.slug, {
        root: preview.root === "colecoes" ? "colecoes" : "vip",
      });
      setSuccess(
        result.count === 1
          ? t("importAddedOne")
          : t("importAddedMany", { count: result.count }),
      );
      syncNow();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <Panel title={t("importTitle")} description={t("importPanelDesc")}>
      <div className="space-y-3">
        <label htmlFor="pack-link" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
          {t("importFolderLink")}
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              id="pack-link"
              type="url"
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
              {stripForcedFolderTreePrefix(preview.relativePath) || preview.relativePath}
            </p>
            <p className="mt-3 text-lg font-black tabular-nums text-[#1db954]">
              {preview.trackCount}{" "}
              <span className="text-sm font-semibold text-zinc-400">
                {preview.trackCount === 1 ? t("importTrackSingular") : t("importTrackPlural")}
              </span>
            </p>
            {preview.sampleTitles.length > 0 && (
              <ul className="mt-2 space-y-1 text-[11px] text-zinc-500">
                {preview.sampleTitles.map((title) => (
                  <li key={title} className="truncate">
                    · {title}
                  </li>
                ))}
                {preview.trackCount > preview.sampleTitles.length && (
                  <li className="text-zinc-600">
                    ·{" "}
                    {t("importAndMore", {
                      count: preview.trackCount - preview.sampleTitles.length,
                    })}
                  </li>
                )}
              </ul>
            )}
            <Button
              className="mt-4 w-full"
              disabled={importing || preview.trackCount === 0}
              onClick={() => void handleImport()}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t("importDownloadAll")}
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}
