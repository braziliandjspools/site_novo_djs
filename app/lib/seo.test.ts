import assert from "node:assert/strict";
import { test } from "node:test";
import { GET as getSocialCard } from "../og/[slug]/route";
import {
  buildAtualizacoesFolderMetadata,
  buildPageMetadata,
  buildRootMetadata,
  SEO_PAGES,
  SITE_URL,
  sitemapEntries,
} from "./seo";

test("páginas públicas expõem canonical e cartão social da BRS", () => {
  const root = buildRootMetadata();
  assert.equal(root.applicationName, "Brazilian Remix Service");
  assert.match(String(root.title && typeof root.title === "object" && "default" in root.title ? root.title.default : ""), /Brazilian Remix Service/);
  for (const page of Object.values(SEO_PAGES).filter((item) => !item.noIndex)) {
    const metadata = buildPageMetadata(page.key);
    assert.equal((metadata.title as { absolute: string }).absolute, page.title);
    assert.equal(page.title.split("Brazilian Remix Service").length - 1, 1, page.path);
    assert.equal(metadata.alternates?.canonical, page.path);
    assert.equal(metadata.openGraph?.siteName, "Brazilian Remix Service");
    assert.equal(metadata.openGraph?.url, `${SITE_URL}${page.path}`);
    assert.equal(metadata.twitter?.card, "summary_large_image");
    const image = metadata.openGraph?.images;
    assert.ok(Array.isArray(image));
    assert.match(String(image[0]?.url), new RegExp(`^${SITE_URL.replaceAll(".", "\\.")}/og/`));
  }
});

test("áreas privadas não aparecem no sitemap", () => {
  const urls = new Set(sitemapEntries().map((entry) => entry.url));
  assert.equal(urls.has(`${SITE_URL}/portal`), false);
  assert.equal(urls.has(`${SITE_URL}/admin`), false);
  assert.equal(buildPageMetadata("portal").robots?.index, false);
  assert.equal(buildPageMetadata("pagamento-sucesso").robots?.index, false);
});

test("links de pastas possuem canonical e imagem compartilhável", () => {
  const metadata = buildAtualizacoesFolderMetadata(["atualizacoes", "setembro-2026"], "Setembro 2026");
  assert.match(metadata.title.absolute, /Setembro 2026.*Brazilian Remix Service$/);
  assert.equal(metadata.alternates.canonical, "/musicas/atualizacoes/atualizacoes/setembro-2026");
  assert.match(String(metadata.openGraph.images[0].url), /\/og\/musicas-atualizacoes$/);
});

test("cartão social é PNG 1200 × 630 acessível sem login", async () => {
  const response = await getSocialCard(new Request(`${SITE_URL}/og/home`), {
    params: Promise.resolve({ slug: "home" }),
  });
  const png = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^image\/png/);
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.equal((await getSocialCard(new Request(`${SITE_URL}/og/segredo`), {
    params: Promise.resolve({ slug: "segredo" }),
  })).status, 404);
});
