/** Classes compartilhadas — visual tipo DJ Pool (tema escuro BRS). */

export const poolPanelClass =
  "player-shell overflow-hidden rounded-[var(--radius-panel)] border border-white/[0.08]";

export const poolPanelHeaderClass =
  "flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.02] px-3 py-3 sm:px-4";

export const poolTableHeadClass =
  "grid items-center gap-x-3 border-b border-white/[0.06] bg-black/40 px-3 py-2 text-[11px] font-medium tracking-[-0.01em] text-zinc-500 sm:px-4";

export const poolRowBaseClass =
  "grid items-center gap-x-3 border-b border-white/[0.05] px-3 py-2.5 transition-colors last:border-b-0 sm:px-4";

/** Botões de ação nas linhas de pasta (Downloader / copiar). */
export const folderActionSendClass =
  "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#1ed760]/45 bg-[#1ed760]/20 text-[#1ed760] transition-colors hover:bg-[#1ed760]/35 hover:text-[#7dffb0] disabled:cursor-not-allowed disabled:opacity-50";

export const folderActionCopyClass =
  "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-sky-500/45 bg-sky-500/20 text-sky-400 transition-colors hover:bg-sky-500/35 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50";

/** Zebrado: preto × cinza mais escuro. */
export function poolRowTone(index: number, active = false) {
  if (active) return "player-track-row-active";
  return index % 2 === 0
    ? "bg-black/50 hover:bg-white/[0.03]"
    : "bg-white/[0.015] hover:bg-white/[0.04]";
}
