"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AdminLogin } from "./AdminLogin";
import { AdminMenu } from "./AdminMenu";

export function AdminGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    void fetch("/api/admin/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { authenticated?: boolean }) => setAuthenticated(Boolean(body.authenticated)))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) return <div className="flex min-h-screen items-center justify-center bg-[#121212] text-sm text-zinc-500">Carregando painel…</div>;
  if (!authenticated) return <div className="flex min-h-screen items-center justify-center bg-[#121212] px-4"><AdminLogin onSuccess={() => setAuthenticated(true)} /></div>;
  return <AdminMenu onLogout={() => setAuthenticated(false)}>{children}</AdminMenu>;
}
