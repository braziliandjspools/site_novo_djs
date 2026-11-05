import type { Metadata } from "next";
import { EstilosCatalogClient } from "./EstilosCatalogClient";

export const metadata: Metadata = {
  title: "Estilos musicais para DJs | Brazilian Remix Service",
  description: "Explore estilos encontrados no acervo BRS e descubra faixas organizadas por pool e data de atualização.",
  alternates: { canonical: "/musicas/estilos" },
};

export default function EstilosPage() {
  return <EstilosCatalogClient />;
}
