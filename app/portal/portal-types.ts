export type PortalPlan = "NONE" | "VIP" | "DEEMIX" | "ALLAVSOFT";

export type PortalData = {
  user: {
    name: string;
    email: string;
    whatsapp: string;
    plan: PortalPlan;
    planLabel: string;
    dueDay: number;
    nextDueAt: string;
    createdAt: string;
    active: boolean;
  };
  greeting: string;
  datetime: string;
  deemix: {
    status: "active";
    arl320: string;
    arl128: string;
    downloadUrl: string;
    spotify: {
      clientId: string;
      clientSecret: string;
      user: string;
    };
  } | null;
  allavsoft: {
    availableFrom: string;
    launchLabel: string;
  } | null;
  pools: {
    catalogUrl: string;
  } | null;
  musicProducerDeliveries: {
    enabled: boolean;
  };
  hasSubscriptionPlan: boolean;
};

export function formatDateBr(iso: string) {
  const date = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTimeBr(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function getGreetingHour(date: Date) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);

  return Number(parts.find((part) => part.type === "hour")?.value ?? "0");
}

export function countServices(data: PortalData) {
  return [data.pools, data.deemix, data.allavsoft].filter(Boolean).length;
}
