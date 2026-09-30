import { ImageResponse } from "next/og";
import { SEO_PAGES, SITE_URL } from "../../lib/seo";

const cardTopics: Record<string, string> = {
  home: "O repertório certo para cada pista",
  plans: "Seu próximo set começa aqui",
  musicas: "Explore o acervo BRS",
  "musicas-atualizacoes": "Atualizações para DJs",
  allavsoft: "Allavsoft na BRS",
  musicproducer: "Sua música produzida do zero",
  deemix: "Deemix na BRS",
  "packs-para-djs": "Packs para DJs",
  "dj-pool-brasil": "DJ Pools para sua pista",
  "remix-service-brasil": "Remix Services e edits",
  "gerador-maiusculas": "Ferramentas para DJs",
  privacidade: "Privacidade e transparência",
  termos: "Termos de serviço",
  "privacy-downloader": "Privacidade do Downloader",
  "privacy-cookies": "Política de cookies",
  "privacy-conduct": "Nossa comunidade",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = Object.values(SEO_PAGES).find((item) => !item.noIndex && item.ogImage === slug);
  if (!page) return new Response("Imagem não encontrada", { status: 404 });

  const topic = cardTopics[slug] ?? page.title.split("|")[0].trim();
  const isHome = slug === "home";
  const firstSentence = page.description.split(/(?<=\.)\s/)[0];
  const summary = firstSentence.length > 120
    ? `${firstSentence.slice(0, 117).replace(/\s+\S*$/, "").trimEnd()}…`
    : firstSentence;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "52px 64px",
        color: "#f7fff9",
        background: "linear-gradient(135deg, #060b08 0%, #101c13 62%, #0b140e 100%)",
        border: "2px solid #25472e",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 112,
              height: 74,
              borderRadius: 14,
              background: "#1ed760",
              color: "#061009",
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: -3,
            }}
          >
            BRS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>BRAZILIAN REMIX SERVICE</div>
            <div style={{ fontSize: 19, color: "#84d99c", letterSpacing: 3 }}>POOLS · EDITS · REMIXES</div>
          </div>
        </div>
        <div style={{ width: 13, height: 13, borderRadius: 7, background: "#1ed760" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1000 }}>
        <div style={{ width: 100, height: 6, borderRadius: 3, background: "#1ed760" }} />
        <div style={{ fontSize: isHome ? 68 : 64, lineHeight: 1.1, fontWeight: 800, letterSpacing: -2 }}>
          {topic}
        </div>
        <div style={{ fontSize: 27, lineHeight: 1.35, color: "#b7c9ba", maxWidth: 950 }}>
          {isHome
            ? "Packs, remixes e atualizações organizados para DJs."
            : summary}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 22 }}>
        <div style={{ color: "#1ed760", fontWeight: 700 }}>PARA DJs QUE VIVEM A PISTA</div>
        <div style={{ color: "#8fa994" }}>{new URL(SITE_URL).host}</div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
