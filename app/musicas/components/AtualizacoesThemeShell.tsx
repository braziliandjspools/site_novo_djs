"use client";

import type { ReactNode } from "react";
import { PoolThemeProvider } from "./PoolTheme";

export function AtualizacoesThemeShell({ children }: { children: ReactNode }) {
  return <PoolThemeProvider>{children}</PoolThemeProvider>;
}
