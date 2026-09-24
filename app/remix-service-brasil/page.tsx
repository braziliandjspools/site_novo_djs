import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../components/JsonLd";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  collectionPageJsonLd,
  faqJsonLd,
  SEO_PAGES,
} from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("remix-service-brasil");

const FAQS = [
  {
    q: "O que é um remix service?",
    a: "É um fluxo de versões feitas para DJs: extended, intro edits, clean/dirty, mashups e bootlegs pensados para a pista — não apenas o single de rádio.",
  },
  {
    q: "Quais versões o DJ mais usa?",
    a: "Extended mix, intro edit, clean edit, dirty edit e redrums costumam ser as mais pedidas em festas, clubs e open format.",
  },
];

export default function RemixServiceBrasilPage() {
  const page = SEO_PAGES["remix-service-brasil"];
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Remix Service Brasil", path: "/remix-service-brasil" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Remix Service para DJs",
          description: page.description,
          path: "/remix-service-brasil",
        })}
      />
      <JsonLd data={faqJsonLd(FAQS)} />

      <nav className="mb-6 text-xs text-zinc-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-white">
          Início
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Remix Service Brasil</span>
      </nav>

      <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        Remix Service para DJs
      </h1>
      <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
        Remix service no Brasil com extended mixes, intro edits, clean/dirty e versões prontas para
        o set — organizadas no acervo BRS.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold text-white">Como ajuda no repertório</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          Em vez de caçar faixas soltas, você navega packs e atualizações com tipos de versão que o
          DJ realmente usa na pista: extended, intro outro DJ, clean edit e bootlegs.
        </p>
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/musicas/atualizacoes"
          className="inline-flex h-11 items-center rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black"
        >
          Abrir atualizações
        </Link>
        <Link
          href="/packs-para-djs"
          className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
        >
          Packs para DJs
        </Link>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-bold text-white">Perguntas frequentes</h2>
        {FAQS.map((faq) => (
          <div key={faq.q}>
            <h3 className="text-sm font-semibold text-white">{faq.q}</h3>
            <p className="mt-1 text-sm text-zinc-400">{faq.a}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
