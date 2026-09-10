import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Type } from "lucide-react";
import { CaseConverterTool } from "../components/CaseConverterTool";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("gerador-maiusculas");

export default function GeradorMaiusculasPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,215,96,0.12),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(0,39,118,0.18),transparent_40%)]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-[#1ed760]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <header className="mt-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1ed760]/30 bg-[#1ed760]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1ed760]">
            <Type className="h-3.5 w-3.5" />
            Utilitário
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Gerador de maiúscula
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-400">
            Converta de maiúscula para minúscula, ou de minúscula para maiúscula: digite a frase e use os
            botões abaixo.
          </p>
        </header>

        <div className="mt-8">
          <CaseConverterTool />
        </div>
      </div>
    </main>
  );
}
