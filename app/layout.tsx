import type { Metadata, Viewport } from "next";
import { DM_Sans, Sora } from "next/font/google";
import "./globals.css";
import { BackToTopButton } from "./components/BackToTopButton";
import { MarketingChrome } from "./components/MarketingChrome";
import { JsonLd } from "./components/JsonLd";
import { BRS_LOGO_SRC } from "./lib/branding";
import {
  buildRootMetadata,
  organizationJsonLd,
  serviceJsonLd,
  websiteJsonLd,
} from "./lib/seo";

/** Corpo / UI — DM Sans. */
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-app",
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/** Títulos / display — Sora. */
const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#121212" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${dmSans.variable} ${sora.variable} dark h-full w-full max-w-[100vw] overflow-x-clip bg-[#121212] antialiased`}
    >
      <head>
        <link rel="preload" href={BRS_LOGO_SRC} as="image" type="image/jpeg" />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <JsonLd data={serviceJsonLd()} />
      </head>
      <body
        className="flex min-h-full w-full max-w-[100vw] flex-col overflow-x-clip bg-[#121212] font-sans text-white"
        suppressHydrationWarning
      >
        <MarketingChrome>{children}</MarketingChrome>
        <BackToTopButton />
      </body>
    </html>
  );
}
