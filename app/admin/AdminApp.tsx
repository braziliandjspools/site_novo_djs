"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminDashboard } from "./AdminDashboard";
import { AdminLogin } from "./AdminLogin";
import { AdminMusicProducerDeliveries } from "./AdminMusicProducerDeliveries";
import { AdminNotices } from "./AdminNotices";
import { AdminUsersTable } from "./AdminUsersTable";

type AdminTab = "dashboard" | "users" | "deliveries" | "notices";

export function AdminApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

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

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "users", label: "Clientes" },
    { id: "deliveries", label: "Produções musicais" },
    { id: "notices", label: "Avisos" },
  ];

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex w-full min-w-0 flex-wrap gap-2 border-b border-white/10 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider sm:px-4 ${
              activeTab === tab.id ? "bg-[#FFDF00] text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" ? (
        <AdminDashboard onLogout={() => setAuthenticated(false)} />
      ) : activeTab === "users" ? (
        <AdminUsersTable onLogout={() => setAuthenticated(false)} />
      ) : activeTab === "deliveries" ? (
        <AdminMusicProducerDeliveries onLogout={() => setAuthenticated(false)} />
      ) : (
        <AdminNotices onLogout={() => setAuthenticated(false)} />
      )}
    </div>
  );
}
