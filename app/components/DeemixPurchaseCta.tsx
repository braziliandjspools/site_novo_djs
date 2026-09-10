"use client";

import { Suspense } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { PlansSection } from "./PlansSection";
import { whatsappUrl } from "../lib/site";

type DeemixPlanCard = {
  id: string;
  name: string;
  price: string;
  period: string;
  equivalent: string | null;
  badge: string | null;
  features: string[];
  highlight: boolean;
  description?: string;
  isTestPlan?: boolean;
  serviceProduct?: "poolsVip" | "deemix";
};

type DeemixPurchaseCtaProps = {
  plans: DeemixPlanCard[];
  activeDeemix?: { expiresLabel: string } | null;
  product?: "Deemix" | "Deemix Server";
  accent?: "green" | "blue";
};

export function DeemixPurchaseCta({
  plans,
  activeDeemix = null,
  product = "Deemix",
  accent = "green",
}: DeemixPurchaseCtaProps) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<div className="min-h-[280px]" />}>
        <PlansSection
          id="deemix-planos"
          className="!border-y-0 !px-0 !py-0"
          plans={plans}
          badge="Mercado Pago"
          title={`Assinar ${product}`}
          subtitle="ARL 320 kbps · R$ 30/mês · 90 e 180 dias com 10% off. Liberação automática no portal após o pagamento."
          activeDeemix={activeDeemix}
          showPixNotice
          loginReturnPath="/deemix"
        />
      </Suspense>
      <div className="flex flex-wrap items-center justify-center gap-3 text-center">
        <a
          href={whatsappUrl(`Olá! Quero saber mais sobre o ${product}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold ${
            accent === "blue"
              ? "border-[#6B9FFF]/40 text-[#6B9FFF] hover:bg-[#002776]/30"
              : "border-white/20 text-zinc-300 hover:border-[#FFDF00]/50 hover:text-[#FFDF00]"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Dúvidas no WhatsApp
        </a>
        <Link
          href="/plans"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-[#FFDF00]/50 hover:text-[#FFDF00]"
        >
          Ver planos de pools
        </Link>
      </div>
    </div>
  );
}
