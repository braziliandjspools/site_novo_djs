"use client";

import { getTrackDownloadLabel, getTrackDownloadTone } from "../lib/downloader-sync";
import { useDownloaderSync } from "./DownloaderSyncContext";

export function TrackDownloadStatus({ fileId }: { fileId: string }) {
  const sync = useDownloaderSync();
  if (!sync) return null;

  const job = sync.getJobForTrack(fileId);
  const label = getTrackDownloadLabel(job);
  if (!label) return null;

  const tone = getTrackDownloadTone(job?.status);
  const className =
    tone === "success"
      ? "bg-[#1ed760]/10 text-[#1ed760]"
      : tone === "error"
        ? "bg-red-500/10 text-red-400"
        : tone === "active"
          ? "bg-sky-500/10 text-sky-300"
          : tone === "pending"
            ? "bg-zinc-800 text-zinc-400"
            : "bg-zinc-900 text-zinc-500";

  return (
    <span
      className={`flex-shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${className}`}
    >
      {label}
    </span>
  );
}
