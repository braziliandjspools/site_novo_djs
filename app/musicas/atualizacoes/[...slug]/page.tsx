import { redirect } from "next/navigation";
import { AtualizacoesBrowseClient } from "../../components/AtualizacoesBrowseClient";

export default async function AtualizacoesSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const segments = (slug ?? []).map((part) => decodeURIComponent(part)).filter(Boolean);

  if (segments.length === 0) {
    redirect("/musicas/atualizacoes");
  }

  return <AtualizacoesBrowseClient slugSegments={segments} />;
}
