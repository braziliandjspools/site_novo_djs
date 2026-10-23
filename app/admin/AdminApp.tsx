"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Music2, UsersRound } from "lucide-react";
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
    return <div className="flex min-h-screen items-center justify-center bg-[#121212] text-sm text-gray-500">Carregando painel…</div>;
  }

  if (!authenticated) {
    return <div className="flex min-h-screen items-center justify-center bg-[#121212] px-4"><AdminLogin onSuccess={() => checkSession()} /></div>;
  }

  const sections = [
    { id: "users", label: "Clientes", icon: UsersRound },
    { id: "deliveries", label: "Produções musicais", icon: Music2 },
    { id: "notices", label: "Avisos", icon: Bell },
  ];

  return (
    <AdminMenu
      onLogout={() => setAuthenticated(false)}
      activeSection={activeTab}
      sections={sections}
      onSectionChange={(section) => setActiveTab(section as AdminTab)}
    >
      {activeTab === "dashboard" ? (
        <AdminDashboard />
      ) : activeTab === "users" ? (
        <AdminUsersTable onLogout={() => setAuthenticated(false)} />
      ) : activeTab === "deliveries" ? (
        <AdminMusicProducerDeliveries onLogout={() => setAuthenticated(false)} />
      ) : (
        <AdminNotices />
      )}
    </AdminMenu>
  );
}
