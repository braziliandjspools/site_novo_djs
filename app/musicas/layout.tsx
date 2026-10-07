import type { Metadata } from "next";
import { MusicasAuthLayout } from "./MusicasAuthLayout";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("musicas");

export default function MusicasLayout({ children }: { children: import("react").ReactNode }) {
  return <MusicasAuthLayout>{children}</MusicasAuthLayout>;
}
