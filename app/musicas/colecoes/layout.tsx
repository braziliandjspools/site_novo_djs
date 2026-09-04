import type { Metadata } from "next";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata("musicas-colecoes");

export default function MusicasColecoesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
