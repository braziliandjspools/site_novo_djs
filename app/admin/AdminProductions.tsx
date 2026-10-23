"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, Eye, EyeOff, Filter, Loader2, Pencil, Plus, Search, Sparkles, Star, Trash2, X } from "lucide-react";
import Link from "next/link";
import { categoryLabel } from "../lib/brs-productions";
import { formatStyleNameForDisplay } from "../lib/style-display";
import { productionCover } from "../lib/brs-productions";
import { useSiteToast } from "../components/SiteToast";

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
  isFeatured: boolean;
  isNew: boolean;
  coverUrl: string | null;
  coverFileId: string | null;
};

export function AdminProductions() {
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const { showToast } = useSiteToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/producoes", { cache: "no-store" });
      const data = (await res.json()) as { items?: Row[]; error?: string };
      if (!res.ok) setError(data.error ?? "Não autorizado");
      else setItems(data.items ?? []);
    } catch {
      setError("Não foi possível carregar as produções.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);


  const filteredItems = items.filter((item) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [item.title, item.artist, item.producer, item.genre ?? ""].some((value) => value.toLowerCase().includes(needle));
    const matchesStatus = status === "all" || (status === "published" ? item.isPublished : !item.isPublished);
    return matchesQuery && matchesStatus;
  });

  async function updateOption(item: Row, option: "isPublished" | "isFeatured" | "isNew") {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/producoes/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [option]: !item[option] }),
      });
      const data = (await res.json()) as { item?: Row; error?: string };
      if (!res.ok || !data.item) throw new Error(data.error ?? "Não foi possível salvar a opção.");
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, ...data.item } : row));
      const labels = { isPublished: data.item.isPublished ? "Produção publicada para os clientes." : "Produção ocultada dos clientes.", isFeatured: data.item.isFeatured ? "Destaque ativado no catálogo público." : "Destaque removido do catálogo público.", isNew: data.item.isNew ? "Selo de novidade ativado." : "Selo de novidade removido." };
      showToast(labels[option], "success");
    } catch (actionError) {
      showToast(actionError instanceof Error ? actionError.message : "Não foi possível atualizar a produção.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function remove() {
    if (!pendingDelete) return;
    const item = pendingDelete;
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/producoes/${item.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Não foi possível excluir a produção.");
      setItems((current) => current.filter((row) => row.id !== item.id));
      setPendingDelete(null);
      showToast("Produção excluída do catálogo dos clientes.", "success");
    } catch (actionError) {
      showToast(actionError instanceof Error ? actionError.message : "Não foi possível excluir a produção.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-productions-page space-y-6">
      <div className="admin-productions-hero rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(29,185,84,0.14),transparent_45%),rgba(255,255,255,0.02)] p-5 sm:p-6">
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" disabled={busyId === item.id} onClick={() => void updateOption(item, "isPublished")} className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-bold transition disabled:opacity-50 ${item.isPublished ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100 hover:bg-emerald-300/10" : "border-white/10 text-white/55 hover:bg-white/[0.05] hover:text-white"}`}>
                      {busyId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : item.isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {item.isPublished ? "Visível para o cliente" : "Oculta do cliente"}
                    </button>
                    <button type="button" disabled={busyId === item.id} onClick={() => void updateOption(item, "isFeatured")} className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-bold transition disabled:opacity-50 ${item.isFeatured ? "border-amber-200/20 bg-amber-200/[0.06] text-amber-100" : "border-white/10 text-white/45 hover:bg-white/[0.05] hover:text-white"}`}>
                      <Star className="h-3 w-3" />{item.isFeatured ? "Em destaque" : "Destacar"}
                    </button>
                    <button type="button" disabled={busyId === item.id} onClick={() => void updateOption(item, "isNew")} className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-bold transition disabled:opacity-50 ${item.isNew ? "border-sky-200/20 bg-sky-200/[0.06] text-sky-100" : "border-white/10 text-white/45 hover:bg-white/[0.05] hover:text-white"}`}>
                      <Sparkles className="h-3 w-3" />{item.isNew ? "Novidade ativa" : "Marcar novidade"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/producoes/${item.id}/editar`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white"><Pencil className="h-3.5 w-3.5" /> Editar</Link>
                  <Link href={`/admin/producoes/${item.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white" aria-label="Ver"><ExternalLink className="h-3.5 w-3.5" /></Link>
                  <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:border-red-300/25 hover:bg-red-300/[0.06] hover:text-red-200" onClick={() => setPendingDelete(item)} aria-label={`Excluir ${item.title}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && busyId !== pendingDelete.id) setPendingDelete(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="delete-production-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141617] p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-200/80">Excluir produção</p>
                <h2 id="delete-production-title" className="mt-2 text-lg font-bold text-white">{pendingDelete.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/60">Esta produção deixará de aparecer no catálogo dos clientes. Deseja continuar?</p>
              </div>
              <button type="button" disabled={busyId === pendingDelete.id} onClick={() => setPendingDelete(null)} aria-label="Fechar" className="rounded-lg p-2 text-white/45 transition hover:bg-white/5 hover:text-white disabled:opacity-50"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" disabled={busyId === pendingDelete.id} onClick={() => setPendingDelete(null)} className="min-h-10 rounded-lg border border-white/10 px-4 text-xs font-bold text-white/65 transition hover:bg-white/[0.05] hover:text-white">Cancelar</button>
              <button type="button" disabled={busyId === pendingDelete.id} onClick={() => void remove()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-black text-white transition hover:bg-red-400 disabled:opacity-50">
                {busyId === pendingDelete.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Excluir produção
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
