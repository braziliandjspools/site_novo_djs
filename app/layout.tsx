import type { Metadata } from "next";
import { Bebas_Neue, Roboto } from "next/font/google";
import "./globals.css";
import { Header } from "./components/Header";

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

export const metadata: Metadata = {
  title: "Brazilian Packs | Remix Services e Edits para DJs",
  description:
    "Edits, remix services e versões que DJs profissionais usam para manter a pista fluindo. Acesso a mais de 400 serviços, atualizações mensais e bonus exclusivos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bebasNeue.variable} ${roboto.variable} h-full w-full overflow-x-hidden antialiased`}
    >
      <body className="flex min-h-full w-full flex-col overflow-x-hidden bg-[#08070D] text-white font-sans">
        <Header />
        {children}
      </body>
    </html>
  );
}
