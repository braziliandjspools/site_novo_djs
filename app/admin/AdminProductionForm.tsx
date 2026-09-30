"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BRS_PRODUCTION_CATEGORIES, BRS_PRODUCTION_VERSIONS } from "../lib/brs-productions";

export type ProductionDraft = {
  id?: string;
  title: string;
  artist: string;
  producerId: string;
  versionType: string;
  versionLabel: string;
  category: string;
  genre: string;
  duration: string;
  bpm: string;
  format: string;
  bitrate: string;
  publishedAt: string;
  audioFileId: string;
  fileName: string;
  downloadFileId: string;
  coverFileId: string;
  coverUrl: string;
  description: string;
  isPublished: boolean;
  isFeatured: boolean;
  isNew: boolean;
};

type ProducerOption = { id: string; name: string; slug: string };

const empty: ProductionDraft = {
  title: "",
  artist: "",
  producerId: "",
  versionType: "Original Mix",
  versionLabel: "",
  category: "BRS_ORIGINAL",
  genre: "",
  duration: "",
  bpm: "",
  format: "",
  bitrate: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  audioFileId: "",
  fileName: "",
  downloadFileId: "",
  coverFileId: "",
  coverUrl: "",
  description: "",
  isPublished: false,
  isFeatured: false,
  isNew: false,
};

export function AdminProductionForm({ initial }: { initial?: ProductionDraft }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductionDraft>(initial ?? empty);
  const [producers, setProducers] = useState<ProducerOption[]>([]);
  const [producerName, setProducerName] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [coverWarn, setCoverWarn] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/produtores", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { items?: ProducerOption[] }) => setProducers(data.items ?? []))
      .catch(() => setProducers([]));
  }, []);

  function set<K extends keyof ProductionDraft>(key: K, value: ProductionDraft[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function upload(file: File, kind: "audio" | "cover") {
    setBusy(kind === "audio" ? "Enviando música…" : "Enviando capa…");
    setError(null);
    const body = new FormData();
    body.set("file", file);
    body.set("kind", kind);
    const res = await fetch("/api/admin/producoes/upload", { method: "POST", body });
    const data = (await res.json()) as {
      fileId?: string;
      fileName?: string;
      duration?: string;
      bpm?: string;
      format?: string;
      bitrate?: string;
      error?: string;
    };
    setBusy("");
    if (!res.ok || !data.fileId) {
      setError(data.error ?? "Falha no envio.");
      return;
    }
    if (kind === "audio") {
      setForm((current) => ({
        ...current,
        audioFileId: data.fileId!,
        fileName: data.fileName || file.name,
        duration: data.duration || current.duration,
        bpm: data.bpm || current.bpm,
        format: data.format || current.format,
        bitrate: data.bitrate || current.bitrate,
      }));
    } else {
      set("coverFileId", data.fileId);
    }
  }

  async function createProducer() {
    const name = producerName.trim();
    if (!name) {
      setError("Informe o nome do produtor.");
      return;
    }
    setBusy("Criando produtor…");
    setError(null);
    try {
      const res = await fetch("/api/admin/produtores", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const text = await res.text();
      const data = text
        ? (JSON.parse(text) as { item?: ProducerOption; error?: string })
        : {};
      if (!res.ok || !data.item) {
        setError(data.error ?? "Não foi possível criar o produtor.");
        return;
      }
      setProducers((current) => [...current, data.item!].sort((a, b) => a.name.localeCompare(b.name)));
      set("producerId", data.item.id);
      setProducerName("");
    } catch {
      setError("Não foi possível criar o produtor.");
    } finally {
      setBusy("");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy("Salvando…");
    setError(null);
    const payload = { ...form, publishedAt: new Date(`${form.publishedAt}T12:00:00`).toISOString() };
    const res = await fetch(form.id ? `/api/admin/producoes/${form.id}` : "/api/admin/producoes", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    setBusy("");
    if (!res.ok) {
      setError(data.error ?? "Falha ao salvar.");
      return;
    }
    router.push("/admin/producoes");
    router.refresh();
  }

  const coverPreview = form.coverFileId
    ? `/api/musicas/cover/${form.coverFileId}`
    : form.coverUrl || null;

  return (
    <form onSubmit={submit} className="grid gap-4 text-sm">
      <fieldset className="grid gap-3 rounded-2xl border border-white/10 bg-[#242424] p-4">
        <legend className="px-1 text-xs font-semibold tracking-[0.14em] text-white/50">INFORMAÇÕES</legend>
        <input className="site-input" placeholder="Título" value={form.title} onChange={(e) => set("title", e.target.value)} required />
        <input className="site-input" placeholder="Artista" value={form.artist} onChange={(e) => set("artist", e.target.value)} required />
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <select className="site-input" value={form.producerId} onChange={(e) => set("producerId", e.target.value)} required>
            <option value="">Selecionar produtor</option>
            {producers.map((producer) => (
              <option key={producer.id} value={producer.id}>{producer.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              className="site-input"
              placeholder="Novo produtor"
              value={producerName}
              onChange={(e) => setProducerName(e.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                void createProducer();
              }}
            />
            <button type="button" onClick={() => void createProducer()} className="rounded-full border border-white/15 px-3 text-xs">Criar</button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <select className="site-input" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {BRS_PRODUCTION_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <select className="site-input" value={form.versionType} onChange={(e) => set("versionType", e.target.value)}>
            {BRS_PRODUCTION_VERSIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <input className="site-input" type="date" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} required />
        </div>
      </fieldset>

      <fieldset className="grid gap-3 rounded-2xl border border-white/10 bg-[#242424] p-4">
        <legend className="px-1 text-xs font-semibold tracking-[0.14em] text-white/50">ARQUIVO E CAPA</legend>
        <label className="text-xs text-white/60">
          Arquivo da música (MP3, WAV, FLAC, AIFF)
          <input className="mt-1 block w-full text-xs" type="file" accept=".mp3,.wav,.flac,.aiff,.aif,audio/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file, "audio");
          }} />
        </label>
        {form.fileName ? <p className="text-xs text-[#ff2ea6]">{form.fileName}</p> : null}
        <label className="text-xs text-white/60">
          Capa da produção
          <input className="mt-1 block w-full text-xs" type="file" accept=".jpg,.jpeg,.png,.webp,image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const image = new Image();
            image.onload = () => {
              setCoverWarn(image.width !== image.height ? "A capa não é quadrada. O ideal é 1200×1200." : null);
            };
            image.src = URL.createObjectURL(file);
            void upload(file, "cover");
          }} />
        </label>
        {coverWarn ? <p className="text-xs text-amber-300">{coverWarn}</p> : null}
        {coverPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPreview} alt="" className="h-28 w-28 rounded-xl object-cover" />
        ) : null}
      </fieldset>

      <fieldset className="grid gap-2 rounded-2xl border border-white/10 bg-[#242424] p-4 sm:grid-cols-2">
        <legend className="px-1 text-xs font-semibold tracking-[0.14em] text-white/50">FICHA TÉCNICA</legend>
        <input className="site-input" placeholder="Duração (04:32)" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
        <input className="site-input" placeholder="BPM" value={form.bpm} onChange={(e) => set("bpm", e.target.value)} />
        <input className="site-input" placeholder="Gênero (140 - Deep Dubstep - Grime)" value={form.genre} onChange={(e) => set("genre", e.target.value)} />
        <input className="site-input" placeholder="Versão" value={form.versionLabel} onChange={(e) => set("versionLabel", e.target.value)} />
        <input className="site-input" placeholder="Formato" value={form.format} onChange={(e) => set("format", e.target.value)} />
        <input className="site-input" placeholder="Bitrate" value={form.bitrate} onChange={(e) => set("bitrate", e.target.value)} />
        <textarea className="site-input min-h-24 sm:col-span-2" placeholder="Descrição" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </fieldset>

      <div className="flex flex-wrap gap-4 text-xs text-white/70">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /> Publicada</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> Destaque na Home</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.isNew} onChange={(e) => set("isNew", e.target.checked)} /> Selo Novo</label>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {busy ? <p className="text-sm text-white/60">{busy}</p> : null}
      <button type="submit" disabled={Boolean(busy)} className="site-btn-primary w-fit rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
        {form.id ? "Salvar alterações" : "Salvar"}
      </button>
    </form>
  );
}
