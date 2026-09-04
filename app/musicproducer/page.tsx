import type { Metadata } from "next";
import { getMusicProducerPlaylists } from "../lib/google-drive";
import { MusicProducerPageClient } from "../components/MusicProducerPageClient";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("musicproducer");

export const dynamic = "force-dynamic";

export default async function MusicProducerPage() {
  const demoPlaylists = await getMusicProducerPlaylists().catch(() => []);

  return <MusicProducerPageClient demoPlaylists={demoPlaylists} />;
}
