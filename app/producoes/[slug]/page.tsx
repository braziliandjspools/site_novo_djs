import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductionDetail } from "../../components/HomeProductions";
import { getPublishedProductionBySlug, getProducerPage } from "../../lib/brs-productions";
import { formatStyleNameForDisplay } from "../../lib/style-display";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const production = await getPublishedProductionBySlug(slug).catch(() => null);
  if (!production) return { title: "Produção | Brazilian Remix Service" };
  const genre = formatStyleNameForDisplay(production.genre);
  return {
    title: `${production.title} | ${production.producer} | BRS`,
    description: [production.versionType, genre, production.duration].filter(Boolean).join(" · ")
      || `${production.producer} no catálogo Brazilian Remix Service.`,
  };
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 border-b border-white/10 py-2 text-sm">
      <dt className="text-white/45">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default async function ProducaoPage({ params }: PageProps) {
  const { slug } = await params;
  const production = await getPublishedProductionBySlug(slug).catch(() => null);
  if (!production) notFound();
  const related = production.producerSlug
    ? await getProducerPage(production.producerSlug, 1, 5).catch(() => null)
    : null;
  const more = related?.items.filter((item) => item.id !== production.id).slice(0, 4) ?? [];

  return (
    <main className="mx-auto w-full max-w-4xl overflow-x-hidden px-4 py-12 sm:px-6">
      <nav className="mb-6 text-xs text-zinc-500">
        <Link href="/" className="hover:text-white">Início</Link>
        <span className="mx-2">/</span>
        <Link href="/#producoes-brs" className="hover:text-white">Produções BRS</Link>
      </nav>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1db954]">{production.categoryLabel}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">{production.title}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {production.producerSlug ? (
          <Link href={`/produtores/${production.producerSlug}`} className="hover:text-white">{production.producer}</Link>
        ) : production.producer}
        {" · "}{production.versionType}
      </p>
      <div className="mt-8">
        <ProductionDetail production={production} />
      </div>
      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-[0.16em] text-white/70">FICHA TÉCNICA</h2>
        <dl className="mt-3">
          <Row label="Tipo" value={production.versionType} />
          <Row label="Duração" value={production.duration} />
          <Row label="BPM" value={production.bpm} />
          <Row label="Lançamento" value={new Date(production.publishedAt).toLocaleDateString("pt-BR")} />
          <Row label="Gênero" value={formatStyleNameForDisplay(production.genre)} />
          <Row label="Versão" value={production.versionLabel} />
          <Row label="Formato" value={production.format} />
          <Row label="Bitrate" value={production.bitrate} />
        </dl>
      </section>
      {more.length > 0 && production.producerSlug ? (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-[0.16em] text-white/70">MAIS PRODUÇÕES</h2>
            <Link href={`/produtores/${production.producerSlug}`} className="text-xs text-[#1db954]">Ver perfil</Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {more.map((item) => (
              <li key={item.id}>
                <Link href={`/producoes/${item.slug}`} className="block rounded-xl border border-white/10 px-3 py-2 hover:border-[#1db954]/50">
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="text-xs text-white/50">{item.versionType}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
