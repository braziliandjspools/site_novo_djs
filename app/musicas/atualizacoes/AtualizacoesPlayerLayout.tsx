"use client";

import { useMusicasSession } from "../components/MusicasSessionContext";
import { VipMusicPlayerProvider } from "../components/VipMusicPlayerContext";

export function AtualizacoesPlayerLayout({ children }: { children: React.ReactNode }) {
  const { hasVip } = useMusicasSession();

  return <VipMusicPlayerProvider canPlay={hasVip}>{children}</VipMusicPlayerProvider>;
}
