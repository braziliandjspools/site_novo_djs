import type { Metadata } from "next";
import { AtualizacoesRootClient } from "../components/AtualizacoesRootClient";
import { JsonLd } from "../../components/JsonLd";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  SEO_PAGES,
} from "../../lib/seo";

export default function AtualizacoesPage() {
  const page = SEO_PAGES["musicas-atualizacoes"];
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
      <AtualizacoesRootClient />
    </>
  );
}
