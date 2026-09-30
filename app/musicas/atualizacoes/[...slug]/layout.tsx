import { Suspense } from "react";
import { AtualizacoesSearch, AtualizacoesSearchResults } from "../AtualizacoesSearch";
import { MusicasCenterLoading } from "../../components/MusicasSkeletons";

export default function AtualizacoesSlugLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MusicasCenterLoading label="Carregando a pasta…" />}>
      <AtualizacoesSearch />
      <AtualizacoesSearchResults />
      {children}
    </Suspense>
  );
}
