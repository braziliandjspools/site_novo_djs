"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminLogin } from "./AdminLogin";
import { AdminScripts } from "./AdminScripts";

export function AdminScriptsApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = (await response.json()) as { authenticated?: boolean };
      setAuthenticated(Boolean(data.authenticated));
    } catch {
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    // Consulta inicial à sessão para proteger a rota direta /admin/scripts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkSession();
  }, [checkSession]);

  if (authenticated === null) {
    return <div className="py-24 text-center text-sm text-zinc-500">Carregando...</div>;
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={checkSession} />;
  }

  return <AdminScripts onLogout={() => setAuthenticated(false)} />;
}
