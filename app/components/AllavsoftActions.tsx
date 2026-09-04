import Link from "next/link";
import { MessageCircle, ShoppingCart, UserCircle } from "lucide-react";
import { allavsoftCheckoutUrl, whatsappUrl } from "../lib/site";

type AllavsoftActionsProps = {
  variant?: "row" | "banner";
  compact?: boolean;
  className?: string;
};

export function AllavsoftActions({ variant = "row", compact = false, className = "" }: AllavsoftActionsProps) {
  const buttons = (
    <>
      <a
        href={whatsappUrl("Olá! Quero comprar a licença Allavsoft.")}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FFDF00] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#002776] shadow-lg shadow-[#FFDF00]/20 transition-all hover:scale-105 hover:bg-[#FFE566] sm:px-7 sm:py-3.5 sm:text-sm"
      >
        <ShoppingCart className="h-4 w-4" />
        Comprar Licença
      </a>
      {!compact && (
        <>
          <a
            href={allavsoftCheckoutUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#009739]/50 bg-[#009739]/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#00B347] transition-all hover:scale-105 hover:bg-[#009739]/20 sm:px-7 sm:py-3.5 sm:text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            Sem plano de pools
          </a>
          <Link
            href="/portal"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:border-[#6B9FFF]/50 hover:text-white sm:px-7 sm:py-3.5 sm:text-sm"
          >
            <UserCircle className="h-4 w-4" />
            Área do cliente
          </Link>
          <Link
            href="/plans"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#002776]/60 px-5 py-2.5 text-xs font-semibold text-gray-400 transition-colors hover:border-[#FFDF00]/40 hover:text-[#FFDF00] sm:px-7 sm:py-3.5 sm:text-sm"
          >
            Ver planos de pools
          </Link>
        </>
      )}
      {compact && (
        <Link
          href="/portal"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#009739]/40 bg-[#009739]/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#00B347] transition-colors hover:bg-[#009739]/20"
        >
          <UserCircle className="h-4 w-4" />
          Portal
        </Link>
      )}
    </>
  );

  if (variant === "banner") {
    return (
      <div
        className={`rounded-2xl border border-[#FFDF00]/30 bg-gradient-to-br from-[#FFDF00]/10 to-[#002776]/10 p-8 text-center ${className}`}
      >
        <p className="font-display text-xl text-white">Pronto para usar o Allavsoft?</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-gray-400">
          Compre a licença, assine um plano com ferramentas inclusas ou acesse a área do cliente se já for assinante.
        </p>
        <div className="mt-6 flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
          {buttons}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row ${className}`}>
      {buttons}
    </div>
  );
}
