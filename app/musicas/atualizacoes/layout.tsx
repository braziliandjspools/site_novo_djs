import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "../../lib/seo";
import { MusicasPageSkeleton } from "../components/MusicasSkeletons";
import { AtualizacoesSearchProvider } from "./AtualizacoesSearchContext";
import { AtualizacoesPlayerLayout } from "./AtualizacoesPlayerLayout";

export const metadata: Metadata = buildPageMetadata("musicas-atualizacoes");

/** Provider compartilhado — a barra em si fica na página raiz e no layout das pastas. */
export default function AtualizacoesLayout({ children }: LayoutProps<"/musicas/atualizacoes">) {
  return (
    <Suspense fallback={<MusicasPageSkeleton />}>
      <AtualizacoesSearchProvider>
        <AtualizacoesPlayerLayout>{children}</AtualizacoesPlayerLayout>
      </AtualizacoesSearchProvider>
    </Suspense>
  );
}
