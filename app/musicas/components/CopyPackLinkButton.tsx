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
      className={`flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border border-sky-500/45 bg-sky-500/20 text-sky-400 transition-colors hover:bg-sky-500/35 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
