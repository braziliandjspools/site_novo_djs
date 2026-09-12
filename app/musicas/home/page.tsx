"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BrsLogo } from "../../components/BrsLogo";
import { SITE_NAV_LINKS } from "../../lib/site-nav";
import { MusicasPageHeader } from "../MusicasShell";
import { MusicasFaqSection } from "../components/MusicasFaqSection";
import { MusicasLibraryDashboard } from "../components/MusicasLibraryDashboard";
import { MusicasMonthLinks } from "../components/MusicasMonthLinks";
import { MusicasListSkeleton } from "../components/MusicasSkeletons";
import { useMusicasSession } from "../components/MusicasSessionContext";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasLibraryHome } from "../hooks/useMusicasLibraryHome";

type CardTheme = {
  gradient: string;
  button: string;
  iconWrap: string;
  icon: string;
};

const CARD_THEMES = {
  cyan: {
    gradient: "from-cyan-700 via-cyan-950 to-[#0a0a0a]",
    button: "bg-white/10 text-white hover:bg-white/15",
    iconWrap: "bg-cyan-400/20",
    icon: "text-cyan-200",
  },
  violet: {
    gradient: "from-violet-700 via-violet-950 to-[#0a0a0a]",
    button: "bg-white/10 text-white hover:bg-white/15",
    iconWrap: "bg-violet-400/20",
    icon: "text-violet-200",
  },
  rose: {
    gradient: "from-rose-700 via-rose-950 to-[#0a0a0a]",
    button: "bg-white/10 text-white hover:bg-white/15",
    iconWrap: "bg-rose-400/20",
    icon: "text-rose-200",
  },
  amber: {
    gradient: "from-amber-700 via-amber-950 to-[#0a0a0a]",
    button: "bg-white/10 text-white hover:bg-white/15",
    iconWrap: "bg-amber-400/20",
    icon: "text-amber-100",
  },
} as const satisfies Record<string, CardTheme>;

const SITE_CARD_COPY: Record<string, { description: string; theme: keyof typeof CARD_THEMES }> = {
  "/": {
    description: "Página principal do Brazilian Remix Service — pools, serviços e novidades.",
    theme: "cyan",
  },
  "/allavsoft": {
    description: "Baixe Deezer, Spotify, YouTube e +1000 sites com o Allavsoft.",
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
  const { authenticated, hasVip, userName } = useMusicasSession();
  const { folders, home, loadingTree, loadingHome, error, newFolderIds } = useMusicasLibraryHome();
  const firstName = userName.trim().split(/\s+/)[0] || "DJ";

  return (
    <div>
      <div className="mb-8 flex justify-center">
        <BrsLogo
          href={null}
          priority
          className="h-14 w-auto max-w-[320px] object-contain sm:h-16 sm:max-w-[380px] md:h-20 md:max-w-[440px]"
        />
      </div>

      <MusicasPageHeader
        title={authenticated ? `Bem-vindo de volta, ${firstName}` : "Ouça sem limites"}
        subtitle="Atualizações semanais, pools curados e downloads diretos — tudo em um só lugar."
      />

      {authenticated && !hasVip && <VipUpgradeBanner />}

      <MusicasLibraryDashboard home={home} loading={loadingHome} />

      {loadingTree ? (
        <div className="mt-10">
          <MusicasListSkeleton rows={6} />
        </div>
      ) : null}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {!loadingTree && !error && folders.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-center text-2xl font-bold tracking-[-0.03em] text-white">Packs por mês</h2>
          <MusicasMonthLinks folders={folders} newFolderIds={newFolderIds} />
        </section>
      )}

      <section className="mb-10 mt-10">
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
