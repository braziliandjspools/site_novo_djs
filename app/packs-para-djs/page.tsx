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

export const metadata: Metadata = buildPageMetadata("packs-para-djs");

const FAQS = [
  {
    q: "O que são packs para DJs?",
    a: "Packs são pastas curadas com remixes, extended mixes, intro edits e versões clean/dirty organizadas por estilo, período ou pool — prontas para montar sets.",
  },
  {
    q: "Quais estilos entram nos packs BRS?",
    a: "O acervo cobre funk, sertanejo, eletrônico, house, flashback, open format e outros estilos usados em festas, clubs e eventos no Brasil.",
  },
  {
    q: "Como acesso os packs atualizados?",
    a: "Entre na plataforma VIP em Atualizações para navegar packs por ano e pasta. Assinantes ouvem e baixam; visitantes podem explorar a estrutura do acervo.",
  },
];

export default function PacksParaDjsPage() {
  const page = SEO_PAGES["packs-para-djs"];
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Packs para DJs", path: "/packs-para-djs" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Packs para DJs",
          description: page.description,
          path: "/packs-para-djs",
        })}
      />
      <JsonLd data={faqJsonLd(FAQS)} />

      <nav className="mb-6 text-xs text-zinc-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-white">
          Início
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Packs para DJs</span>
      </nav>

      <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        Packs para DJs
      </h1>
      <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
        Seleção de packs com remixes, versões extended, intro edits e materiais organizados para a
        rotina do DJ — funk, sertanejo, eletrônico, flashback e open format.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold text-white">O que você encontra nos packs</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          No Brazilian Remix Service, os packs chegam por ano e pasta no Drive VIP, com estrutura
          pensada para achar rápido o que vai para o USB: extended mixes, intro edits, clean/dirty e
          bootlegs usados em pistas brasileiras.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-400">
          <li>Packs por ano (incluindo atualizações recentes)</li>
          <li>Pastas por estilo e período</li>
          <li>Fluxo direto para a plataforma VIP e o BRS Downloader</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-bold text-white">Acesse o acervo</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/musicas/atualizacoes"
            className="inline-flex h-11 items-center rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black"
          >
            Ver atualizações VIP
          </Link>
          <Link
            href="/dj-pool-brasil"
            className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
          >
            DJ Pools Brasil
          </Link>
          <Link
            href="/remix-service-brasil"
            className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
          >
            Remix Service
          </Link>
        </div>
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
