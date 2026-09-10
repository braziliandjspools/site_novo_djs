import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
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

/** Tipografia única do app — Google Sans Flex. */
const appFont = Google_Sans_Flex({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-app",
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${appFont.variable} h-full w-full max-w-[100vw] overflow-x-clip antialiased`}
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
