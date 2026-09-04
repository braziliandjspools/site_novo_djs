import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { deemixCheckoutUrl } from "../lib/site";

type DeemixPurchaseCtaProps = {
  product: "Deemix" | "Deemix Server";
  accent?: "green" | "blue";
};

const accentStyles = {
  green: {
    border: "border-[#009739]/40",
    bg: "bg-[#009739]/10",
    button: "bg-[#009739] hover:bg-[#00B347] shadow-[#009739]/30",
  },
  blue: {
    border: "border-[#6B9FFF]/40",
    bg: "bg-[#002776]/20",
    button: "bg-[#002776] hover:bg-[#1A3D8F] border border-[#6B9FFF]/40 shadow-[#002776]/40",
  },
};

export function DeemixPurchaseCta({ product, accent = "green" }: DeemixPurchaseCtaProps) {
  const styles = accentStyles[accent];

  return (
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-8 text-center`}>
      <p className="font-display text-lg text-white">Não assina o plano de pools?</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
        Compre o acesso ao {product} avulso e fale com nossa equipe pelo WhatsApp para receber instruções e
        configuração.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={deemixCheckoutUrl(product)}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-all hover:scale-105 ${styles.button}`}
        >
          <MessageCircle className="h-4 w-4" />
          Comprar acesso ao {product}
        </a>
        <Link
          href="/plans"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-[#FFDF00]/50 hover:text-[#FFDF00]"
        >
          Ver planos de pools
        </Link>
      </div>
    </div>
  );
}
