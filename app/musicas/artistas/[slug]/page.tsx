import { ArtistaSlugClient } from "./ArtistaSlugClient";

export default async function ArtistaSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ArtistaSlugClient slug={decodeURIComponent(slug)} />;
}
