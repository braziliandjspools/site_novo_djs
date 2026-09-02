"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyFieldVariant = "green" | "purple" | "blue" | "yellow";
type CopyFieldTheme = "dark" | "light";

const VARIANT_STYLES: Record<
  CopyFieldVariant,
  Record<CopyFieldTheme, { button: string; value: string; box: string; label: string }>
> = {
  green: {
    dark: {
      box: "border-white/10 bg-black/20",
      value: "text-gray-200",
      label: "text-gray-500",
      button: "border-[#009739]/40 bg-[#009739]/15 text-[#00B347] hover:bg-[#009739]/25",
    },
    light: {
      box: "border-emerald-200 bg-emerald-50",
      value: "text-emerald-900",
      label: "text-zinc-500",
      button: "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    },
  },
  purple: {
    dark: {
      box: "border-purple-500/30 bg-black/30",
      value: "text-[#00B347]",
      label: "text-gray-500",
      button: "border-purple-500/40 bg-purple-600/30 text-purple-200 hover:bg-purple-600/45",
    },
    light: {
      box: "border-purple-200 bg-purple-50",
      value: "text-purple-900 font-mono",
      label: "text-zinc-500",
      button: "border-purple-300 bg-purple-100 text-purple-800 hover:bg-purple-200",
    },
  },
  blue: {
    dark: {
      box: "border-[#002776]/40 bg-black/20",
      value: "text-gray-200",
      label: "text-gray-500",
      button: "border-[#6B9FFF]/40 bg-[#002776]/30 text-[#6B9FFF] hover:bg-[#002776]/45",
    },
    light: {
      box: "border-blue-200 bg-blue-50",
      value: "text-blue-900",
      label: "text-zinc-500",
      button: "border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200",
    },
  },
  yellow: {
    dark: {
      box: "border-[#FFDF00]/30 bg-black/20",
      value: "text-[#FFDF00]",
      label: "text-gray-500",
      button: "border-[#FFDF00]/40 bg-[#FFDF00]/15 text-[#FFDF00] hover:bg-[#FFDF00]/25",
    },
    light: {
      box: "border-amber-200 bg-amber-50",
      value: "text-amber-900",
      label: "text-zinc-500",
      button: "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200",
    },
  },
};

type CopyFieldProps = {
  label: string;
  value: string;
  mono?: boolean;
  variant?: CopyFieldVariant;
  theme?: CopyFieldTheme;
  compact?: boolean;
};

export function CopyField({
  label,
  value,
  mono = true,
  variant = "green",
  theme = "dark",
  compact = false,
}: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const styles = VARIANT_STYLES[variant][theme];

  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-wider ${styles.label}`}>{label}</p>
      <div
        className={`mt-2 flex items-center gap-2 rounded-xl border px-4 py-3 ${styles.box}`}
      >
        <p
          className={`min-w-0 flex-1 break-all text-sm ${mono ? "font-mono text-xs leading-relaxed" : ""} ${styles.value}`}
        >
          {value || "—"}
        </p>
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={!value}
          aria-label={copied ? "Copiado" : "Copiar"}
          className={`flex flex-shrink-0 items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${compact ? "aspect-square p-2.5" : "gap-1.5"} ${styles.button}`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {!compact && (copied ? "Copiado" : "Copiar")}
        </button>
      </div>
    </div>
  );
}
