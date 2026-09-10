"use client";

import { AtualizacoesFeed } from "../components/AtualizacoesFeed";
import { AtualizacoesSyncNotice } from "../components/AtualizacoesSyncNotice";
import { useMusicasSession } from "../components/MusicasSessionContext";

export default function AtualizacoesPage() {
  const { hasVip } = useMusicasSession();

  return (
    <div className="w-full">
      <AtualizacoesSyncNotice />
      <AtualizacoesFeed canPlay={hasVip} />
    </div>
  );
}
