import type { Metadata } from "next";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata("musicas-artistas");

export default function ArtistasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
