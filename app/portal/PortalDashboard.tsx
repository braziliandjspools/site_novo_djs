"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PortalShell, type PortalView } from "./PortalShell";
import type { PortalData } from "./portal-types";
import { DashboardView } from "./views/DashboardView";
import { ServicesView } from "./views/ServicesView";
import {
  AccountView,
  AllavsoftServiceView,
  DeemixServiceView,
  PoolsServiceView,
  SupportView,
} from "./views/ServiceViews";
import { MusicProducerDeliveriesView } from "./views/MusicProducerDeliveriesView";

type PortalDashboardProps = {
  onLogout: () => void;
};

export function PortalDashboard({ onLogout }: PortalDashboardProps) {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<PortalView>("dashboard");
  const [now, setNow] = useState(() => new Date());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/data");
      if (!res.ok) throw new Error("unauthorized");
      setData((await res.json()) as PortalData);
    } catch {
      setError("Não foi possível carregar seus dados.");
      onLogout();
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    const allowed: PortalView[] = [
      "dashboard",
      "services",
      "service-pools",
      "service-deemix",
      "service-allavsoft",
      "service-music-producer",
      "account",
      "support",
    ];
    if (view && allowed.includes(view as PortalView)) {
      setActiveView(view as PortalView);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  async function handleLogout() {
    await fetch("/api/portal/logout", { method: "POST" });
    onLogout();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00ff9d]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212]">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  const portalData = data;

  function renderView() {
    switch (activeView) {
      case "dashboard":
        return <DashboardView data={portalData} now={now} onNavigate={setActiveView} />;
      case "services":
        return <ServicesView data={portalData} onNavigate={setActiveView} />;
      case "service-pools":
        return <PoolsServiceView data={portalData} />;
      case "service-deemix":
        return <DeemixServiceView data={portalData} />;
      case "service-allavsoft":
        return <AllavsoftServiceView data={portalData} />;
      case "service-music-producer":
        return <MusicProducerDeliveriesView />;
      case "account":
        return <AccountView data={portalData} />;
      case "support":
        return <SupportView />;
      default:
        return <DashboardView data={portalData} now={now} onNavigate={setActiveView} />;
    }
  }

  return (
    <PortalShell
      userName={portalData.user.name}
      activeView={activeView}
      onNavigate={setActiveView}
      onLogout={() => void handleLogout()}
      hasPools={Boolean(portalData.pools)}
      hasDeemix={Boolean(portalData.deemix)}
      hasAllavsoft={Boolean(portalData.allavsoft)}
    >
      {renderView()}
    </PortalShell>
  );
}
