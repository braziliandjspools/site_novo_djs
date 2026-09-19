import type { Metadata } from "next";
import { DEEMIX_ENABLED } from "./feature-flags";
import {
  DOWNLOADER_NAME,
  SITE_NAME,
  SITE_PRODUCTION_URL,
  SITE_SHORT,
  SITE_TAGLINE,
} from "./branding";

/** URL canônica do site (produção). Sobrescreva com NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    const cleaned = fromEnv.replace(/\/+$/, "");
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    return `https://${cleaned}`;
  }
  return SITE_PRODUCTION_URL;
})();

export const SITE_LOCALE = "pt_BR";
export const SITE_LANGUAGE = "pt-BR";
export const TWITTER_HANDLE = "@brazilianremixservice";
export const SUPPORT_EMAIL = "brazilianremixservice@gmail.com";

/** Imagem padrão até as artes por página (1200×630). */
export const OG_IMAGE_FALLBACK = "/images/og/default.jpg";

/**
 * Slugs com arquivo já em `public/images/og/{slug}.jpg`.
 * Quando enviar a arte de uma página, coloque o arquivo e adicione o slug aqui.
 */
export const READY_OG_IMAGES = new Set<string>([
  // Ex.: "home", "plans" — ative após salvar public/images/og/{slug}.jpg
]);

export type SeoPageKey =
  | "home"
  | "plans"
  | "deemix"
  | "allavsoft"
  | "musicproducer"
  | "gerador-maiusculas"
  | "portal"
  | "musicas"
  | "musicas-home"
  | "musicas-atualizacoes"
  | "musicas-colecoes"
  | "musicas-artistas"
  | "musicas-estilos"
  | "musicas-entrar"
  | "packs-para-djs"
  | "dj-pool-brasil"
  | "remix-service-brasil"
  | "privacidade"
  | "termos"
  | "privacy-downloader"
  | "privacy-cookies"
  | "privacy-conduct"
  | "admin"
  | "pagamento-sucesso"
  | "pagamento-pendente"
  | "pagamento-erro"
  | "checkout-success"
  | "checkout-pending";

export type SeoPageConfig = {
  key: SeoPageKey;
  /** Path canônico, ex.: "/plans" */
  path: string;
  title: string;
  description: string;
  /** Slug do arquivo OG: /images/og/{ogImage}.jpg */
  ogImage: string;
  keywords?: string[];
  /** noindex para áreas privadas/admin/checkout */
  noIndex?: boolean;
  /** Incluir no sitemap.xml */
  sitemap?: boolean;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  /** lastmod estável (ISO date). Evita new Date() em toda request. */
  lastModified?: string;
};

/** Data de conteúdo estável para páginas institucionais (YYYY-MM-DD). */
export const SEO_STATIC_LASTMOD = "2026-09-16";

const SHARED_KEYWORDS = [
  "Brazilian Remix Service",
  "packs para DJs",
  "remixes para DJs",
  "DJ pool Brasil",
] as const;

export const SEO_PAGES: Record<SeoPageKey, SeoPageConfig> = {
  home: {
    key: "home",
    path: "/",
    title: "Brazilian Remix Service | Packs e Remixes para DJs",
    description:
      "Packs, remixes, remix services, DJ pools, versões extended, edits e coleções organizadas para DJs. Encontre repertório para diferentes pistas e estilos.",
    ogImage: "home",
    keywords: [
      ...SHARED_KEYWORDS,
      "remix service Brasil",
      "músicas para DJ",
      "extended mix",
    ],
    sitemap: true,
    changeFrequency: "weekly",
    priority: 1,
    lastModified: SEO_STATIC_LASTMOD,
  },
  plans: {
    key: "plans",
    path: "/plans",
    title: `Planos VIP e preços | ${SITE_NAME}`,
    description:
      "Planos BRS Drive VIP: teste 3 dias por R$ 3,50 (uma vez), mensal R$ 35,50, trimestral R$ 100 e semestral R$ 200. Acervo completo, plataforma /musicas e Downloader Windows. Pagamento seguro.",
    ogImage: "plans",
    keywords: [...SHARED_KEYWORDS, "plano VIP DJ", "assinatura pools preço"],
    sitemap: true,
    changeFrequency: "monthly",
    priority: 0.95,
    lastModified: SEO_STATIC_LASTMOD,
  },
  deemix: {
    key: "deemix",
    path: "/deemix",
    title: `Deemix | ${SITE_NAME}`,
    description:
      "Deemix no Brazilian Remix Service: baixe e organize músicas com praticidade para ampliar o repertório e preparar sets com mais velocidade.",
    ogImage: "deemix",
    keywords: ["Deemix", "download música DJ"],
    sitemap: DEEMIX_ENABLED,
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: SEO_STATIC_LASTMOD,
  },
  allavsoft: {
    key: "allavsoft",
    path: "/allavsoft",
    title: `Allavsoft vitalício R$ 50 | ${SITE_NAME}`,
    description:
      "Licença Allavsoft vitalícia por R$ 50. Baixe de Spotify, Deezer, YouTube e +1000 sites. Serial liberado no portal após o pagamento.",
    ogImage: "allavsoft",
    keywords: ["Allavsoft", "download Spotify", "download Deezer"],
    sitemap: true,
    changeFrequency: "monthly",
    priority: 0.9,
    lastModified: SEO_STATIC_LASTMOD,
  },
  musicproducer: {
    key: "musicproducer",
    path: "/musicproducer",
    title: `Produção musical sob demanda | ${SITE_NAME}`,
    description:
      "Music Producer BRS: briefing, ideia, letra e entrega de faixas personalizadas para DJs e eventos. Acompanhe o pedido no portal do cliente.",
    ogImage: "musicproducer",
    keywords: ["produção musical sob demanda", "music producer DJ"],
    sitemap: true,
    changeFrequency: "monthly",
    priority: 0.85,
    lastModified: SEO_STATIC_LASTMOD,
  },
  "gerador-maiusculas": {
    key: "gerador-maiusculas",
    path: "/gerador-maiusculas",
    title: `Gerador de maiúsculas online | ${SITE_NAME}`,
    description:
      "Ferramenta gratuita: converta texto para MAIÚSCULO, minúsculo, Title Case, alternado ou invertido. Ideal para tags, pastas e nomes de faixas.",
    ogImage: "home",
    keywords: ["gerador de maiúsculas", "converter maiúsculo minúsculo"],
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.45,
    lastModified: SEO_STATIC_LASTMOD,
  },
  portal: {
    key: "portal",
    path: "/portal",
    title: `Portal do cliente | ${SITE_NAME}`,
    description:
      "Área logada do Brazilian Remix Service: planos, serviços VIP, Allavsoft, produções e suporte.",
    ogImage: "portal",
    noIndex: true,
    sitemap: false,
  },
  musicas: {
    key: "musicas",
    path: "/musicas",
    title: `Biblioteca VIP para DJs | ${SITE_NAME}`,
    description:
      "Central da biblioteca BRS: packs, atualizações, artistas, coleções e repertório organizado para DJs. Navegue o acervo e acesse as novidades VIP.",
    ogImage: "musicas",
    keywords: [...SHARED_KEYWORDS, "biblioteca DJ", "acervo VIP DJ"],
    sitemap: true,
    changeFrequency: "daily",
    priority: 0.9,
    lastModified: SEO_STATIC_LASTMOD,
  },
  "musicas-home": {
    key: "musicas-home",
    path: "/musicas/home",
    title: `Início VIP | ${SITE_NAME}`,
    description: "Redireciona para a biblioteca VIP do Brazilian Remix Service.",
    ogImage: "musicas-home",
    noIndex: true,
    sitemap: false,
  },
  "musicas-atualizacoes": {
    key: "musicas-atualizacoes",
    path: "/musicas/atualizacoes",
    title: "Atualizações para DJs, Remix Services e DJ Pools | BRS",
    description:
      "Atualizações para DJs com remix services, DJ pools, packs, extended mixes, intro edits, funk, sertanejo, eletrônico, flashback e muito mais. Explore o acervo BRS.",
    ogImage: "musicas-atualizacoes",
    keywords: [
      ...SHARED_KEYWORDS,
      "atualizações VIP DJ",
      "extended mix",
      "intro edit",
    ],
    sitemap: true,
    changeFrequency: "daily",
    priority: 0.95,
    lastModified: SEO_STATIC_LASTMOD,
  },
  "musicas-colecoes": {
    key: "musicas-colecoes",
    path: "/musicas/colecoes",
    title: "Coleções para DJs – Remixes, Extended e Clássicos | BRS",
    description:
      "Explore coleções organizadas para DJs com remixes, extended versions, clássicos, flashbacks e diferentes estilos para eventos e pistas.",
    ogImage: "musicas-colecoes",
    keywords: [...SHARED_KEYWORDS, "coleções DJ", "flashback remix"],
    sitemap: true,
    changeFrequency: "weekly",
    priority: 0.85,
    lastModified: SEO_STATIC_LASTMOD,
  },
  "musicas-artistas": {
    key: "musicas-artistas",
    path: "/musicas/artistas",
    title: `Artistas do acervo VIP | ${SITE_NAME}`,
    description:
      "Perfis de artistas do acervo BRS: bios, gêneros e faixas remixadas para DJs. Explore nomes do funk, sertanejo, eletrônico, MPB e mais.",
    ogImage: "musicas",
    keywords: [...SHARED_KEYWORDS, "artistas remix DJ"],
    sitemap: true,
    changeFrequency: "weekly",
    priority: 0.8,
    lastModified: SEO_STATIC_LASTMOD,
  },
  "musicas-estilos": {
    key: "musicas-estilos",
    path: "/musicas/estilos",
    title: `Estilos do acervo VIP | ${SITE_NAME}`,
    description:
      "Estilos do acervo BRS para DJs: funk, sertanejo, eletrônico, flashback e mais. Abra um estilo e encontre remixes e packs em todo o catálogo.",
    ogImage: "musicas",
    keywords: [...SHARED_KEYWORDS, "estilos DJ", "gêneros remix"],
    sitemap: true,
    changeFrequency: "weekly",
    priority: 0.8,
    lastModified: SEO_STATIC_LASTMOD,
  },
  "musicas-entrar": {
    key: "musicas-entrar",
    path: "/musicas/entrar",
    title: `Entrar na plataforma VIP | ${SITE_NAME}`,
    description:
      "Login da plataforma VIP do Brazilian Remix Service. Acesse atualizações, coleções, player e fila do BRS Downloader com sua conta.",
    ogImage: "musicas-entrar",
    noIndex: true,
    sitemap: false,
  },
  "packs-para-djs": {
    key: "packs-para-djs",
    path: "/packs-para-djs",
    title: "Packs para DJs – Remixes, Extended e Edits | BRS",
    description:
      "Explore packs para DJs com remixes, versões extended, intro edits, funk, sertanejo, eletrônico, flashback e outros estilos organizados para diferentes pistas.",
    ogImage: "home",
    keywords: [
      "packs para DJs",
      "pack funk DJ",
      "pack sertanejo DJ",
      "extended mix",
      "intro edit",
    ],
    sitemap: true,
    changeFrequency: "weekly",
    priority: 0.92,
    lastModified: SEO_STATIC_LASTMOD,
  },
  "dj-pool-brasil": {
    key: "dj-pool-brasil",
    path: "/dj-pool-brasil",
    title: "DJ Pool Brasil – Pools, Remixes e Atualizações | BRS",
    description:
      "DJ pools para DJs no Brasil: atualizações, remixes, edits e packs organizados no acervo BRS. Conheça o fluxo de pools e acesse as novidades VIP.",
    ogImage: "home",
    keywords: ["DJ pool Brasil", "DJ pools", "remix service Brasil", "pools DJ"],
    sitemap: true,
    changeFrequency: "weekly",
    priority: 0.9,
    lastModified: SEO_STATIC_LASTMOD,
  },
  "remix-service-brasil": {
    key: "remix-service-brasil",
    path: "/remix-service-brasil",
    title: "Remix Service Brasil – Remixes e Edits para DJs | BRS",
    description:
      "Remix service para DJs: extended mixes, intro edits, clean/dirty, bootlegs e versões prontas para a pista. Veja como o acervo BRS organiza o repertório.",
    ogImage: "home",
    keywords: ["remix service Brasil", "remixes para DJs", "intro edit", "clean edit"],
    sitemap: true,
    changeFrequency: "weekly",
    priority: 0.9,
    lastModified: SEO_STATIC_LASTMOD,
  },
  privacidade: {
    key: "privacidade",
    path: "/privacidade",
    title: `Política de Privacidade | ${SITE_NAME}`,
    description:
      "Como o Brazilian Remix Service trata dados pessoais, conta, pagamentos Mercado Pago e suporte aos assinantes.",
    ogImage: "privacidade",
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.3,
    lastModified: SEO_STATIC_LASTMOD,
  },
  termos: {
    key: "termos",
    path: "/termos",
    title: `Termos de Serviço | ${SITE_NAME}`,
    description:
      "Termos de Serviço da Brazilian Remix Service: conta VIP, BRS Downloader, direitos autorais, LGPD, Cloudflare, Google Drive, OneSignal e IA.",
    ogImage: "termos",
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.3,
    lastModified: SEO_STATIC_LASTMOD,
  },
  "privacy-downloader": {
    key: "privacy-downloader",
    path: "/privacy/downloader",
    title: `Privacidade do ${DOWNLOADER_NAME} | ${SITE_NAME}`,
    description:
      "Política de privacidade do app BRS Downloader para Windows: autenticação, dados locais e sincronização com a conta VIP.",
    ogImage: "privacy-downloader",
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.3,
    lastModified: SEO_STATIC_LASTMOD,
  },
  "privacy-cookies": {
    key: "privacy-cookies",
    path: "/privacy/cookies",
    title: `Política de Cookies | ${SITE_NAME}`,
    description:
      "Cookies usados no site Brazilian Remix Service: sessão, preferências e finalidade de cada tipo.",
    ogImage: "privacy-cookies",
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.25,
    lastModified: SEO_STATIC_LASTMOD,
  },
  "privacy-conduct": {
    key: "privacy-conduct",
    path: "/privacy/conduct",
    title: `Código de Conduta | ${SITE_NAME}`,
    description:
      "Código de conduta da comunidade Brazilian Remix Service, plataforma VIP e BRS Downloader.",
    ogImage: "privacy-conduct",
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.25,
    lastModified: SEO_STATIC_LASTMOD,
  },
  admin: {
    key: "admin",
    path: "/admin",
    title: `Admin | ${SITE_NAME}`,
    description: "Painel administrativo Brazilian Remix Service.",
    ogImage: "admin",
    noIndex: true,
    sitemap: false,
  },
  "pagamento-sucesso": {
    key: "pagamento-sucesso",
    path: "/pagamento/sucesso",
    title: `Pagamento confirmado | ${SITE_NAME}`,
    description: "Retorno de pagamento Mercado Pago.",
    ogImage: "home",
    noIndex: true,
    sitemap: false,
  },
  "pagamento-pendente": {
    key: "pagamento-pendente",
    path: "/pagamento/pendente",
    title: `Pagamento pendente | ${SITE_NAME}`,
    description: "Retorno de pagamento Mercado Pago.",
    ogImage: "home",
    noIndex: true,
    sitemap: false,
  },
  "pagamento-erro": {
    key: "pagamento-erro",
    path: "/pagamento/erro",
    title: `Pagamento não concluído | ${SITE_NAME}`,
    description: "Retorno de pagamento Mercado Pago.",
    ogImage: "home",
    noIndex: true,
    sitemap: false,
  },
  "checkout-success": {
    key: "checkout-success",
    path: "/checkout/success",
    title: `Checkout | ${SITE_NAME}`,
    description: "Retorno legado de checkout.",
    ogImage: "home",
    noIndex: true,
    sitemap: false,
  },
  "checkout-pending": {
    key: "checkout-pending",
    path: "/checkout/pending",
    title: `Checkout pendente | ${SITE_NAME}`,
    description: "Retorno legado de checkout.",
    ogImage: "home",
    noIndex: true,
    sitemap: false,
  },
};

function absoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveOgImagePath(ogImageSlug: string) {
  if (READY_OG_IMAGES.has(ogImageSlug)) {
    return `/images/og/${ogImageSlug}.jpg`;
  }
  return OG_IMAGE_FALLBACK;
}

export function buildPageMetadata(key: SeoPageKey, overrides?: Partial<Metadata>): Metadata {
  const page = SEO_PAGES[key];
  const canonical = absoluteUrl(page.path);
  const ogImage = absoluteUrl(resolveOgImagePath(page.ogImage));
  const title = page.title;
  const description = page.description;

  const base: Metadata = {
    title: {
      absolute: title,
    },
    description,
    keywords: page.keywords,
    alternates: {
      canonical: page.path,
    },
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
    robots: page.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };

  return {
    ...base,
    ...overrides,
    openGraph: {
      ...base.openGraph,
      ...(overrides?.openGraph ?? {}),
      images: overrides?.openGraph?.images ?? base.openGraph?.images,
    },
    twitter: {
      ...base.twitter,
      ...(overrides?.twitter ?? {}),
    },
  };
}

export function buildRootMetadata(): Metadata {
  const home = SEO_PAGES.home;
  const ogImage = absoluteUrl(resolveOgImagePath(home.ogImage));

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: home.title,
      template: `%s | ${SITE_NAME}`,
    },
    description:
      "Plataforma para DJs com packs, remixes, remix services, DJ pools, versões extended, intro edits, coleções e atualizações para diferentes estilos e pistas.",
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "music",
    keywords: home.keywords,
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [{ url: "/images/logo.png", type: "image/png" }],
      apple: [{ url: "/images/logo.png" }],
      shortcut: ["/images/logo.png"],
    },
    manifest: "/site.webmanifest",
    appleWebApp: {
      capable: true,
      title: "BRS VIP",
      statusBarStyle: "black-translucent",
    },
    alternates: {
      canonical: "/",
      languages: {
        "pt-BR": SITE_URL,
      },
    },
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      url: SITE_URL,
      siteName: SITE_NAME,
      title: home.title,
      description: home.description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: home.title,
      description: home.description,
      images: [ogImage],
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    other: {
      "og:locale:alternate": "pt_BR",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: [SITE_SHORT, "BRS Drive", "Brazilian Remix Service VIP"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/images/logo.png"),
    },
    image: absoluteUrl("/images/og/default.jpg"),
    description: SITE_TAGLINE,
    email: SUPPORT_EMAIL,
    areaServed: {
      "@type": "Country",
      name: "Brazil",
    },
    sameAs: [] as string[],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SUPPORT_EMAIL,
        availableLanguage: ["Portuguese", "pt-BR"],
        url: absoluteUrl("/plans"),
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: SITE_SHORT,
    url: SITE_URL,
    description: SEO_PAGES.home.description,
    inLanguage: SITE_LANGUAGE,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function serviceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE_URL}/#vip-service`,
    name: `${SITE_NAME} — BRS Drive VIP`,
    serviceType: "Assinatura de acervo musical para DJs",
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: "BR",
    url: absoluteUrl("/plans"),
    description: SEO_PAGES.plans.description,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: "3.50",
      highPrice: "200.00",
      offerCount: 4,
      url: absoluteUrl("/plans"),
      availability: "https://schema.org/InStock",
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: DOWNLOADER_NAME,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Windows 10+",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
      description: "Incluso na assinatura VIP ativa",
    },
    description:
      "Aplicativo Windows do Brazilian Remix Service para baixar packs e faixas da plataforma VIP com login da conta.",
    url: absoluteUrl("/plans"),
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function plansProductJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "BRS Drive VIP",
    description: SEO_PAGES.plans.description,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    url: absoluteUrl("/plans"),
    image: absoluteUrl(resolveOgImagePath("plans")),
    category: "Music subscription",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: "3.50",
      highPrice: "200.00",
      offerCount: 4,
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/plans"),
    },
  };
}

export function allavsoftProductJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Allavsoft — Licença vitalícia",
    description: SEO_PAGES.allavsoft.description,
    brand: {
      "@type": "Brand",
      name: "Allavsoft",
    },
    url: absoluteUrl("/allavsoft"),
    image: absoluteUrl(resolveOgImagePath("allavsoft")),
    offers: {
      "@type": "Offer",
      price: "50.00",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/allavsoft"),
      priceValidUntil: "2027-12-31",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function sitemapEntries() {
  return Object.values(SEO_PAGES)
    .filter((page) => page.sitemap !== false && !page.noIndex)
    .map((page) => ({
      url: absoluteUrl(page.path),
      ...(page.lastModified
        ? { lastModified: new Date(`${page.lastModified}T12:00:00.000Z`) }
        : {}),
      changeFrequency: page.changeFrequency ?? "monthly",
      priority: page.priority ?? 0.5,
    }));
}

/**
 * Sitemap completo: SEO_PAGES + pastas aninhadas de /musicas/atualizacoes + artistas featured.
 * Pastas vêm do catálogo VIP (Drive com cache Next) — falha silenciosa se indisponível.
 */
export async function buildFullSitemap(): Promise<
  Array<{
    url: string;
    lastModified?: Date;
    changeFrequency?: SeoPageConfig["changeFrequency"];
    priority?: number;
  }>
> {
  const staticEntries = sitemapEntries();
  const seen = new Set(staticEntries.map((entry) => entry.url));
  const dynamic: typeof staticEntries = [];

  try {
    const { listVipMusicAtualizacoesSitemapPaths } = await import("./vip-music-catalog");
    const { folderHref } = await import("./vip-music-slugs");
    const folders = await listVipMusicAtualizacoesSitemapPaths();
    for (const folder of folders) {
      const path = folderHref(folder.segments);
      const url = absoluteUrl(path);
      if (seen.has(url)) continue;
      seen.add(url);
      const yearMatch = folder.label.match(/\b(20\d{2})\b/);
      const isCurrentYear = yearMatch?.[1] === "2026";
      const priority =
        folder.depth === 1
          ? isCurrentYear
            ? 0.9
            : 0.78
          : folder.depth === 2
            ? 0.72
            : folder.depth === 3
              ? 0.64
              : 0.55;
      dynamic.push({
        url,
        changeFrequency: folder.depth <= 2 ? "weekly" : "monthly",
        priority,
      });
    }
  } catch {
    /* Drive/index indisponível no build — mantém estático */
  }

  try {
    const { listFeaturedKnownArtists } = await import("./vip-known-artists");
    const { artistsHref } = await import("./vip-music-slugs");
    for (const artist of listFeaturedKnownArtists()) {
      const path = artistsHref(artist.slug);
      const url = absoluteUrl(path);
      if (seen.has(url)) continue;
      seen.add(url);
      dynamic.push({
        url,
        changeFrequency: "monthly",
        priority: 0.65,
      });
    }
  } catch {
    /* catálogo de artistas indisponível */
  }

  try {
    const { listVipMusicStyles } = await import("./vip-style-tracks");
    const { stylesHref } = await import("./vip-music-slugs");
    const styles = await listVipMusicStyles();
    for (const style of styles) {
      const path = stylesHref(style.slug);
      const url = absoluteUrl(path);
      if (seen.has(url)) continue;
      seen.add(url);
      dynamic.push({
        url,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    /* estilos VIP indisponíveis no build */
  }

  return [...staticEntries, ...dynamic];
}

/** Metadata dinâmica para pastas de /musicas/atualizacoes/[...slug]. */
export function buildAtualizacoesFolderMetadata(segments: string[], folderLabel: string) {
  const path = `/musicas/atualizacoes/${segments.map(encodeURIComponent).join("/")}`;
  const trailLabels = segments.map((segment) =>
    displayFolderLabelFromSlug(segment),
  );
  const trail = trailLabels.join(" › ");
  const yearFromTrail = trail.match(/\b(20\d{2})\b/);
  const yearMatch = folderLabel.match(/\b(20\d{2})\b/) ?? yearFromTrail;
  const isPackRoot = segments.length === 1;
  const isStyleLeaf = segments.length >= 3;
  const title = isPackRoot
    ? yearMatch
      ? `Packs para DJs ${yearMatch[1]} – Remixes, Extended e Edits | BRS`
      : `${folderLabel} – Packs e Remixes para DJs | BRS`
    : isStyleLeaf
      ? `${folderLabel} – ${trailLabels[0] ?? "Atualizações"} | BRS`
      : `${folderLabel} – Atualizações para DJs | BRS`;
  const description = isPackRoot
    ? yearMatch
      ? `Packs para DJs atualizados em ${yearMatch[1]} com remixes, versões extended, intro edits, funk, sertanejo, eletrônico, open format e muito mais no acervo BRS.`
      : `Explore ${folderLabel} no acervo BRS: packs, remixes, extended mixes, intro edits e pastas organizadas para DJs.`
    : `Confira ${folderLabel} em ${trail} nas atualizações BRS: DJ pools, remix services, edits, remixes e versões para DJs.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website" as const,
      locale: SITE_LOCALE,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: absoluteUrl(resolveOgImagePath("musicas-atualizacoes")),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [absoluteUrl(resolveOgImagePath("musicas-atualizacoes"))],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function displayFolderLabelFromSlug(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function collectionPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: SITE_LANGUAGE,
  };
}

export function itemListJsonLd(input: {
  name: string;
  path: string;
  items: { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    url: absoluteUrl(input.path),
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

export function musicArtistJsonLd(input: {
  name: string;
  description: string;
  path: string;
  imageUrl?: string | null;
  genres?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    ...(input.imageUrl ? { image: absoluteUrl(input.imageUrl) } : {}),
    ...(input.genres?.length ? { genre: input.genres } : {}),
    inLanguage: SITE_LANGUAGE,
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

/** Lista de artes OG esperadas (para documentação / checklist). */
export function expectedOgAssets() {
  const slugs = new Set<string>(["default"]);
  for (const page of Object.values(SEO_PAGES)) {
    if (!page.noIndex) slugs.add(page.ogImage);
  }
  return [...slugs].sort().map((slug) => ({
    slug,
    file: `public/images/og/${slug}.jpg`,
    url: `/images/og/${slug}.jpg`,
    ready: slug === "default" || READY_OG_IMAGES.has(slug),
  }));
}

/** Paths bloqueados no robots.txt (além do noindex nas pages). */
export const ROBOTS_DISALLOW = [
  "/admin",
  "/api/",
  "/portal",
  "/musicas/home",
  "/musicas/entrar",
  "/musicas/dl/",
  "/pagamento/",
  "/checkout/",
] as const;
