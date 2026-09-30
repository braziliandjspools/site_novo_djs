"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Code2, Loader2, Plus, RefreshCw, Save, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";

type ScriptRow = {
  id: string;
  title: string;
  description: string;
  fileName: string;
  language: "powershell";
  script: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type ScriptForm = Pick<ScriptRow, "title" | "description" | "fileName" | "script">;
type AdminScriptsProps = { onLogout: () => void };

const emptyForm: ScriptForm = { title: "", description: "", fileName: "", script: "" };

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

export function AdminScripts({ onLogout }: AdminScriptsProps) {
  const [scripts, setScripts] = useState<ScriptRow[]>([]);
  const [form, setForm] = useState<ScriptForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/scripts", { credentials: "same-origin", cache: "no-store" });
      const data = (await response.json()) as { scripts?: ScriptRow[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar os scripts.");
      setScripts(data.scripts ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar os scripts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carrega o banco assim que a área de scripts é aberta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setActive(true);
    setError(null);
    setSuccess(null);
  }

  function startEdit(script: ScriptRow) {
    setEditingId(script.id);
    setForm({
      title: script.title,
      description: script.description,
      fileName: script.fileName,
      script: script.script,
    });
    setActive(script.active);
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(editingId ? `/api/admin/scripts/${editingId}` : "/api/admin/scripts", {
        method: editingId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, active, language: "powershell" }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar o script.");
      setSuccess(editingId ? "Script atualizado." : "Script cadastrado e disponível no portal.");
      startNew();
      setSuccess(editingId ? "Script atualizado." : "Script cadastrado e disponível no portal.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao salvar o script.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(script: ScriptRow) {
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/scripts/${script.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !script.active }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível alterar a publicação.");
      setSuccess(script.active ? "Script ocultado do portal." : "Script publicado no portal.");
      await load();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Erro ao alterar a publicação.");
    }
  }

  async function remove(script: ScriptRow) {
    if (!window.confirm(`Excluir “${script.title}” do portal?`)) return;
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/scripts/${script.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível excluir o script.");
      if (editingId === script.id) startNew();
      setSuccess("Script excluído do banco de dados.");
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Erro ao excluir o script.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-white">
            <Code2 className="h-6 w-6 text-[#ff2ea6]" /> Scripts do portal
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Cadastre e publique scripts PowerShell no banco. Os scripts ativos aparecem para clientes logados com plano ativo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-3 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/5"
          >
            Voltar ao admin
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
          </button>
          <button
            type="button"
            onClick={startNew}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#ff2ea6] px-3 text-xs font-black uppercase tracking-wider text-black hover:bg-[#55e986]"
          >
            <Plus className="h-4 w-4" /> Novo script
          </button>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
              onLogout();
            }}
            className="min-h-10 rounded-lg border border-red-400/20 px-3 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-400/10"
          >
            Sair
          </button>
        </div>
      </header>

      {error ? <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {success ? <p role="status" className="rounded-xl border border-[#ff2ea6]/20 bg-[#ff2ea6]/10 px-4 py-3 text-sm text-[#a5f3bf]">{success}</p> : null}

      <form onSubmit={(event) => void save(event)} className="rounded-2xl border border-[#ff2ea6]/20 bg-[#111411] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.22)] sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff2ea6]">
              {editingId ? "Editar script" : "Novo cadastro"}
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">Conteúdo do script</h2>
          </div>
          {editingId ? (
            <button type="button" onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-white/5">
              <X className="h-4 w-4" /> Cancelar edição
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-bold text-zinc-300">
            Título
            <input
              required maxLength={120} value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Ex.: Organizar músicas por estilo"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-normal text-white outline-none focus:border-[#ff2ea6]/50"
            />
          </label>
          <label className="block text-xs font-bold text-zinc-300">
            Nome do arquivo (.ps1)
            <input
              required maxLength={180} value={form.fileName}
              onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))}
              placeholder="organizar-musicas.ps1"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-mono font-normal text-white outline-none focus:border-[#ff2ea6]/50"
            />
          </label>
          <label className="block text-xs font-bold text-zinc-300 sm:col-span-2">
            Descrição para os clientes
            <textarea
              required maxLength={4000} rows={3} value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Explique o que o script faz e como ele organiza os arquivos."
              className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-normal leading-relaxed text-white outline-none focus:border-[#ff2ea6]/50"
            />
          </label>
          <label className="block text-xs font-bold text-zinc-300 sm:col-span-2">
            Código PowerShell
            <textarea
              required maxLength={500000} rows={18} spellCheck={false} value={form.script}
              onChange={(event) => setForm((current) => ({ ...current, script: event.target.value }))}
              placeholder="# Cole o script PowerShell completo aqui"
              className="mt-1.5 w-full resize-y rounded-xl border border-[#ff2ea6]/20 bg-[#080b09] p-4 font-mono text-[11px] leading-[1.7] text-emerald-50/90 outline-none focus:border-[#ff2ea6]/50 sm:text-xs"
            />
            <span className="mt-1 block font-normal text-zinc-500">Até 500 mil caracteres. O conteúdo é armazenado no banco e copiado no portal exatamente como foi salvo.</span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="h-4 w-4 accent-[#ff2ea6]" />
            Publicar para clientes com plano ativo
          </label>
          <button
            type="submit" disabled={saving}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ff2ea6] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#55e986] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingId ? "Salvar alterações" : "Cadastrar script"}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-300">Biblioteca cadastrada</h2>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold text-zinc-400">{scripts.length} {scripts.length === 1 ? "script" : "scripts"}</span>
        </div>
        {loading && scripts.length === 0 ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-10 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Carregando scripts…</div>
        ) : scripts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-zinc-500">Nenhum script cadastrado ainda.</div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {scripts.map((script) => (
              <article key={script.id} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-bold text-white">{script.title}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${script.active ? "border-[#ff2ea6]/25 bg-[#ff2ea6]/10 text-[#ff2ea6]" : "border-white/10 bg-white/5 text-zinc-500"}`}>
                        {script.active ? "Publicado" : "Oculto"}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-mono text-[10px] text-zinc-500">{script.fileName} · cadastrado em {dateLabel(script.createdAt)}</p>
                  </div>
                  <button
                    type="button" onClick={() => void toggleActive(script)}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"
                    aria-label={script.active ? "Ocultar script" : "Publicar script"}
                    title={script.active ? "Ocultar do portal" : "Publicar no portal"}
                  >
                    {script.active ? <ToggleRight className="h-6 w-6 text-[#ff2ea6]" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>
                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">{script.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.07] pt-3">
                  <button type="button" onClick={() => startEdit(script)} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/5">Editar</button>
                  <button type="button" onClick={() => void remove(script)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/20 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-300 hover:bg-red-400/10">
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
