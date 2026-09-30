"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminGate } from "../../AdminGate";
import { formatStyleNameForDisplay } from "../../../lib/style-display";

export default function AdminProductionView({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl overflow-x-hidden px-4 py-8 text-white sm:px-6">
      <AdminGate>
        <Preview params={params} />
      </AdminGate>
    </main>
  );
}

function Preview({ params }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<Record<string, string | boolean | null> | null>(null);

  useEffect(() => {
    void params.then(({ id }) =>
      fetch(`/api/admin/producoes/${id}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data: { item?: Record<string, string | boolean | null> }) => setItem(data.item ?? null)),
    );
  }, [params]);

  if (!item) return <p className="text-sm text-white/50">Carregando…</p>;
  const slug = String(item.slug ?? "");
  return (
    <div>
      <Link href="/admin/producoes" className="text-xs text-[#1db954]">Voltar</Link>
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#1db954]">{item.isPublished ? "Publicada" : "Rascunho"}</p>
      <h1 className="mt-2 text-3xl font-semibold">{String(item.title)}</h1>
      <p className="mt-2 text-sm text-white/60">{String(item.producer)} · {String(item.versionType)}</p>
      <dl className="mt-6 text-sm">
        <div className="grid grid-cols-[7rem_1fr] border-b border-white/10 py-2"><dt className="text-white/40">BPM</dt><dd>{String(item.bpm ?? "—")}</dd></div>
        <div className="grid grid-cols-[7rem_1fr] border-b border-white/10 py-2"><dt className="text-white/40">Gênero</dt><dd>{formatStyleNameForDisplay(String(item.genre ?? "")) || "—"}</dd></div>
        <div className="grid grid-cols-[7rem_1fr] border-b border-white/10 py-2"><dt className="text-white/40">Duração</dt><dd>{String(item.duration ?? "—")}</dd></div>
      </dl>
      {item.isPublished ? (
        <Link href={`/producoes/${slug}`} className="mt-6 inline-block text-sm text-[#1db954]">Ver página pública</Link>
      ) : (
        <p className="mt-6 text-sm text-white/45">Publique para abrir a página pública.</p>
      )}
    </div>
  );
}
