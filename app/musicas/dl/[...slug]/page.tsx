import { redirect } from "next/navigation";
import { folderHref } from "../../../lib/vip-music-slugs";

/** Alias legado `/musicas/dl/...` → mesma URL do navegador no acervo. */
export default async function PackDownloadLegacyRedirect({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const segments = (slug ?? []).map((part) => decodeURIComponent(part)).filter(Boolean);
  if (segments.length === 0) {
    redirect("/musicas/atualizacoes");
  }
  redirect(folderHref(segments));
}
