import type { LucideIcon } from "lucide-react";
import { Disc3, Folder, Headphones, LibraryBig, Music2 } from "lucide-react";

export type LibraryCategoryGradient = {
  /** Classes Tailwind: from / via / to para bg-gradient-to-b */
  surface: string;
  glow: string;
  edge: string;
  ring: string;
};

export type LibraryCategoryMeta = {
  eyebrow: string;
  description: string;
  cta: string;
  /** Quando true e folderCount === 1, exibe "biblioteca" em vez de "subpasta". */
  singularFolderLabel?: "subpasta" | "biblioteca";
  icon: LucideIcon;
  gradient: LibraryCategoryGradient;
};

const GRADIENTS = {
  emerald: {
    surface: "from-[#00c853] via-[#0a7a4a] to-[#050505]",
    glow: "bg-emerald-300/30",
    edge: "from-emerald-200/50 via-transparent to-transparent",
    ring: "group-hover/card:border-white/20 group-hover/card:ring-emerald-300/35",
  },
  blue: {
    surface: "from-[#1ed760] via-[#0a3d22] to-[#050505]",
    glow: "bg-[#1ed760]/30",
    edge: "from-[#1ed760]/45 via-transparent to-transparent",
    ring: "group-hover/card:border-white/20 group-hover/card:ring-[#1ed760]/35",
  },
  amber: {
    surface: "from-[#f59e0b] via-[#9a3412] to-[#050505]",
    glow: "bg-amber-300/30",
    edge: "from-amber-200/45 via-transparent to-transparent",
    ring: "group-hover/card:border-white/20 group-hover/card:ring-amber-300/35",
  },
  teal: {
    surface: "from-[#14b8a6] via-[#0f766e] to-[#050505]",
    glow: "bg-teal-200/30",
    edge: "from-teal-100/40 via-transparent to-transparent",
    ring: "group-hover/card:border-white/20 group-hover/card:ring-teal-200/35",
  },
  lime: {
    surface: "from-[#a3e635] via-[#4d7c0f] to-[#050505]",
    glow: "bg-lime-300/25",
    edge: "from-lime-200/40 via-transparent to-transparent",
    ring: "group-hover/card:border-white/20 group-hover/card:ring-lime-300/30",
  },
  rose: {
    surface: "from-[#fb7185] via-[#9f1239] to-[#050505]",
    glow: "bg-rose-300/25",
    edge: "from-rose-200/40 via-transparent to-transparent",
    ring: "group-hover/card:border-white/20 group-hover/card:ring-rose-300/30",
  },
} as const satisfies Record<string, LibraryCategoryGradient>;

const FALLBACK_CYCLE: LibraryCategoryGradient[] = [
  GRADIENTS.emerald,
  GRADIENTS.blue,
  GRADIENTS.amber,
  GRADIENTS.teal,
  GRADIENTS.lime,
  GRADIENTS.rose,
];

type MetaRule = {
  test: (normalized: string) => boolean;
  meta: LibraryCategoryMeta;
};

const RULES: MetaRule[] = [
  {
    test: (n) => /packs?\s*2026/.test(n),
    meta: {
      eyebrow: "PACKS",
      description: "Os principais packs e seleções organizados para DJs.",
      cta: "Abrir acervo",
      icon: Folder,
      gradient: GRADIENTS.emerald,
    },
  },
  {
    test: (n) => /packs?\s*2025/.test(n),
    meta: {
      eyebrow: "PACKS",
      description: "Coleções, remixes e edits organizados por estilo.",
      cta: "Explorar",
      icon: Disc3,
      gradient: GRADIENTS.blue,
    },
  },
  {
    test: (n) => /packs?\s*2024/.test(n),
    meta: {
      eyebrow: "ACERVO",
      description: "Arquivo completo de packs, coleções e seleções anteriores.",
      cta: "Ver arquivo",
      icon: LibraryBig,
      gradient: GRADIENTS.amber,
    },
  },
  {
    test: (n) => /pool\s*services/.test(n),
    meta: {
      eyebrow: "REMIX SERVICES",
      description: "Pools e remix services profissionais para DJs.",
      cta: "Explorar pools",
      icon: Headphones,
      gradient: GRADIENTS.teal,
    },
  },
  {
    test: (n) => /dj\s*pools/.test(n),
    meta: {
      eyebrow: "ATUALIZAÇÕES",
      description: "Atualizações organizadas por data e pool.",
      cta: "Ver atualizações",
      singularFolderLabel: "biblioteca",
      icon: Music2,
      gradient: GRADIENTS.lime,
    },
  },
];

function normalizeFolderKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[[\]]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveLibraryCategoryMeta(
  folderName: string,
  colorIndex = 0,
): LibraryCategoryMeta {
  const normalized = normalizeFolderKey(folderName);
  for (const rule of RULES) {
    if (rule.test(normalized)) return rule.meta;
  }

  return {
    eyebrow: "COLEÇÕES",
    description: "Explore categorias e pastas deste acervo.",
    cta: "Explorar",
    icon: Folder,
    gradient: FALLBACK_CYCLE[((colorIndex % FALLBACK_CYCLE.length) + FALLBACK_CYCLE.length) % FALLBACK_CYCLE.length],
  };
}

export function formatLibraryStatCount(n: number) {
  return n.toLocaleString("pt-BR");
}

export function formatFolderStatLabel(
  count: number,
  singular: "subpasta" | "biblioteca" = "subpasta",
) {
  if (singular === "biblioteca") {
    return `${formatLibraryStatCount(count)} ${count === 1 ? "biblioteca" : "bibliotecas"}`;
  }
  return `${formatLibraryStatCount(count)} ${count === 1 ? "subpasta" : "subpastas"}`;
}

export function formatTrackStatLabel(count: number) {
  return `${formatLibraryStatCount(count)} ${count === 1 ? "faixa" : "faixas"}`;
}
