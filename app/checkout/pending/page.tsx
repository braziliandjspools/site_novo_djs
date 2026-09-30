import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, User } from "lucide-react";
import { SectionHeading } from "../../components/SectionHeading";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata("checkout-pending");

/** Rota legada — preferir /pagamento/pendente. */
export default function CheckoutPendingPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
          <Clock3 className="h-7 w-7" />
        </div>
        <SectionHeading
          badge="Mercado Pago"
          title="Seu pagamento está sendo processado."
          subtitle="Assim que recebermos a confirmação do Mercado Pago, seu acesso será atualizado automaticamente."
        />
        <Link
          href="/portal/conta"
          className="mt-8 inline-flex items-center gap-2 rounded-lg border border-[#009739]/60 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#00B347] transition-all hover:bg-[#009739]/10"
        >
          <User className="h-4 w-4" />
          Ir para minha conta
        </Link>
      </div>
    </div>
  );
}
