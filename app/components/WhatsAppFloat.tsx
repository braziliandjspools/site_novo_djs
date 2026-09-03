import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "../lib/site";

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappUrl("Olá! Vim pelo site da Brazilian Remix Service e quero saber mais sobre o acervo.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#009739] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#009739]/40 transition-transform hover:scale-105 hover:bg-[#00B347]"
    >
      <MessageCircle size={20} />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
