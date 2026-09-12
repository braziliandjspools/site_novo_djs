"use client";

import Image from "next/image";
import { PoolLogosMarquee } from "../../components/PoolLogosMarquee";
import { BrsLogo } from "../../components/BrsLogo";
import { MusicasPageHeader } from "../MusicasShell";
import { MusicasFaqSection } from "../components/MusicasFaqSection";
import { MusicasLibraryDashboard } from "../components/MusicasLibraryDashboard";
import { MusicasMonthLinks } from "../components/MusicasMonthLinks";
import { MusicasListSkeleton } from "../components/MusicasSkeletons";
import { useMusicasSession } from "../components/MusicasSessionContext";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasLibraryHome } from "../hooks/useMusicasLibraryHome";

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

      <section className="mb-8 w-full min-w-0 overflow-hidden" aria-label="Pools parceiras">
        <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          Pools do acervo
        </p>
        <PoolLogosMarquee />
      </section>

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

      <MusicasFaqSection />
    </div>
  );
}
