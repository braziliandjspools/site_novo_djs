import type { Metadata } from "next";
import { JsonLd } from "../components/JsonLd";
import { MusicProducerPageClient } from "../components/MusicProducerPageClient";
import { getMusicProducerPlaylists } from "../lib/google-drive";
import { breadcrumbJsonLd, buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("musicproducer");

export const dynamic = "force-dynamic";

export default async function MusicProducerPage() {
  const demoPlaylists = await getMusicProducerPlaylists().catch(() => []);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Music Producer", path: "/musicproducer" },
        ])}
      />
      <MusicProducerPageClient demoPlaylists={demoPlaylists} />
    </>
  );
}
