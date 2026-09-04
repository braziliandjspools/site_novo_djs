import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("termos");

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16 sm:text-left">
      <div className="br-stripe-thin mb-8 rounded-full" />
      <p className="text-xs uppercase tracking-wider text-[#00B347]">Documentos</p>
      <h1 className="mt-2 font-display text-4xl tracking-wide text-white">Termos de Serviço</h1>
      <p className="mt-4 text-sm text-gray-400">Última atualização: 29 de agosto de 2026.</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-300">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ao assinar a Brazilian Remix Service, você recebe acesso
          temporário ao acervo e aos bônus descritos no plano contratado. O conteúdo é para uso profissional em sets,
          eventos e preparação de repertório.
        </p>
        <p>
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. O acesso é pessoal e intransferível.
          Compartilhar login, pastas ou links com terceiros pode resultar em encerramento imediato da assinatura.
        </p>
        <p>
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Os planos não possuem fidelidade. Você
          pode cancelar quando quiser; o acesso permanece ativo até o fim do ciclo já pago.
        </p>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore. A Brazilian Remix Service não se
          responsabiliza por uso indevido do material, equipamentos do assinante ou falhas de conexão de internet.
        </p>
      </div>
      <Link href="/" className="mt-10 inline-block text-sm font-semibold text-[#FFDF00] hover:text-white">
        ← Voltar para o início
      </Link>
    </main>
  );
}
