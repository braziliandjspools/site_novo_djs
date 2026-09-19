import { AtualizacoesRootClient } from "../components/AtualizacoesRootClient";
import { JsonLd } from "../../components/JsonLd";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  itemListJsonLd,
  SEO_PAGES,
} from "../../lib/seo";
import { listVipMusicFolders } from "../../lib/vip-music-catalog";
import { displayFolderName, folderHref, slugifyFolderName } from "../../lib/vip-music-slugs";

export default async function AtualizacoesPage() {
  const page = SEO_PAGES["musicas-atualizacoes"];

  let packItems: { name: string; path: string }[] = [];
  try {
    const folders = await listVipMusicFolders();
    packItems = folders
      .map((folder) => {
        const slug = slugifyFolderName(folder.name);
        if (!slug) return null;
        return {
          name: displayFolderName(folder.name),
          path: folderHref([slug]),
        };
      })
      .filter((entry): entry is { name: string; path: string } => entry != null);
  } catch {
    packItems = [];
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Músicas", path: "/musicas" },
          { name: "Atualizações", path: "/musicas/atualizacoes" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Atualizações para DJs",
          description: page.description,
          path: page.path,
        })}
      />
      {packItems.length > 0 ? (
        <JsonLd
          data={itemListJsonLd({
            name: "Packs e atualizações BRS",
            path: page.path,
            items: packItems,
          })}
        />
      ) : null}
      <AtualizacoesRootClient />
    </>
  );
}
