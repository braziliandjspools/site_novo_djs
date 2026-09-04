"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminLogin } from "./AdminLogin";
import { AdminMusicProducerDeliveries } from "./AdminMusicProducerDeliveries";
import { AdminNotices } from "./AdminNotices";
import { AdminUsersTable } from "./AdminUsersTable";

type AdminTab = "users" | "deliveries" | "notices";

export function AdminApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session", { credentials: "same-origin", cache: "no-store" });
      const data = (await res.json()) as { authenticated?: boolean };
      setAuthenticated(Boolean(data.authenticated));
    } catch {
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  if (authenticated === null) {
    return <div className="py-24 text-center text-sm text-gray-500">Carregando...</div>;
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => checkSession()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider ${
            activeTab === "users" ? "bg-[#FFDF00] text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          Clientes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("deliveries")}
          className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider ${
            activeTab === "deliveries" ? "bg-[#FFDF00] text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          Produções musicais
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("notices")}
          className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider ${
            activeTab === "notices" ? "bg-[#FFDF00] text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          Avisos
        </button>
      </div>

      {activeTab === "users" ? (
        <AdminUsersTable onLogout={() => setAuthenticated(false)} />
      ) : activeTab === "deliveries" ? (
        <AdminMusicProducerDeliveries onLogout={() => setAuthenticated(false)} />
      ) : (
        <AdminNotices onLogout={() => setAuthenticated(false)} />
      )}
    </div>
  );
}
