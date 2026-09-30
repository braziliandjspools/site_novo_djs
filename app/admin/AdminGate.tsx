"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AdminLogin } from "./AdminLogin";

export function AdminGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    void fetch("/api/admin/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { authenticated?: boolean }) => setAuthenticated(Boolean(body.authenticated)))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) return <p className="py-16 text-center text-sm text-zinc-500">Carregando...</p>;
  if (!authenticated) return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  return children;
}
