import { Suspense } from "react";
import { AtualizacoesSearch, AtualizacoesSearchResults } from "../AtualizacoesSearch";
import { AtualizacoesSearchProvider } from "../AtualizacoesSearchContext";
import { AtualizacoesPlayerLayout } from "../AtualizacoesPlayerLayout";

export default function AtualizacoesMonthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
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
