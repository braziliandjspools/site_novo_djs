import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductionStage } from "../../components/ProductionStage";
import { getProducerPage, getPublishedProductionBySlug } from "../../lib/brs-productions";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const production = await getPublishedProductionBySlug(slug).catch(() => null);
  if (!production) return { title: "Produção | Brazilian Remix Service" };
  return {
    title: `${production.title} | ${production.producer} | BRS`,
    description: production.description?.trim() || `${production.producer} — ${production.title} no catálogo Brazilian Remix Service.`,
  };
}

export default async function MusicPage({ params }: PageProps) {
  const { slug } = await params;
  const production = await getPublishedProductionBySlug(slug).catch(() => null);
  if (!production) notFound();
  const related = production.producerSlug
    ? await getProducerPage(production.producerSlug, 1, 5).catch(() => null)
    : null;
  const more = related?.items.filter((item) => item.id !== production.id).slice(0, 4) ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_20%_0%,rgba(0,70,160,0.45),transparent_42%),linear-gradient(180deg,#05070d_0%,#02040a_100%)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
<ProductionStage production={production} more={more} />
      </div>
    </main>
  );
}
