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

export const metadata: Metadata = buildPageMetadata("dj-pool-brasil");

const FAQS = [
  {
    q: "O que é uma DJ pool?",
    a: "DJ pools são acervos/atualizações com remixes e edits feitos para DJs profissionais — muitas vezes organizados por data, pool e estilo.",
  },
  {
    q: "A BRS trabalha com DJ pools?",
    a: "Sim. O acervo VIP organiza atualizações e packs no fluxo de remix services e DJ pools, com pastas prontas para a rotina de eventos e clubs.",
  },
];

export default function DjPoolBrasilPage() {
  const page = SEO_PAGES["dj-pool-brasil"];
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "DJ Pool Brasil", path: "/dj-pool-brasil" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "DJ Pools para DJs",
          description: page.description,
          path: "/dj-pool-brasil",
        })}
      />
      <JsonLd data={faqJsonLd(FAQS)} />

      <nav className="mb-6 text-xs text-zinc-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-white">
          Início
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">DJ Pool Brasil</span>
      </nav>

      <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        DJ Pools para DJs
      </h1>
      <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
        DJ pools e atualizações para DJs no Brasil: remixes, edits e packs organizados para pistas,
        eventos e open format.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold text-white">Como funciona no acervo BRS</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          As novidades entram em Atualizações VIP, com pastas por pack, mês e estilo. Assim você
          acompanha o ritmo de DJ pools e remix services sem perder a organização do set.
        </p>
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/musicas/atualizacoes"
          className="inline-flex h-11 items-center rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black"
        >
          Ir para Atualizações VIP
        </Link>
        <Link
          href="/packs-para-djs"
          className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
        >
          Packs para DJs
        </Link>
        <Link
          href="/plans"
          className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
        >
          Ver planos
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
