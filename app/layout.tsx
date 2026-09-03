import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, Roboto } from "next/font/google";
import "./globals.css";
import { MarketingChrome } from "./components/MarketingChrome";
import { SITE_NAME, SITE_TAGLINE, BRS_LOGO_SRC } from "./lib/branding";

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

export const metadata: Metadata = {
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description:
    "Acervo com mais de 400 pools e remix services curados para DJs profissionais no Brasil.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${bebasNeue.variable} ${roboto.variable} ${dmSans.variable} h-full w-full overflow-x-hidden antialiased`}
    >
      <head>
        <link rel="preload" href={BRS_LOGO_SRC} as="image" type="image/jpeg" />
      </head>
      <body className="flex min-h-full w-full flex-col overflow-x-hidden bg-[#121212] text-white font-sans" suppressHydrationWarning>
        <MarketingChrome>{children}</MarketingChrome>
      </body>
    </html>
  );
}
