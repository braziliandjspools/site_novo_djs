"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MonitorDown } from "lucide-react";
import { useMusicasSession } from "./MusicasSessionContext";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { DownloaderDevicePanel } from "./DownloaderDevicePanel";
import {
  formatQuotaCountdown,
  type DownloaderQuotaSnapshot,
} from "../../lib/downloader-quota-config";

/** Controle compacto do BRS Downloader no header de /musicas. */
export function MusicasHeaderDownloader() {
  const { authenticated, hasVip } = useMusicasSession();
  const sync = useDownloaderSync();
  const [open, setOpen] = useState(false);
  const [quota, setQuota] = useState<DownloaderQuotaSnapshot | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authenticated || !hasVip) return;
    let cancelled = false;

    async function loadQuota() {
      try {
        const res = await fetch("/api/downloader/quota", { cache: "no-store", credentials: "same-origin" });
        const data = (await res.json()) as { quota?: DownloaderQuotaSnapshot; error?: string };
        if (!cancelled && res.ok && data.quota) setQuota(data.quota);
      } catch {
        /* ignore */
      }
    }

    void loadQuota();
    const timer = window.setInterval(() => void loadQuota(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [authenticated, hasVip, open]);

  useEffect(() => {
    if (!quota?.exhausted) return;
    const timer = window.setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, [quota?.exhausted]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const onlineCount = sync?.devices.filter((d) => d.isOnline).length ?? 0;
  const isOnline = onlineCount > 0;

  const resetsInSeconds = (() => {
    if (!quota) return 0;
    void nowTick;
    const ends = new Date(quota.windowEndsAt).getTime();
    return Math.max(0, Math.ceil((ends - Date.now()) / 1000));
  })();

  const quotaLabel = quota
    ? quota.exhausted
      ? formatQuotaCountdown(resetsInSeconds)
      : `${quota.tracksRemaining}/${quota.trackLimit}`
    : null;

  if (!authenticated || !hasVip) {
    return (
      <Link
        href={authenticated ? "/plans" : "/musicas/entrar"}
        className="hidden cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
        title="BRS Downloader"
      >
        <MonitorDown className="h-4 w-4" />
        <span className="hidden lg:inline">Downloader</span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="BRS Downloader"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#1ed760]/25 bg-[#1ed760]/10 px-2.5 py-1.5 text-xs font-semibold text-[#1ed760] transition-colors hover:border-[#1ed760]/45 hover:bg-[#1ed760]/20 hover:text-[#7dffb0]"
      >
        <span className="relative">
          <MonitorDown className="h-4 w-4 text-[#1ed760]" />
          <span
            className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-[#0a0a0a] ${
              isOnline ? "bg-[#1ed760]" : "bg-zinc-500"
            }`}
          />
        </span>
        <span className="hidden lg:inline">Downloader</span>
        {quotaLabel ? (
          <span
            className={`hidden tabular-nums sm:inline ${
              quota?.exhausted ? "text-amber-300" : "text-[#1ed760]/80"
            }`}
            title={
              quota?.exhausted
                ? `Cota esgotada · libera em ${formatQuotaCountdown(resetsInSeconds)}`
                : `Cota ${quota?.tierLabel}: ${quota?.tracksUsed}/${quota?.trackLimit} faixas nesta janela`
            }
          >
            {quotaLabel}
          </span>
        ) : null}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="BRS Downloader"
          className={[
            "z-[9999] overflow-hidden rounded-xl border border-white/10 bg-[#121212] shadow-2xl shadow-black/60",
            "fixed left-auto right-3 top-[calc(4.5rem+env(titlebar-area-height,0px))] w-[calc(100%-1.5rem)] max-w-[360px]",
            "sm:top-[calc(5rem+env(titlebar-area-height,0px))]",
            "md:absolute md:left-auto md:right-0 md:top-[calc(100%+0.5rem)] md:w-[min(92vw,22rem)] md:max-w-[22rem]",
          ].join(" ")}
        >
          {quota ? (
            <div className="border-b border-white/10 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                Cota {quota.tierLabel} · {quota.periodLabel}
              </p>
              {quota.exhausted ? (
                <p className="mt-1 text-sm font-semibold tabular-nums text-amber-300">
                  Esgotada · libera em {formatQuotaCountdown(resetsInSeconds)}
                </p>
              ) : (
                <p className="mt-1 text-sm font-semibold text-white">
                  {quota.tracksRemaining.toLocaleString("pt-BR")} de{" "}
                  {quota.trackLimit.toLocaleString("pt-BR")} faixas restantes
                </p>
              )}
              {quota.packLimit != null ? (
                <p className="mt-0.5 text-[11px] text-white/45">
                  Packs: {quota.packsUsed}/{quota.packLimit} nesta janela
                </p>
              ) : null}
            </div>
          ) : null}
          <DownloaderDevicePanel className="mx-0 mb-0 min-w-0 border-0 bg-transparent" />
        </div>
      )}
    </div>
  );
}
