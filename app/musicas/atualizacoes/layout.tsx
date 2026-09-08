import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "../../lib/seo";
import { MusicasPageSkeleton } from "../components/MusicasSkeletons";

export const metadata: Metadata = buildPageMetadata("musicas-atualizacoes");

export default function AtualizacoesLayout({ children }: LayoutProps<"/musicas/atualizacoes">) {
  return <Suspense fallback={<MusicasPageSkeleton />}>{children}</Suspense>;
}
