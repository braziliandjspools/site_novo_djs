"use client";

import { useState, type MouseEvent } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { buildPackDownloadUrl } from "../../lib/pack-download-link";
import { useMusicasToast } from "./MusicasToast";

type CopyPackLinkButtonProps = {
  slugSegments: string[];
  filters?: { dia?: string; pool?: string; estilo?: string };
  label?: string;
  showLabel?: boolean;
  className?: string;
};

export function CopyPackLinkButton({
  slugSegments,
  filters,
  label = "Copiar link para o Downloader",
  showLabel = false,
  className = "",
}: CopyPackLinkButtonProps) {
  const { showToast } = useMusicasToast();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleCopy(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (busy || slugSegments.length === 0) return;

    const url = new URL(buildPackDownloadUrl(slugSegments), window.location.origin);
    for (const key of ["dia", "pool", "estilo"] as const) {
      const value = filters?.[key]?.trim();
      if (value) url.searchParams.set(key, value);
    }
    setBusy(true);
    try {
      await navigator.clipboard.writeText(url.toString());
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
      className={`flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#60cdff]/45 bg-[#60cdff]/20 text-[#60cdff] transition-colors hover:bg-[#60cdff]/35 hover:text-[#86efac] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5 text-[#60cdff]" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {showLabel ? <span className="text-xs font-bold">{label}</span> : null}
    </button>
  );
}
