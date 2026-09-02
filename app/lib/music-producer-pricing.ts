export type MusicProducerPricingPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight?: boolean;
};

export const MUSIC_PRODUCER_PRICING_PLANS: MusicProducerPricingPlan[] = [
  {
    id: "intro-dj",
    name: "Intro / drop para DJ",
    price: "R$ 80,00",
    period: "por peça · até 40 segundos",
    description: "Vinhetas, intros, drops e elementos exclusivos para sets, lives e identidade de DJ.",
    features: [
      "Até 40 segundos de duração",
      "Produção pensada para pista",
      "Personalização com seu nome ou marca",
      "Pronto para USB e performance",
    ],
  },
  {
    id: "jingle",
    name: "Jingle e vinheta",
    price: "R$ 90,00",
    period: "por peça · até 2 minutos",
    description: "Identidade sonora para rádio, TV, podcasts, eventos, campanhas e marcas.",
    features: [
      "Até 2 minutos de duração",
      "Letra e conceito alinhados ao briefing",
      "Versão final pronta para veiculação",
      "Entrega otimizada para mídia",
    ],
  },
  {
    id: "musica",
    name: "Música produzida",
    price: "R$ 100,00",
    period: "por faixa · até 8 minutos",
    description: "Produção completa para aniversários, homenagens, casamentos e projetos personalizados.",
    features: [
      "Até 8 minutos de duração",
      "Composição, arranjo, mixagem e masterização",
      "1 rodada de revisão inclusa",
      "Arquivo final em alta qualidade",
    ],
    highlight: true,
  },
  {
    id: "remix",
    name: "Remix personalizado",
    price: "R$ 100,00",
    period: "por faixa · até 8 minutos",
    description: "Versão exclusiva adaptada ao seu estilo, evento ou identidade artística.",
    features: [
      "Até 8 minutos de duração",
      "Rearranjo e edição sob medida",
      "Adaptação de BPM e estrutura",
      "Ideal para sets e apresentações",
    ],
  },
  {
    id: "letra-exclusiva",
    name: "Letra exclusiva + produção",
    price: "R$ 120,00",
    period: "por faixa · até 8 minutos",
    description: "Música 100% original, com letra criada do zero para contar a sua história.",
    features: [
      "Até 8 minutos de duração",
      "Letra personalizada com sua mensagem",
      "Produção musical completa",
      "Tom e estilo alinhados ao briefing",
    ],
  },
  {
    id: "distribuicao",
    name: "Distribuição digital",
    price: "R$ 100,00",
    period: "por ano · envios ilimitados",
    description: "Publique suas faixas nas principais plataformas digitais do mercado.",
    features: [
      "Envios ilimitados durante 12 meses",
      "Beatport, Spotify, Apple Music e mais",
      "Arquivo final preparado para lojas",
      "Suporte no processo de publicação",
    ],
  },
];

export function getMusicProducerPlanById(id: string) {
  return MUSIC_PRODUCER_PRICING_PLANS.find((plan) => plan.id === id);
}

export const MUSIC_PRODUCER_DEADLINE_OPTIONS = [
  { id: "normal", label: "Normal", surchargeCents: 0 },
  { id: "24h", label: "24 horas", surchargeCents: 2500 },
  { id: "48h", label: "48 horas", surchargeCents: 2500 },
  { id: "3d", label: "3 dias", surchargeCents: 1500 },
  { id: "5d", label: "5 dias", surchargeCents: 0 },
] as const;

export type MusicProducerDeadlineId = (typeof MUSIC_PRODUCER_DEADLINE_OPTIONS)[number]["id"];

export function getDeadlineOption(id: string) {
  return MUSIC_PRODUCER_DEADLINE_OPTIONS.find((option) => option.id === id) ?? MUSIC_PRODUCER_DEADLINE_OPTIONS[0];
}

export function formatDeadlineOptionLabel(option: (typeof MUSIC_PRODUCER_DEADLINE_OPTIONS)[number]) {
  if (option.surchargeCents === 2500) return `${option.label} (+ R$ 25,00)`;
  if (option.surchargeCents === 1500) return `${option.label} (+ R$ 15,00)`;
  return option.label;
}

export function parsePriceToCents(price: string) {
  const cleaned = price.replace(/[^\d,]/g, "");
  const [reaisPart, centsPart = "00"] = cleaned.split(",");
  const reais = Number(reaisPart || 0);
  const cents = Number(centsPart.padEnd(2, "0").slice(0, 2));
  return reais * 100 + cents;
}

export function formatCentsToBRL(cents: number) {
  const reais = Math.floor(cents / 100);
  const remainder = cents % 100;
  return `R$ ${reais.toLocaleString("pt-BR")},${remainder.toString().padStart(2, "0")}`;
}

export function calculateEstimatedTotal(plan: MusicProducerPricingPlan, deadlineId: string) {
  const baseCents = parsePriceToCents(plan.price);
  const deadline = getDeadlineOption(deadlineId);
  const totalCents = baseCents + deadline.surchargeCents;

  return {
    baseCents,
    surchargeCents: deadline.surchargeCents,
    totalCents,
    baseFormatted: formatCentsToBRL(baseCents),
    surchargeFormatted: deadline.surchargeCents > 0 ? formatCentsToBRL(deadline.surchargeCents) : null,
    totalFormatted: formatCentsToBRL(totalCents),
    deadlineLabel: deadline.label,
  };
}

export function formatEstimatedQuote(plan: MusicProducerPricingPlan, deadlineId = "normal") {
  const estimate = calculateEstimatedTotal(plan, deadlineId);
  if (estimate.surchargeCents > 0) {
    return `${estimate.totalFormatted} (base ${estimate.baseFormatted} + ${estimate.surchargeFormatted} prazo ${estimate.deadlineLabel}) · ${plan.period}`;
  }
  return `${estimate.totalFormatted} · ${plan.period}`;
}
