import type { Metadata } from "next";
import { DEEMIX_ENABLED } from "./feature-flags";
import { SITE_NAME, SITE_SHORT, SITE_TAGLINE } from "./branding";

/** URL canônica do site (produção). Sobrescreva com NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) {
    return (vercel.startsWith("http") ? vercel : `https://${vercel}`).replace(/\/+$/, "");
  }
  return "https://sitenovodjs.vercel.app";
})();

export const SITE_LOCALE = "pt_BR";
export const TWITTER_HANDLE = "@brazilianremixservice";

/** Imagem padrão até você enviar as artes por página (1200×630). */
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
  | "portal"
  | "musicas"
  | "musicas-home"
  | "musicas-atualizacoes"
  | "musicas-colecoes"
  | "musicas-entrar"
  | "privacidade"
  | "termos"
  | "privacy-downloader"
  | "privacy-cookies"
  | "privacy-conduct"
  | "admin";

export type SeoPageConfig = {
  key: SeoPageKey;
  /** Path canônico, ex.: "/plans" */
  path: string;
  title: string;
  description: string;
  /** Slug do arquivo OG: /images/og/{ogImage}.jpg */
  ogImage: string;
  keywords?: string[];
  /** noindex para áreas privadas/admin */
  noIndex?: boolean;
  /** Incluir no sitemap.xml */
  sitemap?: boolean;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

export const SEO_PAGES: Record<SeoPageKey, SeoPageConfig> = {
  home: {
    key: "home",
    path: "/",
    title: `${SITE_NAME} | Pools, curadoria e remix services para DJs`,
    description:
      "Acervo com mais de 400 pools e remix services curados para DJs no Brasil. Atualizações mensais, Google Drive, FTP e plataforma VIP para montar sets com praticidade.",
    ogImage: "home",
    keywords: [
      "Brazilian Remix Service",
      "pools DJ",
      "remix service Brasil",
      "edits DJ",
      "packs DJ",
      "curadoria musical",
    ],
    sitemap: true,
    changeFrequency: "weekly",
    priority: 1,
  },
  plans: {
    key: "plans",
    path: "/plans",
    title: `Planos VIP | ${SITE_NAME}`,
    description:
      "Assine o plano VIP do Brazilian Remix Service: 1 mês, 3 meses ou 1 ano. Acesso ao acervo, ferramentas inclusas e atualizações frequentes.",
    ogImage: "plans",
    keywords: ["plano VIP DJ", "assinatura pools", "Brazilian Remix Service preço"],
    sitemap: true,
    changeFrequency: "monthly",
    priority: 0.9,
  },
  deemix: {
    key: "deemix",
    path: "/deemix",
    title: `Deemix | ${SITE_NAME}`,
    description:
      "Deemix incluso no Brazilian Remix Service: baixe e organize músicas com praticidade para ampliar seu repertório e preparar sets com mais velocidade.",
    ogImage: "deemix",
    keywords: ["Deemix", "download música DJ", "Deemix Server"],
    sitemap: DEEMIX_ENABLED,
    changeFrequency: "monthly",
    priority: 0.7,
  },
  allavsoft: {
    key: "allavsoft",
    path: "/allavsoft",
    title: `Allavsoft | ${SITE_NAME}`,
    description:
      "Allavsoft incluso no acesso: baixe vídeos e áudios de diversas plataformas, converta arquivos e centralize seus downloads para a pista.",
    ogImage: "allavsoft",
    keywords: ["Allavsoft", "download vídeo DJ", "conversor áudio"],
    sitemap: true,
    changeFrequency: "monthly",
    priority: 0.7,
  },
  musicproducer: {
    key: "musicproducer",
    path: "/musicproducer",
    title: `Music Producer | ${SITE_NAME}`,
    description:
      "Produção musical sob demanda com o Brazilian Remix Service. Envie seu briefing, acompanhe entregas e receba faixas personalizadas para seus projetos.",
    ogImage: "musicproducer",
    keywords: ["produção musical", "music producer", "música sob encomenda"],
    sitemap: true,
    changeFrequency: "monthly",
    priority: 0.8,
  },
  portal: {
    key: "portal",
    path: "/portal",
    title: `Portal do Cliente | ${SITE_NAME}`,
    description:
      "Área do cliente Brazilian Remix Service: gerencie plano, serviços VIP, produções musicais e suporte em um só lugar.",
    ogImage: "portal",
    keywords: ["portal VIP", "área do cliente DJ"],
    sitemap: true,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  musicas: {
    key: "musicas",
    path: "/musicas",
    title: `Plataforma de Músicas | ${SITE_NAME}`,
    description:
      "Plataforma VIP do Brazilian Remix Service: ouça e baixe atualizações, coleções e packs organizados para DJs.",
    ogImage: "musicas",
    keywords: ["plataforma VIP músicas", "baixar packs DJ", "atualizações pools"],
    sitemap: true,
    changeFrequency: "daily",
    priority: 0.95,
  },
  "musicas-home": {
    key: "musicas-home",
    path: "/musicas/home",
    title: `Início — Plataforma VIP | ${SITE_NAME}`,
    description:
      "Painel inicial da plataforma de músicas: acervo VIP, atualizações e atalhos para baixar e ouvir packs do Brazilian Remix Service.",
    ogImage: "musicas-home",
    keywords: ["plataforma músicas DJ", "acervo VIP"],
    sitemap: true,
    changeFrequency: "daily",
    priority: 0.9,
  },
  "musicas-atualizacoes": {
    key: "musicas-atualizacoes",
    path: "/musicas/atualizacoes",
    title: `Atualizações — Plataforma VIP | ${SITE_NAME}`,
    description:
      "Atualizações mensais do acervo VIP: packs, edits e remixes organizados por período e estilo para DJs.",
    ogImage: "musicas-atualizacoes",
    keywords: ["atualizações pools", "novos packs DJ", "edits do mês"],
    sitemap: true,
    changeFrequency: "daily",
    priority: 0.9,
  },
  "musicas-colecoes": {
    key: "musicas-colecoes",
    path: "/musicas/colecoes",
    title: `Coleções — Plataforma VIP | ${SITE_NAME}`,
    description:
      "Coleções e pastas especiais do acervo VIP Brazilian Remix Service para montar sets com repertório organizado.",
    ogImage: "musicas-colecoes",
    keywords: ["coleções DJ", "pastas VIP", "repertório organizado"],
    sitemap: true,
    changeFrequency: "weekly",
    priority: 0.75,
  },
  "musicas-entrar": {
    key: "musicas-entrar",
    path: "/musicas/entrar",
    title: `Entrar na Plataforma | ${SITE_NAME}`,
    description:
      "Faça login na plataforma VIP do Brazilian Remix Service para ouvir e baixar atualizações do acervo.",
    ogImage: "musicas-entrar",
    keywords: ["login VIP", "entrar plataforma músicas"],
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.5,
  },
  privacidade: {
    key: "privacidade",
    path: "/privacidade",
    title: `Política de Privacidade | ${SITE_NAME}`,
    description:
      "Saiba como o Brazilian Remix Service trata dados pessoais, contato, pagamento e suporte aos assinantes.",
    ogImage: "privacidade",
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.3,
  },
  termos: {
    key: "termos",
    path: "/termos",
    title: `Termos de Serviço | ${SITE_NAME}`,
    description:
      "Termos de uso do Brazilian Remix Service: acesso ao acervo, planos, responsabilidades e regras da plataforma.",
    ogImage: "termos",
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.3,
  },
  "privacy-downloader": {
    key: "privacy-downloader",
    path: "/privacy/downloader",
    title: `Privacidade — BRS Downloader | ${SITE_NAME}`,
    description:
      "Política de privacidade do aplicativo BRS Downloader: dados coletados, autenticação e uso no desktop.",
    ogImage: "privacy-downloader",
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.3,
  },
  "privacy-cookies": {
    key: "privacy-cookies",
    path: "/privacy/cookies",
    title: `Política de Cookies | ${SITE_NAME}`,
    description:
      "Política de cookies da Brazilian Remix Service: tipos utilizados, finalidade e preferências do visitante.",
    ogImage: "privacy-cookies",
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.3,
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
    priority: 0.3,
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
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      site: TWITTER_HANDLE,
    },
    robots: page.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
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
      template: `%s | ${SITE_SHORT}`,
    },
    description: home.description,
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
    alternates: {
      canonical: "/",
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
    name: SITE_NAME,
    alternateName: SITE_SHORT,
    url: SITE_URL,
    logo: absoluteUrl("/images/logo.png"),
    description: SITE_TAGLINE,
    sameAs: [] as string[],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: ["Portuguese"],
        url: absoluteUrl("/portal"),
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SEO_PAGES.home.description,
    inLanguage: "pt-BR",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: absoluteUrl("/images/logo.png"),
    },
  };
}

export function serviceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${SITE_NAME} VIP`,
    serviceType: "Music library subscription for DJs",
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: "BR",
    url: absoluteUrl("/plans"),
    description: SEO_PAGES.plans.description,
  };
}

export function sitemapEntries() {
  return Object.values(SEO_PAGES)
    .filter((page) => page.sitemap !== false && !page.noIndex)
    .map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: new Date(),
      changeFrequency: page.changeFrequency ?? "monthly",
      priority: page.priority ?? 0.5,
    }));
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
