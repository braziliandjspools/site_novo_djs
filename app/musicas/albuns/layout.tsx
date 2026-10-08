import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata("musicas-albuns");

export default function AlbunsLayout({ children }: { children: ReactNode }) {
  return children;
}
