import { Suspense } from "react";
import { AtualizacoesSearch, AtualizacoesSearchResults } from "./AtualizacoesSearch";
import { AtualizacoesSearchProvider } from "./AtualizacoesSearchContext";

export default function AtualizacoesLayout({ children }: LayoutProps<"/musicas/atualizacoes">) {
  return (
    <Suspense fallback={null}>
      <AtualizacoesSearchProvider>
        <AtualizacoesSearch />
        <AtualizacoesSearchResults />
        {children}
      </AtualizacoesSearchProvider>
    </Suspense>
  );
}
