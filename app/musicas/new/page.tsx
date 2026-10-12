import type { Metadata } from "next";
import { JsonLd } from "../../components/JsonLd";
import { breadcrumbJsonLd, collectionPageJsonLd } from "../../lib/seo";
import { MusicNewClient } from "./MusicNewClient";

export const metadata: Metadata = {
  title: "BRS Music — biblioteca para DJs",
  description: "Explore os acervos e encontre suas próximas faixas na biblioteca da Brazilian Remix Service.",
};

export default function MusicNewPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Músicas", path: "/musicas" },
          { name: "BRS Music", path: "/musicas/new" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "BRS Music — biblioteca para DJs",
          description: "Explore os acervos e encontre suas próximas faixas na biblioteca da Brazilian Remix Service.",
          path: "/musicas/new",
        })}
      />
      <MusicNewClient />
    </>
  );
}
