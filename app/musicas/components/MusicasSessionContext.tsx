"use client";

import { createContext, useContext, useMemo } from "react";

export type MusicasSessionValue = {
  authenticated: boolean;
  hasVip: boolean;
  userName: string;
  openLogin: () => void;
  onLogout: () => void;
};

const MusicasSessionContext = createContext<MusicasSessionValue | null>(null);

export function MusicasSessionProvider({
  value,
  children,
}: {
  value: MusicasSessionValue;
  children: React.ReactNode;
}) {
  const memo = useMemo(() => value, [value]);
  return <MusicasSessionContext.Provider value={memo}>{children}</MusicasSessionContext.Provider>;
}

export function useMusicasSession() {
  const context = useContext(MusicasSessionContext);
  if (!context) {
    throw new Error("useMusicasSession must be used within MusicasSessionProvider");
  }
  return context;
}
