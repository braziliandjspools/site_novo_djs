export type SitePlan = {
  name: string;
  price: string;
  period: string;
  equivalent: string | null;
  badge: string | null;
  features: string[];
  highlight: boolean;
};

export const SITE_PLANS: SitePlan[] = [
  {
    name: "1 Mês",
    price: "R$ 50",
    period: "Pagamento único",
    equivalent: null,
    badge: null,
    features: [
      "Acesso completo ao acervo por 30 dias",
      "Músicas, edits, remixes e vídeos",
      "Acesso ao Google Drive e FTP",
      "Atualizações disponíveis durante o período",
      "Acesso às ferramentas inclusas",
      "Renovação manual, sem cobrança automática",
    ],
    highlight: false,
  },
  {
    name: "3 Meses",
    price: "R$ 135",
    period: "Pagamento único — 10% de desconto",
    equivalent: "Equivale a R$ 45 por mês",
    badge: "10% off",
    features: [
      "Acesso completo ao acervo por 3 meses",
      "Músicas, edits, remixes e vídeos",
      "Acesso ao Google Drive e FTP",
      "Atualizações disponíveis durante todo o período",
      "Acesso às ferramentas inclusas",
      "Renovação manual, sem cobrança automática",
    ],
    highlight: false,
  },
  {
    name: "1 Ano",
    price: "R$ 504",
    period: "Pagamento único — melhor custo-benefício",
    equivalent: "Equivale a R$ 42 por mês",
    badge: "Melhor custo-benefício",
    features: [
      "Acesso completo ao acervo por 12 meses",
      "Músicas, edits, remixes e vídeos",
      "Acesso ao Google Drive e FTP",
      "Atualizações disponíveis durante todo o período",
      "Acesso às ferramentas inclusas",
      "Renovação manual, sem cobrança automática",
    ],
    highlight: true,
  },
];
