import { useState } from "react";
import { Loader2 } from "lucide-react";
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
  const [openDays, setOpenDays] = useState<string[]>([]);
  const [contents, setContents] = useState<Record<string, PackDayContents>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, true>>({});
  const [error, setError] = useState<string | null>(null);

  async function toggleDay(date: PackDateOption) {
    if (openDays.includes(date.key)) {
      setOpenDays((current) => current.filter((key) => key !== date.key));
      return;
    }
    setOpenDays((current) => [...current, date.key]);
    if (contents[date.key]) return;
    setLoading(date.key);
    setError(null);
    try {
      const result = await browsePackDay(token, date.folderId);
      setContents((current) => ({
        ...current,
        [date.key]: { pools: result.pools ?? [], styles: result.styles ?? [] },
      }));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(null);
    }
  }

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

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-pick-title"
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#121212] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <h2 id="import-pick-title" className="text-base font-bold text-white">
            {t("importPickTitle")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{t("importPickHint")}</p>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {dates.map((date) => {
            const open = openDays.includes(date.key);
            const day = contents[date.key];
            return (
              <section key={date.key} className="rounded-xl border border-white/10 bg-black/30">
                <button
                  type="button"
                  onClick={() => void toggleDay(date)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                >
                  <span className="font-mono text-sm font-bold text-[#1ed760]">{date.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">{open ? "–" : "+"}</span>
                </button>
                {open && (
                  <div className="space-y-3 border-t border-white/10 px-3 py-3">
                    {loading === date.key && (
                      <p className="flex items-center gap-2 text-xs text-zinc-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t("importPickLoadingDay")}
                      </p>
                    )}
                    {day && (
                      <button
                        type="button"
                        className="text-[11px] font-semibold uppercase tracking-wider text-[#1ed760]"
                        onClick={() => {
                          const ids = [
                            ...day.pools.flatMap((pool) => pool.styles.map((style) => style.folderId)),
                            ...day.styles.map((style) => style.folderId),
                          ];
                          const allOn = ids.length > 0 && ids.every((id) => selected[id]);
                          mark(ids, !allOn);
                        }}
                      >
                        {t("importPickDayAll")}
                      </button>
                    )}
                    {day?.pools.map((pool) => {
                      const ids = pool.styles.map((style) => style.folderId);
                      const allOn = ids.length > 0 && ids.every((id) => selected[id]);
                      return (
                        <div key={pool.folderId}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">{styleLabel(pool.name)}</p>
                            <button
                              type="button"
                              className="text-[11px] font-semibold text-[#1ed760]"
                              onClick={() => mark(ids, !allOn)}
                            >
                              {t("importPickAllStyles")}
                            </button>
                          </div>
                          <div className="mt-1.5 space-y-1">
                            {pool.styles.map((style) => (
                              <label key={style.folderId} className="flex items-start gap-2 text-xs text-zinc-200">
                                <input
                                  type="checkbox"
                                  className="mt-0.5 accent-[#1ed760]"
                                  checked={Boolean(selected[style.folderId])}
                                  onChange={(event) => mark([style.folderId], event.target.checked)}
                                />
                                <span>{styleLabel(style.name)}</span>
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
                              className="mt-0.5 accent-[#1ed760]"
                              checked={Boolean(selected[style.folderId])}
                              onChange={(event) => mark([style.folderId], event.target.checked)}
                            />
                            <span>{styleLabel(style.name)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300"
          >
            {t("importPickCancel")}
          </button>
          <button
            type="button"
            onClick={confirm}
            className="flex-1 rounded-full bg-[#1ed760] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black"
          >
            {t("importPickConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
