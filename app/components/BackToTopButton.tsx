"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

const SHOW_AFTER_PX = 420;

/** Botão flutuante para voltar ao topo — site inteiro, inclusive /musicas. */
export function BackToTopButton() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Em páginas com WhatsApp flutuante, sobe o botão para não sobrepor.
  const raiseForWhatsApp =
    !pathname.startsWith("/musicas") &&
    !pathname.startsWith("/portal") &&
    !pathname.startsWith("/admin");

  useEffect(() => {
    const sync = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [pathname]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      className={`fixed right-4 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-[#181818]/95 text-white shadow-lg shadow-black/40 backdrop-blur-md transition-all hover:border-[#1ed760]/50 hover:bg-[#1ed760] hover:text-black sm:right-5 ${
        raiseForWhatsApp ? "bottom-[4.75rem] sm:bottom-[5.25rem]" : "bottom-5"
      }`}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
