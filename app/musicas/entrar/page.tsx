"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PortalLogin } from "../../portal/PortalLogin";

function getSafeReturnPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/musicas";
  if (value.startsWith("/musicas") || value === "/plans" || value.startsWith("/plans?")) {
    return value;
  }
  if (value === "/" || value.startsWith("/m/") || value === "/m" || value.startsWith("/p/")) return value;
  if (value.startsWith("/checkout/")) return value;
  return "/musicas";
}

function MusicasEntrarContent() {
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnPath(searchParams.get("return"));
  const checkoutPlan = searchParams.get("checkout");
  const modo = searchParams.get("modo");
  const resetToken = searchParams.get("token")?.trim() ?? "";
  const initialMode =
    modo === "cadastro" ? "register" : modo === "redefinir" ? (resetToken ? "reset" : "forgot") : "login";

  return (
    <div className="relative min-h-screen bg-[#202020]">
      <Link
        href="/musicas"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-[#1ed760]/50 hover:text-[#1ed760] sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao catálogo
      </Link>

      <PortalLogin
        initialMode={initialMode}
        resetToken={resetToken}
        onSuccess={() => {
          const target =
            checkoutPlan && returnTo.startsWith("/plans")
              ? `/plans?checkout=${encodeURIComponent(checkoutPlan)}`
              : returnTo;
          window.location.assign(target);
        }}
      />
    </div>
  );
}

export default function MusicasEntrarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#202020]">
          <Loader2 className="h-8 w-8 animate-spin text-[#60cdff]" />
        </div>
      }
    >
      <MusicasEntrarContent />
    </Suspense>
  );
}
