import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PaymentReturnClient } from "../../components/PaymentReturnClient";
import { SITE_NAME } from "../../lib/branding";

export const metadata: Metadata = {
  title: `Pagamento em processamento | ${SITE_NAME}`,
  description: "Aguardando confirmação do Mercado Pago.",
  robots: { index: false, follow: false },
};

function Fallback() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      <Loader2 className="h-8 w-8 animate-spin text-amber-300" aria-hidden />
      <p className="mt-4 text-sm text-zinc-400">Confirmando pagamento…</p>
    </div>
  );
}

export default function PagamentoPendentePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <PaymentReturnClient variant="pendente" />
    </Suspense>
  );
}
