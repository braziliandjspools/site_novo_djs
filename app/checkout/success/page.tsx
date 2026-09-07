import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, User } from "lucide-react";
import { SectionHeading } from "../../components/SectionHeading";
import { SITE_NAME } from "../../lib/branding";

export const metadata: Metadata = {
  title: `Pagamento recebido | ${SITE_NAME}`,
  description: "Estamos confirmando sua assinatura Hotmart.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#009739]/20 text-[#00B347]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <SectionHeading
          badge="Checkout"
          title="Pagamento recebido"
          subtitle="Estamos confirmando sua assinatura. Assim que a Hotmart confirmar o pagamento, seu acesso será liberado automaticamente."
        />
        <Link
          href="/portal?view=account"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#009739] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-all hover:scale-105 hover:bg-[#00B347]"
        >
          <User className="h-4 w-4" />
          Ir para minha conta
        </Link>
      </div>
    </div>
  );
}
