import { Suspense } from "react";
import { AtualizacoesSearch, AtualizacoesSearchResults } from "../AtualizacoesSearch";
import { AtualizacoesSearchProvider } from "../AtualizacoesSearchContext";
import { AtualizacoesPlayerLayout } from "../AtualizacoesPlayerLayout";
import { MusicasPageSkeleton } from "../../components/MusicasSkeletons";

export default function AtualizacoesSlugLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MusicasPageSkeleton />}>
      <AtualizacoesSearchProvider>
        <AtualizacoesPlayerLayout>
          <AtualizacoesSearch />
          <AtualizacoesSearchResults />
          {children}
        </AtualizacoesPlayerLayout>
      </AtualizacoesSearchProvider>
    </Suspense>
  );
}
