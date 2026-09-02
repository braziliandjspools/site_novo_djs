"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { WhatsAppFloat } from "./WhatsAppFloat";

export function MarketingChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = pathname.startsWith("/portal") || pathname.startsWith("/admin") || pathname.startsWith("/musicas");

  if (standalone) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
