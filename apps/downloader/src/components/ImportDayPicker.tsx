import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { browsePackDay, type PackDateOption, type PackDayContents, type PackImportTarget } from "../lib/api/pack-import";
import { formatApiError } from "../lib/errors";
import { useLocale } from "../i18n/LocaleContext";

function styleLabel(name: string) {
  const value = name.trim();
  if (!value || value.includes("/") || !value.includes(" - ")) return value;
  return value
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}

function joinPath(...parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join("/");
}

export function ImportDayPicker({
  token,
  dates,
  rootIsDate,
  onClose,
  onConfirm,
}: {
  token: string;
  dates: PackDateOption[];
  rootIsDate: boolean;
  onClose: () => void;
  onConfirm: (targets: PackImportTarget[]) => void;
}) {
  const { t } = useLocale();
  const [activeKey, setActiveKey] = useState(dates[0]?.key ?? "");
  const [contents, setContents] = useState<Record<string, PackDayContents>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, true>>({});
  const [error, setError] = useState<string | null>(null);

  async function loadDay(date: PackDateOption) {
    setActiveKey(date.key);
    if (contents[date.key]) return;
    setLoading(date.key);
    setError(null);
    try {
      const result = await browsePackDay(token, date.folderId);
      setContents((current) => ({
        ...current,
        [date.key]: {
          pools: result.pools ?? [],
          styles: result.styles ?? [],
          poolCount: result.poolCount ?? result.pools?.length ?? 0,
          trackCount: result.trackCount ?? 0,
        },
      }));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(null);
    }
  }

  useEffect(() => {
    const first = dates[0];
    if (!first) return;
    void loadDay(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function mark(ids: string[], on: boolean) {
    setSelected((current) => {
      const next = { ...current };
      for (const id of ids) {
        if (on) next[id] = true;
        else delete next[id];
      }
      return next;
    });
  }

  function confirm() {
    const targets: PackImportTarget[] = [];
    for (const date of dates) {
      const day = contents[date.key];
      if (!day) continue;
      const dayPrefix = rootIsDate ? "" : date.name;
      for (const pool of day.pools) {
        const marked = pool.styles.filter((style) => selected[style.folderId]);
        if (marked.length === 0) continue;
        if (marked.length === pool.styles.length) {
          targets.push({
            folderId: pool.folderId,
            folderName: pool.name,
            relativePath: joinPath(dayPrefix, pool.name),
          });
          continue;
        }
        for (const style of marked) {
          targets.push({
            folderId: style.folderId,
            folderName: style.name,
            relativePath: joinPath(dayPrefix, pool.name, style.name),
          });
        }
      }
      for (const style of day.styles) {
        if (!selected[style.folderId]) continue;
        targets.push({
          folderId: style.folderId,
          folderName: style.name,
          relativePath: joinPath(dayPrefix, style.name),
        });
      }
    }
    if (targets.length === 0) {
      setError(t("importPickEmpty"));
      return;
    }
    onConfirm(targets);
  }

  const active = dates.find((date) => date.key === activeKey) ?? dates[0];
  const day = active ? contents[active.key] : undefined;
  const poolCount = day?.poolCount ?? day?.pools.length ?? 0;
  const trackCount = day?.trackCount ?? 0;

  const dialog = (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-pick-title"
        className="flex max-h-[calc(100dvh-3rem)] w-[min(920px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-[#ffffff]/50 bg-black text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
      >
      <header className="flex shrink-0 items-center gap-3 border-b border-[#ffffff]/30 bg-[#070707] px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ffffff]">Dias</p>
          <h2 id="import-pick-title" className="truncate text-sm font-bold text-white">
            {t("importPickTitle")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("importPickCancel")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:bg-[#3a3a3a] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[220px] flex-shrink-0 flex-col border-r border-[#ffffff]/30 bg-[#070707]">
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {dates.map((date) => {
              const on = date.key === active?.key;
              return (
                <button
                  key={date.key}
                  type="button"
                  onClick={() => void loadDay(date)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-mono text-sm ${
                    on ? "bg-[#2f2f2f] font-bold text-white" : "text-zinc-300 hover:bg-[#ffffff]/15"
                  }`}
                >
                  {date.label}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-black">
          <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#ffffff]/30 px-5 py-4">
            <div>
              <p className="font-mono text-2xl font-black tracking-tight text-[#ffffff]">{active?.label}</p>
              <p className="mt-1 text-sm text-zinc-300">
                {loading === active?.key ? (
                  "Contando faixas e pools…"
                ) : (
                  <>
                    <span className="font-bold text-white">{trackCount}</span> tracks ·{" "}
                    <span className="font-bold text-white">{poolCount}</span> pools
                  </>
                )}
              </p>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-zinc-500">{t("importPickHint")}</p>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {loading === active?.key && (
              <p className="flex items-center gap-2 text-sm text-[#ffffff]">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("importPickLoadingDay")}
              </p>
            )}
            {day && (
              <button
                type="button"
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffffff]"
                onClick={() => {
                  const ids = [
                    ...day.pools.flatMap((pool) => pool.styles.map((style) => style.folderId)),
                    ...day.styles.map((style) => style.folderId),
                  ];
                  mark(ids, !(ids.length > 0 && ids.every((id) => selected[id])));
                }}
              >
                {t("importPickDayAll")}
              </button>
            )}
            {day?.pools.map((pool) => {
              const ids = pool.styles.map((style) => style.folderId);
              const allOn = ids.length > 0 && ids.every((id) => selected[id]);
              return (
                <div key={pool.folderId} className="rounded-xl border border-white/10 bg-[#0c0c0c] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-white">
                      {styleLabel(pool.name)}
                      <span className="ml-2 font-mono text-[10px] font-semibold text-[#ffffff]">
                        {pool.trackCount ?? 0} tracks
                      </span>
                    </p>
                    <button
                      type="button"
                      className="text-[11px] font-bold uppercase tracking-wider text-[#ffffff]"
                      onClick={() => mark(ids, !allOn)}
                    >
                      {t("importPickAllStyles")}
                    </button>
                  </div>
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {pool.styles.map((style) => (
                      <label key={style.folderId} className="flex items-start gap-2 text-xs text-zinc-200">
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-[#ffffff]"
                          checked={Boolean(selected[style.folderId])}
                          onChange={(event) => mark([style.folderId], event.target.checked)}
                        />
                        <span>
                          {styleLabel(style.name)}
                          <span className="ml-1 text-zinc-500">{style.trackCount ?? 0}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            {day && day.styles.length > 0 && (
              <div className="space-y-1">
                {day.styles.map((style) => (
                  <label key={style.folderId} className="flex items-start gap-2 text-xs text-zinc-200">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-[#ffffff]"
                      checked={Boolean(selected[style.folderId])}
                      onChange={(event) => mark([style.folderId], event.target.checked)}
                    />
                    <span>
                      {styleLabel(style.name)}
                      <span className="ml-1 text-zinc-500">{style.trackCount ?? 0}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {error && <p className="rounded-lg bg-[#ffffff]/10 px-3 py-2 text-xs text-[#ffb3ba]">{error}</p>}
          </div>

          <div className="flex shrink-0 gap-2 border-t border-[#ffffff]/30 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-white/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300"
            >
              {t("importPickCancel")}
            </button>
            <button
              type="button"
              onClick={confirm}
              className="flex-1 rounded-full bg-[#2f2f2f] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
            >
              {t("importPickConfirm")}
            </button>
          </div>
        </section>
      </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return dialog;
  return createPortal(dialog, document.body);
}
