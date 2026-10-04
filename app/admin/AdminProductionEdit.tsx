"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminProductionForm, type ProductionDraft } from "./AdminProductionForm";

export function AdminProductionEdit({ id }: { id: string }) {
  const [draft, setDraft] = useState<ProductionDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/producoes/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { item?: Record<string, unknown>; error?: string };
        if (!res.ok || !data.item) {
          setError(data.error ?? "Produção não encontrada.");
          return;
        }
        const item = data.item;
        setDraft({
          id: String(item.id),
          title: String(item.title ?? ""),
          artist: String(item.artist ?? ""),
          producerId: String(item.producerId ?? ""),
          versionType: String(item.versionType ?? "Original Mix"),
          versionLabel: String(item.versionLabel ?? ""),
          category: String(item.category ?? "BRS_ORIGINAL"),
          genre: String(item.genre ?? ""),
          duration: String(item.duration ?? ""),
          bpm: String(item.bpm ?? ""),
          format: String(item.format ?? ""),
          bitrate: String(item.bitrate ?? ""),
          publishedAt: String(item.publishedAt ?? "").slice(0, 10),
          audioFileId: String(item.audioFileId ?? ""),
          fileName: String(item.fileName ?? ""),
          downloadFileId: String(item.downloadFileId ?? ""),
          coverFileId: String(item.coverFileId ?? ""),
          coverUrl: String(item.coverUrl ?? ""),
          description: String(item.description ?? ""),
          beatportUrl: String(item.beatportUrl ?? ""),
          isPublished: Boolean(item.isPublished),
          isFeatured: Boolean(item.isFeatured),
          isNew: Boolean(item.isNew),
        });
      })
      .catch(() => setError("Não foi possível carregar."));
  }, [id]);

  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (!draft) return <p className="text-sm text-white/50">Carregando…</p>;
  return (
    <div>
      <Link href="/admin/producoes" className="mb-4 inline-block text-xs text-[#1db954]">Voltar</Link>
      <h1 className="mb-4 text-2xl font-semibold">Editar produção</h1>
      <AdminProductionForm initial={draft} />
    </div>
  );
}
