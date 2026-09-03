"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Mail, Menu } from "lucide-react";
import {
  DOWNLOADER_PRIVACY_EMAIL,
  DOWNLOADER_PRIVACY_SECTIONS,
  DOWNLOADER_PRIVACY_UPDATED_AT,
} from "./policy-content";

const mailtoHref = `mailto:${DOWNLOADER_PRIVACY_EMAIL}?subject=${encodeURIComponent(
  "Privacidade — Brazilian Packs Downloader",
)}`;

export function DownloaderPrivacyPage() {
  const tocId = useId();
  const [tocOpen, setTocOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="br-stripe-thin mb-8 rounded-full" />

      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-[#b3b3b3] transition-colors hover:border-[#1DB954]/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar
        </Link>
      </div>

      <p className="text-xs uppercase tracking-wider text-[#00B347]">Documentos</p>
      <h1 className="mt-2 font-display text-3xl tracking-wide text-white sm:text-4xl">
        Política de Privacidade — Brazilian Packs Downloader
      </h1>
      <p className="mt-4 text-sm text-gray-400">Última atualização: {DOWNLOADER_PRIVACY_UPDATED_AT}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-12">
        <aside className="lg:sticky lg:top-24">
          <div className="lg:hidden">
            <button
              type="button"
              aria-expanded={tocOpen}
              aria-controls={tocId}
              onClick={() => setTocOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-left text-sm font-semibold text-white transition-colors hover:border-[#1DB954]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
            >
              <span className="inline-flex items-center gap-2">
                <Menu className="h-4 w-4 text-[#FFDF00]" aria-hidden />
                Nesta página
              </span>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${tocOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            <nav
              id={tocId}
              hidden={!tocOpen}
              aria-label="Índice desta página"
              className="mt-2 rounded-xl border border-white/10 bg-[#181818] p-3"
            >
              <TocLinks onNavigate={() => setTocOpen(false)} />
            </nav>
          </div>

          <nav
            aria-label="Índice desta página"
            className="hidden rounded-xl border border-white/10 bg-[#181818] p-4 lg:block"
          >
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FFDF00]">
              Nesta página
            </p>
            <TocLinks />
          </nav>
        </aside>

        <article className="min-w-0 space-y-10 text-sm leading-relaxed text-gray-300">
          {DOWNLOADER_PRIVACY_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="font-display text-2xl tracking-wide text-white">{section.title}</h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`${section.id}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <div className="border-t border-white/10 pt-8">
            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#009739] to-[#1DB954] px-6 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:from-[#00B347] hover:to-[#1ED760] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Falar sobre privacidade
            </a>
            <p className="mt-3 text-xs text-gray-500">{DOWNLOADER_PRIVACY_EMAIL}</p>
          </div>
        </article>
      </div>
    </main>
  );
}

function TocLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="space-y-1.5">
      {DOWNLOADER_PRIVACY_SECTIONS.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            onClick={onNavigate}
            className="block rounded-lg px-2 py-1.5 text-xs text-gray-400 transition-colors hover:bg-white/5 hover:text-[#1DB954] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
          >
            {section.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
