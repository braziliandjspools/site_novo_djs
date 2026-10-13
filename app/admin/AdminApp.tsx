"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, UsersRound } from "lucide-react";
import { AdminDashboard } from "./AdminDashboard";
import { AdminLogin } from "./AdminLogin";
import { AdminMenu } from "./AdminMenu";
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
    // Consulta inicial à sessão do admin para escolher o conteúdo protegido.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="admin-premium-shell w-full min-w-0 space-y-6">
      <AdminMenu>
          <div className="flex gap-1">
            {tabs.filter((tab) => tab.id !== "dashboard").map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-pressed={activeTab === tab.id} className={`rounded-xl px-3 py-2.5 text-xs font-bold ${activeTab === tab.id ? "bg-sky-300 text-[#061018]" : "text-white/45 hover:bg-white/5 hover:text-white"}`}>
                {tab.id === "users" ? <UsersRound className="inline h-4 w-4" /> : <Bell className="inline h-4 w-4" />}
                <span className="ml-1 hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
      </AdminMenu>

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
