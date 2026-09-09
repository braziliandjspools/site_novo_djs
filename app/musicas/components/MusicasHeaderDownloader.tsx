"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MonitorDown } from "lucide-react";
import { useMusicasSession } from "./MusicasSessionContext";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { DownloaderDevicePanel } from "./DownloaderDevicePanel";

/** Controle compacto do BRS Downloader no header de /musicas. */
export function MusicasHeaderDownloader() {
  const { authenticated, hasVip } = useMusicasSession();
  const sync = useDownloaderSync();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
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
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="BRS Downloader"
          className={[
            "z-[9999] overflow-hidden rounded-xl border border-white/10 bg-[#121212] shadow-2xl shadow-black/60",
            // Mobile: ancora à direita do header/viewport (não ao botão), margem ~12px dos dois lados.
            // `fixed` fica relativo ao header (backdrop-filter) — full-width, então 100% ≈ tela (melhor que 100vw em WebViews).
            "fixed left-auto right-3 top-16 w-[calc(100%-1.5rem)] max-w-[360px]",
            "sm:top-[4.25rem]",
            // Desktop: ancora ao botão como antes.
            "md:absolute md:left-auto md:right-0 md:top-[calc(100%+0.5rem)] md:w-[min(92vw,22rem)] md:max-w-[22rem]",
          ].join(" ")}
        >
          <DownloaderDevicePanel className="mx-0 mb-0 min-w-0 border-0 bg-transparent" />
        </div>
      )}
    </div>
  );
}
