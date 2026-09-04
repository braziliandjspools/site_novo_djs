import { redirect } from "next/navigation";
import { ColecoesBrowseClient } from "../../components/ColecoesBrowseClient";

export default async function ColecoesSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const segments = (slug ?? []).map((part) => decodeURIComponent(part)).filter(Boolean);

  if (segments.length === 0) {
    redirect("/musicas/colecoes");
  }

  return <ColecoesBrowseClient slugSegments={segments} />;
}
