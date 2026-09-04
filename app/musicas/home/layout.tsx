import type { Metadata } from "next";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata("musicas-home");

export default function MusicasHomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
