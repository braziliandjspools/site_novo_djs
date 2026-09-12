"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyFieldVariant = "green" | "purple" | "blue" | "yellow";

const VARIANT_STYLES: Record<
  CopyFieldVariant,
  { button: string; value: string; box: string; label: string }
> = {
  green: {
    box: "border-white/10 bg-black/20",
    value: "text-gray-200",
    label: "text-gray-500",
    button: "border-[#009739]/40 bg-[#009739]/15 text-[#00B347] hover:bg-[#009739]/25",
  },
  purple: {
    box: "border-purple-500/30 bg-black/30",
    value: "text-[#00B347]",
    label: "text-gray-500",
    button: "border-purple-500/40 bg-purple-600/30 text-purple-200 hover:bg-purple-600/45",
  },
  blue: {
    box: "border-[#002776]/40 bg-black/20",
    value: "text-gray-200",
    label: "text-gray-500",
    button: "border-[#6B9FFF]/40 bg-[#002776]/30 text-[#6B9FFF] hover:bg-[#002776]/45",
  },
  yellow: {
    box: "border-[#FFDF00]/30 bg-black/20",
    value: "text-[#FFDF00]",
    label: "text-gray-500",
    button: "border-[#FFDF00]/40 bg-[#FFDF00]/15 text-[#FFDF00] hover:bg-[#FFDF00]/25",
  },
};

type CopyFieldProps = {
  label: string;
  value: string;
  mono?: boolean;
  variant?: CopyFieldVariant;
  compact?: boolean;
};

export function CopyField({
  label,
  value,
  mono = true,
  variant = "green",
  compact = false,
}: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const styles = VARIANT_STYLES[variant];

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
        className={`mt-1.5 flex items-center gap-2 rounded-xl border ${styles.box} ${
          compact ? "px-3 py-2" : "px-3.5 py-2.5"
        }`}
      >
        <code className={`min-w-0 flex-1 truncate text-sm ${mono ? "font-mono" : ""} ${styles.value}`}>
          {value || "—"}
        </code>
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={!value}
          className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 ${styles.button}`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
