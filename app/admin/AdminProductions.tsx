"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { categoryLabel } from "../lib/brs-productions";
import { formatStyleNameForDisplay } from "../lib/style-display";
import { productionCover } from "../lib/brs-productions";

type Row = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  producer: string;
  genre: string | null;
  category: string;
  publishedAt: string;
  isPublished: boolean;
  coverUrl: string | null;
  coverFileId: string | null;
};

export function AdminProductions() {
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/producoes", { cache: "no-store" });
    const data = (await res.json()) as { items?: Row[]; error?: string };
    if (!res.ok) setError(data.error ?? "Não autorizado");
    else setItems(data.items ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function toggle(item: Row) {
    await fetch(`/api/admin/producoes/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, isPublished: !item.isPublished, publishedAt: item.publishedAt }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir esta produção?")) return;
    await fetch(`/api/admin/producoes/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Produções BRS</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/produtores" className="rounded-full border border-white/15 px-4 py-2">Produtores</Link>
          <Link href="/admin/producoes/nova" className="site-btn-primary rounded-full px-4 py-2 font-semibold">+ Nova produção</Link>
        </div>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-white/40">
            <tr>
              <th className="p-3">Capa</th>
              <th className="p-3">Música</th>
              <th className="p-3">Produtor</th>
              <th className="p-3">Gênero</th>
              <th className="p-3">Lançamento</th>
              <th className="p-3">Status</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={productionCover(item.coverUrl, item.coverFileId)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                </td>
                <td className="p-3">
                  <p>{item.title}</p>
                  <p className="text-xs text-white/45">{item.artist} · {categoryLabel(item.category)}</p>
                </td>
                <td className="p-3">{item.producer}</td>
                <td className="p-3">{formatStyleNameForDisplay(item.genre)}</td>
                <td className="p-3">{new Date(item.publishedAt).toLocaleDateString("pt-BR")}</td>
                <td className="p-3">{item.isPublished ? "Publicada" : "Rascunho"}</td>
                <td className="p-3 text-xs">
                  <Link className="mr-3 text-[#1db954]" href={`/admin/producoes/${item.id}/editar`}>Editar</Link>
                  <Link className="mr-3 text-white/70" href={`/admin/producoes/${item.id}`}>Ver</Link>
                  <button type="button" className="mr-3 text-white/70" onClick={() => void toggle(item)}>{item.isPublished ? "Despublicar" : "Publicar"}</button>
                  <button type="button" className="text-red-300" onClick={() => void remove(item.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
