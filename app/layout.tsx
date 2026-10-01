import type { Metadata, Viewport } from "next";
import { Barlow, DM_Sans, Plus_Jakarta_Sans, Sora, Space_Mono } from "next/font/google";
import "./globals.css";
import { BackToTopButton } from "./components/BackToTopButton";
import { MarketingChrome } from "./components/MarketingChrome";
import { JsonLd } from "./components/JsonLd";
import { OneSignalProvider } from "./components/OneSignalInit";
import { PwaRegister } from "./components/PwaRegister";
import { BRS_LOGO_SRC } from "./lib/branding";
import {
  buildRootMetadata,
  organizationJsonLd,
  serviceJsonLd,
  softwareApplicationJsonLd,
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

/** Player / faixas — Plus Jakarta Sans. */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-player-face",
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const barlow = Barlow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space",
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
      className={`${dmSans.variable} ${sora.variable} ${plusJakarta.variable} ${spaceMono.variable} ${barlow.variable} dark h-full w-full max-w-[100vw] overflow-x-clip bg-[#121212] antialiased`}
    >
      <head>
        <link rel="icon" href={BRS_LOGO_SRC} type="image/jpeg" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <JsonLd data={serviceJsonLd()} />
        <JsonLd data={softwareApplicationJsonLd()} />
      </head>
      <body
        className="flex min-h-full w-full max-w-[100vw] flex-col overflow-x-clip bg-[#121212] font-sans text-white"
        suppressHydrationWarning
      >
        <OneSignalProvider>
          <MarketingChrome>{children}</MarketingChrome>
          <BackToTopButton />
          <PwaRegister />
        </OneSignalProvider>
      </body>
    </html>
  );
}
