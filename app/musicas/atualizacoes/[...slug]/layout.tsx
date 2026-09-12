import { Suspense } from "react";
import { AtualizacoesSearch, AtualizacoesSearchResults } from "../AtualizacoesSearch";
import { MusicasPageSkeleton } from "../../components/MusicasSkeletons";

export default function AtualizacoesSlugLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MusicasPageSkeleton />}>
      <AtualizacoesSearch />
      <AtualizacoesSearchResults />
      {children}
    </Suspense>
  );
}
