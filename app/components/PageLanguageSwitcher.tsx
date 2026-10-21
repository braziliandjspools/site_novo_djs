"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Languages } from "lucide-react";

const TARGET_LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
] as const;

const PRIVATE_PATHS = ["/admin", "/portal", "/checkout", "/pagamento", "/api", "/musicas/entrar"];
const SAFE_QUERY_KEYS = new Set([
  "pool",
  "estilo",
  "dia",
  "data",
  "date",
  "page",
  "q",
  "search",
  "genero",
  "genre",
  "tipo",
  "type",
  "sort",
]);

type PageLanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
  fullWidth?: boolean;
};

function isPrivatePath(pathname: string) {
  return PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function PageLanguageSwitcher({
  className = "",
  compact = false,
  fullWidth = false,
}: PageLanguageSwitcherProps) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (isPrivatePath(pathname)) return null;

  function openTranslation(language: (typeof TARGET_LANGUAGES)[number]["code"]) {
    const pageUrl = new URL(window.location.pathname, window.location.origin);
    const currentParams = new URLSearchParams(window.location.search);

    currentParams.forEach((value, key) => {
      if (SAFE_QUERY_KEYS.has(key.toLowerCase())) pageUrl.searchParams.append(key, value);
    });

    const translatorUrl = new URL("https://translate.google.com/translate");
    translatorUrl.searchParams.set("sl", "pt");
    translatorUrl.searchParams.set("tl", language);
    translatorUrl.searchParams.set("u", pageUrl.toString());

    window.open(translatorUrl.toString(), "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Traduzir esta página"
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-white/75 transition hover:border-[#60cdff]/35 hover:bg-[#60cdff]/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60cdff]/50 ${fullWidth ? "w-full" : ""}`}
      >
        <Languages className="h-4 w-4 text-[#8ad4ff]" aria-hidden="true" />
        {!compact && <span>Idioma</span>}
        <ChevronDown
          className={`h-3.5 w-3.5 text-white/45 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Idioma da página"
          className={`absolute z-[120] w-64 overflow-hidden rounded-xl border border-white/10 bg-[#111315] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.65)] ${fullWidth ? "bottom-[calc(100%+0.65rem)] left-0" : "right-0 top-[calc(100%+0.65rem)]"}`}
        >
          <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
            Traduzir página
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
          >
            <span aria-hidden="true">🇧🇷</span>
            <span className="flex-1">Português (Brasil)</span>
            <Check className="h-4 w-4 text-[#60cdff]" aria-label="Idioma original" />
          </button>
          {TARGET_LANGUAGES.map(({ code, label, flag }) => (
            <button
              key={code}
              type="button"
              role="menuitem"
              onClick={() => openTranslation(code)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/70 transition-colors hover:bg-[#60cdff]/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#60cdff]/40"
            >
              <span aria-hidden="true">{flag}</span>
              <span>{label}</span>
            </button>
          ))}
          <p className="px-3 pb-2 pt-2 text-[10px] leading-relaxed text-white/35">
            A tradução abre em uma nova aba pelo Google Tradutor.
          </p>
        </div>
      )}
    </div>
  );
}
