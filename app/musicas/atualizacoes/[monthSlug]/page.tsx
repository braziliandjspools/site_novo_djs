import { redirect } from "next/navigation";
import { AtualizacoesMonthClient } from "./AtualizacoesMonthClient";

export default async function AtualizacoesMonthPage({
  params,
}: PageProps<"/musicas/atualizacoes/[monthSlug]">) {
  const { monthSlug } = await params;
  if (!monthSlug) {
    redirect("/musicas/atualizacoes");
  }
  return <AtualizacoesMonthClient monthSlug={monthSlug} />;
}
