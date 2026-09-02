import { getMusicProducerPlaylists } from "../lib/google-drive";
import { MusicProducerPageClient } from "../components/MusicProducerPageClient";

export const dynamic = "force-dynamic";

export default async function MusicProducerPage() {
  const demoPlaylists = await getMusicProducerPlaylists().catch(() => []);

  return <MusicProducerPageClient demoPlaylists={demoPlaylists} />;
}
