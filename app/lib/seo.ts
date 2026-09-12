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
  | "musicas-entrar"
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
};

const SHARED_KEYWORDS = [
  "Brazilian Remix Service",
  "BRS",
  "pools DJ Brasil",
  "remix service DJ",
  "edits DJ",
  "packs DJ",
  "acervo VIP DJ",
  "Downloader DJ Windows",
] as const;

export const SEO_PAGES: Record<SeoPageKey, SeoPageConfig> = {
  home: {
    key: "home",
    path: "/",
    title: `${SITE_NAME} | Pools, edits e remixes para DJs`,
    description:
      "Acervo VIP para DJs no Brasil: pools, edits, extended e remixes curados, atualizações mensais, plataforma online e BRS Downloader. Assine a partir de R$ 38/mês via Mercado Pago.",
    ogImage: "home",
    keywords: [
      ...SHARED_KEYWORDS,
      "assinatura pools DJ",
      "plataforma músicas DJ",
      "Mercado Pago VIP",
    ],
    sitemap: true,
    changeFrequency: "weekly",
    priority: 1,
  },
  plans: {
    key: "plans",
    path: "/plans",
    title: `Planos VIP e preços | ${SITE_NAME}`,
    description:
      "Planos BRS Drive VIP: teste 3 dias por R$ 1, mensal R$ 38, trimestral e anual. Acervo completo, plataforma /musicas e Downloader Windows. Pagamento seguro no Mercado Pago.",
    ogImage: "plans",
    keywords: [
      ...SHARED_KEYWORDS,
      "plano VIP DJ",
      "assinatura pools preço",
      "BRS Drive VIP",
      "teste 3 dias",
      "Mercado Pago",
    ],
    sitemap: true,
    changeFrequency: "monthly",
    priority: 0.95,
  },
  deemix: {
    key: "deemix",
    path: "/deemix",
    title: `Deemix | ${SITE_NAME}`,
    description:
      "Deemix no Brazilian Remix Service: baixe e organize músicas com praticidade para ampliar o repertório e preparar sets com mais velocidade.",
    ogImage: "deemix",
    keywords: ["Deemix", "download música DJ", "Deemix Server", "ARL 320"],
    sitemap: DEEMIX_ENABLED,
    changeFrequency: "monthly",
    priority: 0.7,
  },
  allavsoft: {
    key: "allavsoft",
    path: "/allavsoft",
    title: `Allavsoft vitalício R$ 50 | ${SITE_NAME}`,
    description:
      "Licença Allavsoft vitalícia por R$ 50. Baixe de Spotify, Deezer, YouTube e +1000 sites. Serial liberado no portal após pagamento no Mercado Pago.",
    ogImage: "allavsoft",
    keywords: [
      "Allavsoft",
      "Allavsoft vitalício",
      "download Spotify",
      "download Deezer",
      "download YouTube",
      "licença Allavsoft Brasil",
    ],
    sitemap: true,
    changeFrequency: "monthly",
    priority: 0.9,
  },
  musicproducer: {
    key: "musicproducer",
    path: "/musicproducer",
    title: `Produção musical sob demanda | ${SITE_NAME}`,
    description:
      "Music Producer BRS: briefing, ideia, letra e entrega de faixas personalizadas para DJs e eventos. Acompanhe o pedido no portal do cliente.",
    ogImage: "musicproducer",
    keywords: [
      "produção musical sob demanda",
      "music producer DJ",
      "música personalizada",
      "remix sob encomenda",
      "briefing musical",
    ],
    sitemap: true,
    changeFrequency: "monthly",
    priority: 0.85,
  },
  "gerador-maiusculas": {
    key: "gerador-maiusculas",
    path: "/gerador-maiusculas",
    title: `Gerador de maiúsculas online | ${SITE_NAME}`,
    description:
      "Ferramenta gratuita: converta texto para MAIÚSCULO, minúsculo, Title Case, alternado ou invertido. Ideal para tags, pastas e nomes de faixas.",
    ogImage: "home",
    keywords: [
      "gerador de maiúsculas",
      "converter maiúsculo minúsculo",
      "title case online",
      "caixa alta",
      "caixa baixa",
    ],
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.45,
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
    title: `Plataforma VIP de músicas | ${SITE_NAME}`,
    description:
      "Área VIP para ouvir e baixar packs, atualizações e coleções do Brazilian Remix Service.",
    ogImage: "musicas",
    noIndex: true,
    sitemap: false,
  },
  "musicas-home": {
    key: "musicas-home",
    path: "/musicas/home",
    title: `Início VIP | ${SITE_NAME}`,
    description: "Painel inicial da plataforma VIP de músicas BRS.",
    ogImage: "musicas-home",
    noIndex: true,
    sitemap: false,
  },
  "musicas-atualizacoes": {
    key: "musicas-atualizacoes",
    path: "/musicas/atualizacoes",
    title: `Atualizações VIP | ${SITE_NAME}`,
    description: "Atualizações mensais do acervo VIP Brazilian Remix Service.",
    ogImage: "musicas-atualizacoes",
    noIndex: true,
    sitemap: false,
  },
  "musicas-colecoes": {
    key: "musicas-colecoes",
    path: "/musicas/colecoes",
    title: `Coleções VIP | ${SITE_NAME}`,
    description: "Coleções e pastas especiais do acervo VIP BRS.",
    ogImage: "musicas-colecoes",
    noIndex: true,
    sitemap: false,
  },
  "musicas-entrar": {
    key: "musicas-entrar",
    path: "/musicas/entrar",
    title: `Entrar na plataforma VIP | ${SITE_NAME}`,
    description:
      "Login da plataforma VIP do Brazilian Remix Service. Acesse atualizações, coleções, player e fila do BRS Downloader com sua conta.",
    ogImage: "musicas-entrar",
    keywords: [
      "login VIP BRS",
      "entrar plataforma músicas",
      "login Brazilian Remix Service",
    ],
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.55,
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
  },
  termos: {
    key: "termos",
    path: "/termos",
    title: `Termos de Serviço | ${SITE_NAME}`,
    description:
      "Termos de uso do Brazilian Remix Service: acesso ao acervo VIP, planos, responsabilidades e regras da plataforma.",
    ogImage: "termos",
    sitemap: true,
    changeFrequency: "yearly",
    priority: 0.3,
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
      lowPrice: "1.00",
      highPrice: "384.00",
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
      lowPrice: "1.00",
      highPrice: "384.00",
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

/** Paths bloqueados no robots.txt (além do noindex nas pages). */
export const ROBOTS_DISALLOW = [
  "/admin",
  "/api/",
  "/portal",
  "/musicas/home",
  "/musicas/atualizacoes",
  "/musicas/colecoes",
  "/musicas/dl/",
  "/pagamento/",
  "/checkout/",
] as const;
