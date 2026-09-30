import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeProductions } from "../../components/HomeProductions";
import { getProducerPage } from "../../lib/brs-productions";

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProducerPage(slug, 1, 1).catch(() => null);
  if (!data) return { title: "Produtor | Brazilian Remix Service" };
  return {
    title: `${data.producer.name} | Produções BRS`,
    description: data.producer.bio?.slice(0, 160) || `Produções de ${data.producer.name} no Brazilian Remix Service.`,
  };
}

const SOCIAL = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["soundcloud", "SoundCloud"],
  ["spotify", "Spotify"],
  ["website", "Site"],
] as const;

export default async function ProducerPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const data = await getProducerPage(slug, page, 12).catch(() => null);
  if (!data) notFound();
  const { producer, items, total, pageSize } = data;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const photo = producer.photoFileId ? `/api/musicas/cover/${producer.photoFileId}` : null;
  const place = [producer.city, producer.country].filter(Boolean).join(", ");

  return (
    <main className="mx-auto w-full max-w-5xl overflow-x-hidden px-4 py-12 sm:px-6">
      <nav className="mb-6 text-xs text-zinc-500">
        <Link href="/" className="hover:text-white">Início</Link>
        <span className="mx-2">/</span>
        <span>Produtores</span>
      </nav>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-28 w-28 rounded-2xl object-cover" />
        ) : null}
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">{producer.name}</h1>
          {producer.fullName ? <p className="text-sm text-zinc-400">{producer.fullName}</p> : null}
          {place ? <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#ff2ea6]">{place}</p> : null}
          {producer.bio ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">{producer.bio}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {SOCIAL.map(([key, label]) => {
              const href = producer[key];
              if (!href) return null;
              return (
                <a key={key} href={href} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80">
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      </header>
      <div className="mt-10">
        <HomeProductions productions={items} heading={producer.name} />
      </div>
      {pages > 1 ? (
        <nav className="mt-6 flex gap-2 text-sm">
          {page > 1 ? <Link className="text-[#ff2ea6]" href={`/produtores/${slug}?page=${page - 1}`}>Anterior</Link> : null}
          <span className="text-white/40">{page} / {pages}</span>
          {page < pages ? <Link className="text-[#ff2ea6]" href={`/produtores/${slug}?page=${page + 1}`}>Próxima</Link> : null}
        </nav>
      ) : null}
    </main>
  );
}
