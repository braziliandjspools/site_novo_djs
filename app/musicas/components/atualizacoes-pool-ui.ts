/** Classes compartilhadas — visual tipo DJ Pool (tema escuro BRS). */

export const poolPanelClass =
  "overflow-hidden rounded-md border border-zinc-700/70 bg-black shadow-[0_1px_0_rgba(255,255,255,0.03)]";

export const poolPanelHeaderClass =
  "flex flex-wrap items-center justify-between gap-3 border-b border-zinc-700/70 bg-[#111111] px-3 py-3 sm:px-4";

export const poolTableHeadClass =
  "grid items-center gap-x-3 border-b border-zinc-700/60 bg-[#0a0a0a] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 sm:px-4";

export const poolRowBaseClass =
  "grid items-center gap-x-3 border-b border-zinc-600 px-3 py-2.5 transition-colors last:border-b-0 sm:px-4";

/** Botões de ação nas linhas de pasta (Downloader / copiar). */
export const folderActionSendClass =
  "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#1ed760]/45 bg-[#1ed760]/20 text-[#1ed760] transition-colors hover:bg-[#1ed760]/35 hover:text-[#7dffb0] disabled:cursor-not-allowed disabled:opacity-50";

export const folderActionCopyClass =
  "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border border-sky-500/45 bg-sky-500/20 text-sky-400 transition-colors hover:bg-sky-500/35 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50";

/** Zebrado: preto × cinza mais escuro. */
export function poolRowTone(index: number, active = false) {
  if (active) return "bg-[#1ed760]/10 hover:bg-[#1ed760]/15";
  return index % 2 === 0
    ? "bg-black hover:bg-[#141414]"
    : "bg-[#1a1a1a] hover:bg-[#222222]";
}
