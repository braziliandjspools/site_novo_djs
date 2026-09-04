import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { PlansSection } from "../components/PlansSection";
import { SectionHeading } from "../components/SectionHeading";
import { whatsappUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Planos | Brazilian Remix Service",
  description:
    "Escolha o plano VIP do Brazilian Remix Service: 1 mês, 3 meses ou 1 ano com acesso ao acervo, ferramentas e atualizações.",
};

export default function PlansPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <section className="border-b border-white/5 px-4 pb-8 pt-12 sm:px-6 md:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            badge="Planos"
            title="Acesso VIP ao acervo"
            subtitle="Assine pelo WhatsApp e libere pools, atualizações, Google Drive, FTP e a plataforma de músicas."
          />
        </div>
      </section>

      <PlansSection className="!border-t-0" />

      <section className="px-4 py-12 text-center sm:px-6 md:py-16">
        <div className="mx-auto max-w-2xl">
          <SectionHeading
            title="Ainda tem dúvidas?"
            subtitle="Fale com a gente pelo WhatsApp sobre planos, formas de acesso e renovação."
          />
          <a
            href={whatsappUrl("Olá! Vim pela página de planos e quero saber mais.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#009739] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#009739]/30 transition-all hover:scale-105 hover:bg-[#00B347]"
          >
            <MessageCircle size={18} /> Falar no WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
