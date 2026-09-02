"use client";

import { useCallback, useEffect, useState } from "react";
import { PortalDashboard } from "./PortalDashboard";
import { PortalLogin } from "./PortalLogin";

function getSafeReturnPath() {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("return");
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function PortalApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/data");
      setAuthenticated(res.ok);
    } catch {
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (authenticated !== true) return;
    const returnTo = getSafeReturnPath();
    if (returnTo) window.location.assign(returnTo);
  }, [authenticated]);

  function handleAuthSuccess() {
    const returnTo = getSafeReturnPath();
    if (returnTo) {
      window.location.assign(returnTo);
      return;
    }
    setAuthenticated(true);
  }

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-sm text-zinc-500">
        Carregando...
      </div>
    );
  }

  if (!authenticated) {
    return <PortalLogin onSuccess={handleAuthSuccess} />;
  }

  return <PortalDashboard onLogout={() => setAuthenticated(false)} />;
}
