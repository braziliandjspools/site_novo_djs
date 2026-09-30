"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { catalogMediaUrl } from "../lib/catalog-media";

type Producer = {
  id: string;
  name: string;
  slug: string;
  fullName: string | null;
  bio: string | null;
  photoFileId: string | null;
  city: string | null;
  country: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  soundcloud: string | null;
  spotify: string | null;
  website: string | null;
  _count: { productions: number };
};

const blank = {
  name: "",
  fullName: "",
  bio: "",
  photoFileId: "",
  city: "",
  country: "",
  instagram: "",
  facebook: "",
  youtube: "",
  soundcloud: "",
  spotify: "",
  website: "",
};

export function AdminProducers() {
  const [items, setItems] = useState<Producer[]>([]);
  const [form, setForm] = useState({ ...blank, id: "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const photoId = useRef("");

  async function readJson(res: Response) {
    const text = await res.text();
    if (!text) return {} as { items?: Producer[]; item?: Producer; error?: string };
    try {
      return JSON.parse(text) as { items?: Producer[]; item?: Producer; error?: string };
    } catch {
      return { error: "O servidor não conseguiu salvar o produtor." };
    }
  }

  async function load() {
    const res = await fetch("/api/admin/produtores", { cache: "no-store", credentials: "same-origin" });
    const data = await readJson(res);
    if (!res.ok) {
      setError(data.error ?? "Não foi possível carregar os produtores.");
      return;
    }
    setItems(data.items ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const res = await fetch(form.id ? `/api/admin/produtores/${form.id}` : "/api/admin/produtores", {
        method: form.id ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoFileId: photoId.current || form.photoFileId }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.item) {
        setError(data.error ?? "Falha ao salvar.");
        return;
      }
      setOpen(false);
      setForm({ ...blank, id: "" });
      photoId.current = "";
      setNotice(form.id ? "Produtor atualizado." : `${data.item.name} cadastrado.`);
      await load();
    } catch {
      setError("Não foi possível falar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este produtor?")) return;
    const res = await fetch(`/api/admin/produtores/${id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Não foi possível excluir.");
      return;
    }
    await load();
  }

  function startCreate() {
    setError(null);
    setNotice(null);
    photoId.current = "";
    setForm({ ...blank, id: "" });
    setOpen(true);
  }

  function startEdit(item: Producer) {
    setError(null);
    setNotice(null);
    photoId.current = item.photoFileId ?? "";
    setForm({
      id: item.id,
      name: item.name,
      fullName: item.fullName ?? "",
      bio: item.bio ?? "",
      photoFileId: item.photoFileId ?? "",
      city: item.city ?? "",
      country: item.country ?? "",
      instagram: item.instagram ?? "",
      facebook: item.facebook ?? "",
      youtube: item.youtube ?? "",
      soundcloud: item.soundcloud ?? "",
      spotify: item.spotify ?? "",
      website: item.website ?? "",
    });
    setOpen(true);
  }

  function closeEditor() {
    setOpen(false);
    photoId.current = "";
    setForm({ ...blank, id: "" });
  }

  const editor = (
      <form onSubmit={submit} className="grid gap-2 rounded-2xl border border-white/10 bg-[#242424] p-4 sm:grid-cols-2">
        <input className="site-input" placeholder="Nome artístico" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
        <input className="site-input" placeholder="Nome completo" value={form.fullName} onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))} />
        <input className="site-input" placeholder="Cidade" value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} />
        <input className="site-input" placeholder="País" value={form.country} onChange={(e) => setForm((current) => ({ ...current, country: e.target.value }))} />
        <input className="site-input" placeholder="Instagram" value={form.instagram} onChange={(e) => setForm((current) => ({ ...current, instagram: e.target.value }))} />
        <input className="site-input" placeholder="Facebook" value={form.facebook} onChange={(e) => setForm((current) => ({ ...current, facebook: e.target.value }))} />
        <input className="site-input" placeholder="YouTube" value={form.youtube} onChange={(e) => setForm((current) => ({ ...current, youtube: e.target.value }))} />
        <input className="site-input" placeholder="SoundCloud" value={form.soundcloud} onChange={(e) => setForm((current) => ({ ...current, soundcloud: e.target.value }))} />
        <input className="site-input" placeholder="Spotify" value={form.spotify} onChange={(e) => setForm((current) => ({ ...current, spotify: e.target.value }))} />
        <input className="site-input" placeholder="Site" value={form.website} onChange={(e) => setForm((current) => ({ ...current, website: e.target.value }))} />
        <textarea className="site-input min-h-20 sm:col-span-2" placeholder="Biografia" value={form.bio} onChange={(e) => setForm((current) => ({ ...current, bio: e.target.value }))} />
        <label className="text-xs text-white/60 sm:col-span-2">
          Foto
          <input className="mt-1 block w-full" type="file" accept=".jpg,.jpeg,.png,.webp,image/*" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            setError(null);
            try {
              const body = new FormData();
              body.set("file", file);
              body.set("kind", "profile");
              const res = await fetch("/api/admin/producoes/upload", { method: "POST", body, credentials: "same-origin" });
              const data = (await res.json()) as { fileId?: string; error?: string };
              if (!data.fileId) setError(data.error ?? "Falha no envio da foto.");
              else {
                photoId.current = data.fileId;
                setForm((current) => ({ ...current, photoFileId: data.fileId! }));
              }
            } catch {
              setError("Não foi possível enviar a foto.");
            } finally {
              setUploading(false);
            }
          }} />
        </label>
        {uploading ? <p className="text-xs text-white/60 sm:col-span-2">Enviando a foto…</p> : null}
        {catalogMediaUrl(form.photoFileId) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={catalogMediaUrl(form.photoFileId) ?? ""} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : null}
        {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
        {notice ? <p className="text-sm text-[#1db954] sm:col-span-2">{notice}</p> : null}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={saving || uploading} className="site-btn-primary w-fit rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {uploading ? "Enviando a foto…" : saving ? "Salvando…" : form.id ? "Salvar produtor" : "Cadastrar produtor"}
          </button>
          {form.id ? (
            <button type="button" onClick={closeEditor} className="rounded-full border border-white/15 px-4 py-2 text-sm">
              Cancelar
            </button>
          ) : (
            <button type="button" onClick={closeEditor} className="rounded-full border border-white/15 px-4 py-2 text-sm">
              Cancelar
            </button>
          )}
        </div>
      </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Produtores</h1>
        <button type="button" onClick={startCreate} className="site-btn-primary rounded-full px-4 py-2 text-sm font-semibold">
          Cadastrar produtor
        </button>
      </div>
      {notice && !open ? <p className="text-sm text-[#1db954]">{notice}</p> : null}
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label={form.id ? "Editar produtor" : "Cadastrar produtor"}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto">
            <p className="mb-3 text-lg font-semibold">{form.id ? `Editar ${form.name || "produtor"}` : "Cadastrar produtor"}</p>
            {editor}
          </div>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-white/40">
            <tr><th className="p-3">Produtor</th><th className="p-3">Produções</th><th className="p-3">Ações</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item._count.productions}</td>
                <td className="p-3">
                  <button type="button" className="mr-3 text-xs text-[#1db954]" onClick={() => startEdit(item)}>Editar</button>
                  <a className="mr-3 text-xs text-white/70" href={`/p/${item.slug}`} target="_blank" rel="noreferrer">Ver página</a>
                  <button type="button" className="text-xs text-red-300" onClick={() => void remove(item.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
