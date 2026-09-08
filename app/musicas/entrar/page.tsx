"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PortalLogin } from "../../portal/PortalLogin";

function getSafeReturnPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/musicas/home";
  if (value.startsWith("/musicas") || value === "/plans" || value.startsWith("/plans?")) {
    return value;
  }
  if (value.startsWith("/checkout/")) return value;
  return "/musicas/home";
}

function MusicasEntrarContent() {
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnPath(searchParams.get("return"));
  const checkoutPlan = searchParams.get("checkout");
  const initialMode = searchParams.get("modo") === "cadastro" ? "register" : "login";

  return (
    <div className="relative min-h-screen bg-[#0a0a0a]">
      <Link
        href="/musicas/home"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-400 backdrop-blur-sm transition-colors hover:border-zinc-600 hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao catálogo
      </Link>

      <PortalLogin
        initialMode={initialMode}
        onSuccess={() => {
          const target =
            checkoutPlan && returnTo.startsWith("/plans")
              ? `/plans?checkout=${encodeURIComponent(checkoutPlan)}`
              : returnTo;
          // Hard reload obrigatório para o cookie VIP valer na sessão/layout/APIs.
          window.location.replace(target);
        }}
      />
    </div>
  );
}

export default function MusicasEntrarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
          <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
        </div>
      }
    >
      <MusicasEntrarContent />
    </Suspense>
  );
}
