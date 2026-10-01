"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Filter, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/producoes", { cache: "no-store" });
    const data = (await res.json()) as { items?: Row[]; error?: string };
    if (!res.ok) setError(data.error ?? "Não autorizado");
    else setItems(data.items ?? []);
    setLoading(false);
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

  const filteredItems = items.filter((item) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [item.title, item.artist, item.producer, item.genre ?? ""].some((value) => value.toLowerCase().includes(needle));
    const matchesStatus = status === "all" || (status === "published" ? item.isPublished : !item.isPublished);
    return matchesQuery && matchesStatus;
  });

  async function remove(id: string) {
    if (!window.confirm("Excluir esta produção?")) return;
    await fetch(`/api/admin/producoes/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(29,185,84,0.14),transparent_45%),rgba(255,255,255,0.02)] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1db954]">Catálogo BRS</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Produções</h1>
            <p className="mt-1 text-sm text-white/45">Gerencie faixas, versões, produtores e publicações em um único lugar.</p>
          </div>
          <Link href="/admin/producoes/nova" className="site-btn-primary inline-flex h-11 items-center gap-2 rounded-full px-5 font-semibold"><Plus className="h-4 w-4" /> Nova produção</Link>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" /><input className="site-input pl-9" placeholder="Buscar título, artista ou produtor…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-1"><Filter className="ml-2 h-4 w-4 text-white/30" />{(["all","published","draft"] as const).map((value) => <button key={value} type="button" onClick={() => setStatus(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${status === value ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>{value === "all" ? "Todos" : value === "published" ? "Publicadas" : "Rascunhos"}</button>)}</div>
          <Link href="/admin/produtores" className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white">Produtores</Link>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {loading ? <div className="flex items-center justify-center gap-2 py-20 text-sm text-white/40"><Loader2 className="h-4 w-4 animate-spin" />Carregando produções…</div> : filteredItems.length === 0 ? <div className="py-20 text-center text-sm text-white/40">Nenhuma produção encontrada.</div> : (
          <div className="divide-y divide-white/5">
            {filteredItems.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 p-4 transition hover:bg-white/[0.025] sm:flex-row sm:items-center">
                <img src={productionCover(item.coverUrl, item.coverFileId)} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-white/10" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-white">{item.title}</h2><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${item.isPublished ? "bg-[#1db954]/15 text-[#9ef7c0]" : "bg-white/5 text-white/40"}`}>{item.isPublished ? "Publicada" : "Rascunho"}</span></div>
                  <p className="mt-1 truncate text-xs text-white/45">{item.artist} · {item.producer} · {formatStyleNameForDisplay(item.genre)}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/25">{categoryLabel(item.category)} · {new Date(item.publishedAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/producoes/${item.id}/editar`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white"><Pencil className="h-3.5 w-3.5" /> Editar</Link>
                  <Link href={`/admin/producoes/${item.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white" aria-label="Ver"><ExternalLink className="h-3.5 w-3.5" /></Link>
                  <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-red-300" onClick={() => void remove(item.id)} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
