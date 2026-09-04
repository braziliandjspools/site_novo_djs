import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, Roboto } from "next/font/google";
import "./globals.css";
import { MarketingChrome } from "./components/MarketingChrome";
import { JsonLd } from "./components/JsonLd";
import { BRS_LOGO_SRC } from "./lib/branding";
import {
  buildRootMetadata,
  organizationJsonLd,
  serviceJsonLd,
  websiteJsonLd,
} from "./lib/seo";

const bebasNeue = Bebas_Neue({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400"],
});

const roboto = Roboto({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-player",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${bebasNeue.variable} ${roboto.variable} ${dmSans.variable} h-full w-full max-w-[100vw] overflow-x-clip antialiased`}
    >
      <head>
        <link rel="preload" href={BRS_LOGO_SRC} as="image" type="image/jpeg" />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <JsonLd data={serviceJsonLd()} />
      </head>
      <body className="flex min-h-full w-full max-w-[100vw] flex-col overflow-x-clip bg-[#121212] text-white font-sans" suppressHydrationWarning>
        <MarketingChrome>{children}</MarketingChrome>
      </body>
    </html>
  );
}
