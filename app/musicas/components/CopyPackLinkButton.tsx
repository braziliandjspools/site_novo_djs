"use client";

import { useState, type MouseEvent } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { buildPackDownloadUrl } from "../../lib/pack-download-link";
import { useMusicasToast } from "./MusicasToast";

type CopyPackLinkButtonProps = {
  slugSegments: string[];
  label?: string;
  className?: string;
};

export function CopyPackLinkButton({
  slugSegments,
  label = "Copiar link para o Downloader",
  className = "",
}: CopyPackLinkButtonProps) {
  const { showToast } = useMusicasToast();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleCopy(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (busy || slugSegments.length === 0) return;

    const url = buildPackDownloadUrl(slugSegments);
    setBusy(true);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("Link copiado — cole no BRS Downloader");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Não foi possível copiar o link.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(event) => void handleCopy(event)}
      disabled={busy || slugSegments.length === 0}
      title={label}
      aria-label={label}
      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-[#1ed760] disabled:opacity-50 ${className}`}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5 text-[#1ed760]" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
