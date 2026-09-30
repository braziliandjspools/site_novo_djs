import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "../../lib/seo";
import { MusicasCenterLoading } from "../components/MusicasSkeletons";
import { AtualizacoesSearchProvider } from "./AtualizacoesSearchContext";
import { AtualizacoesPlayerLayout } from "./AtualizacoesPlayerLayout";

export const metadata: Metadata = buildPageMetadata("musicas-atualizacoes");

/** Provider compartilhado — a barra em si fica na página raiz e no layout das pastas. */
export default function AtualizacoesLayout({ children }: LayoutProps<"/musicas/atualizacoes">) {
  return (
    <Suspense fallback={<MusicasCenterLoading label="Carregando atualizações…" />}>
      <AtualizacoesSearchProvider>
        <AtualizacoesPlayerLayout>{children}</AtualizacoesPlayerLayout>
      </AtualizacoesSearchProvider>
    </Suspense>
  );
}
