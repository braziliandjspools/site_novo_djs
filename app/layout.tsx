import type { Metadata } from "next";
import { Inter } from "next/font/google";
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

/** Tipografia única do app — estilo streaming moderno (próximo ao Flow Music). */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-app",
});

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} h-full w-full max-w-[100vw] overflow-x-clip antialiased`}
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
