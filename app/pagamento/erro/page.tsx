import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PaymentReturnClient } from "../../components/PaymentReturnClient";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata("pagamento-erro");

function Fallback() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      <Loader2 className="h-8 w-8 animate-spin text-red-300" aria-hidden />
      <p className="mt-4 text-sm text-zinc-400">Carregando…</p>
    </div>
  );
}

export default function PagamentoErroPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <PaymentReturnClient variant="erro" />
    </Suspense>
  );
}
