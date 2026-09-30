"use client";

import { useEffect, useState } from "react";
import { HomeProductions } from "../../components/HomeProductions";
import type { PublicBrsProduction } from "../../lib/brs-productions";

export function MusicasProductionsSection() {
  const [items, setItems] = useState<PublicBrsProduction[]>([]);

  useEffect(() => {
    void fetch("/api/producoes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { items?: PublicBrsProduction[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;
  return <HomeProductions productions={items} embedded />;
}
