import { Suspense } from "react";

export default function AtualizacoesLayout({ children }: LayoutProps<"/musicas/atualizacoes">) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
