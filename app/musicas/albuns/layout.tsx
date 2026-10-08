import type { Metadata } from "next";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata("musicas-albuns");

export default function AlbunsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
