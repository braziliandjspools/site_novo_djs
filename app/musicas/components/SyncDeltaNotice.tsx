"use client";

import { FolderPlus, Music2, X } from "lucide-react";
import type { SyncDelta } from "../lib/sync-delta";

type SyncDeltaNoticeProps = {
  delta: SyncDelta;
  contextLabel?: string;
  onDismiss: () => void;
};

function NameList({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 text-left">
      {names.map((name) => (
        <li
          key={name}
          className="truncate rounded-md border border-[#1ed760]/20 bg-[rgba(30,215,96,0.06)] px-2.5 py-1.5 text-[12px] font-medium text-white/85"
          title={name}
        >
          {name}
        </li>
      ))}
    </ul>
  );
}

/** Painel pós-sync listando pastas/músicas novas de forma explícita. */
export function SyncDeltaNotice({
  delta,
  contextLabel = "neste nível",
  onDismiss,
}: SyncDeltaNoticeProps) {
  const folderNames = delta.newFolders.map((item) => item.name);
  const trackNames = delta.newTracks.map((item) => item.name);
  const extraFolders = Math.max(0, folderNames.length - 8);
  const extraTracks = Math.max(0, trackNames.length - 8);

  return (
    <aside
      role="status"
      aria-live="polite"
      className="mb-5 overflow-hidden rounded-2xl border border-[#1ed760]/35 bg-[#17191d] shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1ed760]">
            Resultado da sincronização
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            Novidades {contextLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar resumo da sincronização"
          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-white/20 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">
            <FolderPlus className="h-3.5 w-3.5 text-[#1ed760]" aria-hidden />
            Pastas novas · {delta.newFolders.length}
          </p>
          {folderNames.length > 0 ? (
            <>
              <NameList names={folderNames.slice(0, 8)} />
              {extraFolders > 0 ? (
                <p className="mt-2 text-[11px] text-white/40">+{extraFolders} pasta(s) além destas</p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-[12px] text-white/40">Nenhuma pasta nova neste nível.</p>
          )}
        </div>

        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">
            <Music2 className="h-3.5 w-3.5 text-[#1ed760]" aria-hidden />
            Músicas novas · {delta.newTracks.length}
          </p>
          {trackNames.length > 0 ? (
            <>
              <NameList names={trackNames.slice(0, 8)} />
              {extraTracks > 0 ? (
                <p className="mt-2 text-[11px] text-white/40">+{extraTracks} música(s) além destas</p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-[12px] text-white/40">Nenhuma música nova neste nível.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
