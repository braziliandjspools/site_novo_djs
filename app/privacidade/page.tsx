import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade | Brazilian Packs",
  description: "Lorem ipsum dolor sit amet — política de privacidade da Brazilian Packs.",
};

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16 sm:text-left">
      <div className="br-stripe-thin mb-8 rounded-full" />
      <p className="text-xs uppercase tracking-wider text-[#00B347]">Documentos</p>
      <h1 className="mt-2 font-display text-4xl tracking-wide text-white">Política de Privacidade</h1>
      <p className="mt-4 text-sm text-gray-400">Última atualização: 29 de agosto de 2026.</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-300">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Coletamos apenas os dados necessários para liberar
          o acesso, emitir comprovantes e oferecer suporte: nome, e-mail, telefone/WhatsApp e informações de pagamento.
        </p>
        <p>
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Não vendemos sua lista de contatos. Dados
          podem ser compartilhados apenas com processadores de pagamento e ferramentas essenciais de operação.
        </p>
        <p>
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Você pode solicitar correção ou exclusão
          de dados de contato pelo WhatsApp. Registros fiscais podem ser mantidos pelo prazo exigido em lei.
        </p>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore. O site pode usar cookies
          técnicos para lembrar preferências de navegação e medir audiência de páginas públicas.
        </p>
      </div>
      <Link href="/" className="mt-10 inline-block text-sm font-semibold text-[#FFDF00] hover:text-white">
        ← Voltar para o início
      </Link>
    </main>
  );
}
