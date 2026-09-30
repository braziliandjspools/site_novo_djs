import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProducerCatalog } from "../../components/ProducerCatalog";
import { catalogMediaUrl } from "../../lib/catalog-media";
import { getProducerPage } from "../../lib/brs-productions";
import { findKnownArtistBySlug } from "../../lib/vip-known-artists";

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

const SOCIAL = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["soundcloud", "SoundCloud"],
  ["spotify", "Spotify"],
  ["website", "Site"],
] as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProducerPage(slug, 1, 1).catch(() => null);
  if (!data) return { title: "Produtor | Brazilian Remix Service" };
  return {
    title: `${data.producer.name} | Produções BRS`,
    description: data.producer.bio?.slice(0, 160) || `Conheça as produções de ${data.producer.name} no Brazilian Remix Service.`,
  };
}

export default async function ProducerPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const data = await getProducerPage(slug, page, 12).catch(() => null);
  if (!data) notFound();
  const { producer, items, total, pageSize } = data;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const photoUrl = catalogMediaUrl(producer.photoFileId);
  const fallbackPhotoUrl = findKnownArtistBySlug(producer.slug)?.imageUrl || findKnownArtistBySlug(producer.name)?.imageUrl || null;
  const place = [producer.city, producer.country].filter(Boolean).join(", ") || null;

  return (
    <main className="min-h-screen bg-[#02040a]">
      <ProducerCatalog
        page={page}
        pages={pages}
        total={total}
        productions={items}
        producer={{
          name: producer.name,
          slug: producer.slug,
          fullName: producer.fullName,
          bio: producer.bio,
          photoUrl,
          fallbackPhotoUrl,
          place,
          links: SOCIAL.flatMap(([key, label]) => {
            const href = producer[key];
            return href ? [{ href, label }] : [];
          }),
        }}
      />
    </main>
  );
}
