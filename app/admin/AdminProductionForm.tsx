"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { catalogMediaUrl } from "../lib/catalog-media";
import { BRS_PRODUCTION_CATEGORIES, BRS_PRODUCTION_VERSIONS } from "../lib/brs-productions";
import { CloudUpload, FileAudio, Loader2, UploadCloud } from "lucide-react";

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
  const [driveLink, setDriveLink] = useState("");
  const [audioSource, setAudioSource] = useState<"drive" | "r2">("drive");
  const [uploadProgress, setUploadProgress] = useState(0);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/admin/produtores", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { items?: ProducerOption[] }) => setProducers(data.items ?? []))
      .catch(() => setProducers([]));
  }, []);

  function set<K extends keyof ProductionDraft>(key: K, value: ProductionDraft[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyRecognizedFile(file: { audioFileId: string; fileName: string; title?: string | null; artist?: string | null; duration?: string | null; bpm?: string | null; format?: string | null; bitrate?: string | null; genre?: string | null; versionType?: string | null; versionLabel?: string | null; coverUrl?: string | null; coverFileId?: string | null }) {
    setForm((current) => ({
      ...current,
      audioFileId: file.audioFileId,
      fileName: file.fileName,
      title: current.title || file.title || "",
      artist: current.artist || file.artist || "",
      duration: current.duration || file.duration || "",
      bpm: current.bpm || file.bpm || "",
      format: current.format || file.format || "",
      bitrate: current.bitrate || file.bitrate || "",
      genre: current.genre || file.genre || "",
      versionType: file.versionType && current.versionType === "Original Mix" ? file.versionType : current.versionType,
      versionLabel: current.versionLabel || file.versionLabel || "",
      coverUrl: current.coverUrl || file.coverUrl || "",
      coverFileId: current.coverFileId || file.coverFileId || "",
    }));
  }

  async function recognizeLink() {
    const link = driveLink.trim();
    if (!link) { setError("Cole o link do arquivo no Google Drive."); return; }
    setBusy("Lendo tags do Drive…"); setError(null);
    try {
      const res = await fetch("/api/admin/producoes/drive", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ link }) });
      const data = (await res.json()) as { error?: string; file?: Parameters<typeof applyRecognizedFile>[0] };
      if (!res.ok || !data.file) { setError(data.error ?? "Não reconheci esse link."); return; }
      applyRecognizedFile(data.file); setAudioSource("drive");
    } catch { setError("Não consegui ler o link do Drive."); }
    finally { setBusy(""); }
  }

  function uploadAudioToR2(file: File) {
    setBusy("Enviando faixa para o R2…"); setError(null); setUploadProgress(0);
    const body = new FormData(); body.set("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/producoes/upload-r2"); xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as { error?: string; file?: Parameters<typeof applyRecognizedFile>[0] };
        if (xhr.status < 200 || xhr.status >= 300 || !data.file) { setError(data.error ?? "Falha no upload da faixa."); setBusy(""); return; }
        applyRecognizedFile(data.file); setAudioSource("r2"); setUploadProgress(100); setBusy("");
      } catch { setError("O servidor devolveu uma resposta inválida."); setBusy(""); }
      finally { window.setTimeout(() => setUploadProgress(0), 1200); }
    };
    xhr.onerror = () => { setError("Falha de conexão durante o upload."); setBusy(""); setUploadProgress(0); };
    xhr.onabort = () => { setError("Upload cancelado."); setBusy(""); setUploadProgress(0); };
    xhr.send(body);
  }

  async function uploadCover(file: File) {
    setBusy("Enviando capa…");
    setError(null);
    const body = new FormData();
    body.set("file", file);
    body.set("kind", "cover");
    const res = await fetch("/api/admin/producoes/upload", { method: "POST", credentials: "same-origin", body });
    const data = (await res.json()) as { fileId?: string; url?: string; error?: string };
    setBusy("");
    if (!res.ok || !data.fileId) {
      setError(data.error ?? "Falha no envio da capa.");
      return;
    }
    set("coverFileId", data.fileId);
    if (data.url) set("coverUrl", data.url);
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
    setError(null);
    if (!form.audioFileId || !form.fileName) {
      setError("Adicione a música pelo Drive ou faça o upload para o R2.");
      return;
    }
    setBusy("Salvando…");
    try {
      const payload = { ...form, publishedAt: new Date(`${form.publishedAt}T12:00:00`).toISOString() };
      const res = await fetch(form.id ? `/api/admin/producoes/${form.id}` : "/api/admin/producoes", {
        method: form.id ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      const data = text ? (JSON.parse(text) as { error?: string }) : {};
      if (!res.ok) {
        setError(data.error ?? "Falha ao salvar.");
        return;
      }
      router.push("/admin/producoes");
      router.refresh();
    } catch {
      setError("Não foi possível salvar a produção.");
    } finally {
      setBusy("");
    }
  }

  const coverPreview = form.coverUrl || catalogMediaUrl(form.coverFileId);

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
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#1db954]/20 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white"><FileAudio className="h-4 w-4 text-[#1db954]" /> Google Drive</div>
            <p className="mt-1 text-xs text-white/45">Cole o link e o BRS lê as tags da faixa.</p>
            <input className="site-input mt-3" placeholder="https://drive.google.com/file/d/..." value={driveLink} onChange={(e) => setDriveLink(e.target.value)} onKeyDown={(event) => { if (event.key !== "Enter") return; event.preventDefault(); void recognizeLink(); }} />
            <button type="button" onClick={() => void recognizeLink()} disabled={Boolean(busy)} className="mt-2 inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold text-white hover:border-[#1db954]/50 hover:bg-white/5 disabled:opacity-50">Reconhecer Drive</button>
          </div>
          <div className="rounded-2xl border border-[#7eb6ff]/20 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white"><CloudUpload className="h-4 w-4 text-[#7eb6ff]" /> Upload R2</div>
            <p className="mt-1 text-xs text-white/45">Envie direto para o Cloudflare R2 e reconheça as tags.</p>
            <input ref={audioInputRef} className="hidden" type="file" accept=".mp3,.wav,.flac,.aiff,.aif,audio/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadAudioToR2(file); e.currentTarget.value = ""; }} />
            <button type="button" onClick={() => audioInputRef.current?.click()} disabled={Boolean(busy)} className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[#7eb6ff]/40 bg-[#7eb6ff]/5 px-4 py-4 text-sm font-bold text-white hover:bg-[#7eb6ff]/10 disabled:opacity-50"><UploadCloud className="h-5 w-5 text-[#7eb6ff]" /> Selecionar faixa</button>
            {uploadProgress > 0 ? <div className="mt-3"><div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/50"><span>{uploadProgress >= 100 ? "Concluído" : "Enviando…"}</span><span>{uploadProgress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#7eb6ff] transition-[width] duration-200" style={{ width: `${uploadProgress}%` }} /></div></div> : null}
          </div>
        </div>
        {form.fileName ? <div className="flex items-center justify-between gap-3 rounded-xl border border-[#1db954]/20 bg-[#1db954]/5 px-3 py-2 text-xs"><span className="truncate text-[#9ef7c0]">{form.fileName}</span><span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-white/45">{audioSource === "r2" ? "Cloudflare R2" : "Google Drive"}</span></div> : null}
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
            void uploadCover(file);
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
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /> Publicada em /musicas</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> Destaque na Home</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.isNew} onChange={(e) => set("isNew", e.target.checked)} /> Selo Novo</label>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {busy ? <p className="inline-flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" />{busy}</p> : null}
      <button type="submit" disabled={Boolean(busy)} className="site-btn-primary w-fit rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
        {form.id ? "Salvar alterações" : "Salvar"}
      </button>
    </form>
  );
}
