import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";
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

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${sora.variable} ${dmSans.variable} h-full w-full max-w-[100vw] overflow-x-clip antialiased`}
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
