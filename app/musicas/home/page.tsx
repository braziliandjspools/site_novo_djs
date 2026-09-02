"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Crown, Headphones } from "lucide-react";
import { checkoutUrl } from "../../lib/site";
import { SITE_NAV_LINKS } from "../../lib/site-nav";
import { MusicasPageHeader } from "../MusicasShell";
import { MusicasFaqSection } from "../components/MusicasFaqSection";
import { useMusicasSession } from "../components/MusicasSessionContext";
import { VipUpgradeBanner } from "../VipUpgradeGate";

type CardTheme = {
  gradient: string;
  button: string;
  iconWrap: string;
  icon: string;
};

const CARD_THEMES = {
  emerald: {
    gradient: "from-emerald-600 via-emerald-800 to-emerald-950",
    button: "bg-emerald-300 text-emerald-950 hover:bg-emerald-200",
    iconWrap: "bg-emerald-400/20",
    icon: "text-emerald-200",
  },
  blue: {
    gradient: "from-blue-600 via-blue-800 to-blue-950",
    button: "bg-sky-300 text-blue-950 hover:bg-sky-200",
    iconWrap: "bg-sky-400/20",
    icon: "text-sky-200",
  },
  violet: {
    gradient: "from-violet-600 via-violet-800 to-violet-950",
    button: "bg-violet-300 text-violet-950 hover:bg-violet-200",
    iconWrap: "bg-violet-400/20",
    icon: "text-violet-200",
  },
  amber: {
    gradient: "from-amber-500 via-amber-700 to-amber-950",
    button: "bg-amber-300 text-amber-950 hover:bg-amber-200",
    iconWrap: "bg-amber-400/20",
    icon: "text-amber-100",
  },
  rose: {
    gradient: "from-rose-600 via-rose-800 to-rose-950",
    button: "bg-rose-300 text-rose-950 hover:bg-rose-200",
    iconWrap: "bg-rose-400/20",
    icon: "text-rose-200",
  },
  cyan: {
    gradient: "from-cyan-600 via-cyan-800 to-cyan-950",
    button: "bg-cyan-300 text-cyan-950 hover:bg-cyan-200",
    iconWrap: "bg-cyan-400/20",
    icon: "text-cyan-200",
  },
  vip: {
    gradient: "from-[#1ed760] via-[#0d7a36] to-[#052e16]",
    button: "bg-[#1ed760] text-black hover:bg-[#1fdf64]",
    iconWrap: "bg-white/20",
    icon: "text-white",
  },
} as const satisfies Record<string, CardTheme>;

const SITE_CARD_COPY: Record<string, { description: string; theme: keyof typeof CARD_THEMES }> = {
  "/": {
    description: "Página principal do Brazilian Packs — pools, serviços e novidades.",
    theme: "cyan",
  },
  "/deemix": {
    description: "Download de músicas em alta qualidade com o Deemix.",
    theme: "blue",
  },
  "/allavsoft": {
    description: "Baixe vídeos e áudio de plataformas com o Allavsoft.",
    theme: "violet",
  },
  "/musicproducer": {
    description: "Produções exclusivas e demos da nossa DJ.",
    theme: "rose",
  },
  "/portal": {
    description: "Sua conta, pedidos, licenças e suporte.",
    theme: "amber",
  },
};

function QuickCard({
  title,
  description,
  href,
  icon: Icon,
  theme,
  actionLabel = "Abrir",
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  theme: CardTheme;
  actionLabel?: string;
}) {
  const external = href.startsWith("http");

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`group relative flex min-h-[168px] flex-col overflow-hidden rounded-md bg-gradient-to-br p-5 transition-transform hover:scale-[1.02] ${theme.gradient}`}
    >
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-md ${theme.iconWrap}`}>
        <Icon className={`h-5 w-5 ${theme.icon}`} />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-white/75">{description}</p>
      <span
        className={`mt-4 inline-flex w-fit items-center justify-center rounded-full px-4 py-2 text-xs font-bold transition-colors ${theme.button}`}
      >
        {actionLabel}
      </span>
    </Link>
  );
}

export default function MusicasHomePage() {
  const { authenticated, hasVip } = useMusicasSession();

  return (
    <div>
      <MusicasPageHeader
        title={authenticated ? "Bem-vindo de volta" : "Ouça sem limites"}
        subtitle="Atualizações semanais, pools curados e downloads diretos — tudo em um só lugar."
      />

      {authenticated && !hasVip && <VipUpgradeBanner />}

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-white">Plataforma</h2>
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickCard
            title="Atualizações 2026"
            description="Navegue por mês e estilo. Veja o catálogo completo de músicas."
            href="/musicas/atualizacoes"
            icon={Headphones}
            theme={CARD_THEMES.emerald}
          />
          {!hasVip && (
            <QuickCard
              title="Assinar VIP"
              description="Libere player, downloads e novidades toda semana."
              href={checkoutUrl("VIP")}
              icon={Crown}
              theme={CARD_THEMES.vip}
              actionLabel="Assinar VIP"
            />
          )}
        </div>

        <h2 className="mb-4 text-xl font-bold text-white">Site</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SITE_NAV_LINKS.map(({ href, label, icon }) => {
            const copy = SITE_CARD_COPY[href];
            if (!copy) return null;
            return (
              <QuickCard
                key={href}
                title={label}
                description={copy.description}
                href={href}
                icon={icon}
                theme={CARD_THEMES[copy.theme]}
              />
            );
          })}
        </div>
      </section>

      <MusicasFaqSection />
    </div>
  );
}
