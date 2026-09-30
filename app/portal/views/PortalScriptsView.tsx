"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clipboard, Code2, FolderOpen, Loader2, ShieldCheck, Tags, Zap } from "lucide-react";
import { PortalCard, PortalPageHeader } from "../PortalShell";

type PortalScript = {
  id: string;
  title: string;
  description: string;
  fileName: string;
  language: "powershell";
  script: string;
};

export function PortalScriptsView({ hasActivePlan }: { hasActivePlan: boolean }) {
  const [scripts, setScripts] = useState<PortalScript[]>([]);
  const [loading, setLoading] = useState(hasActivePlan);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasActivePlan) return;

    let cancelled = false;
    async function loadScripts() {
      try {
        const response = await fetch("/api/portal/scripts", { cache: "no-store" });
        const payload = (await response.json()) as { scripts?: PortalScript[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar os scripts.");
        if (!cancelled) setScripts(payload.scripts ?? []);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os scripts.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadScripts();
    return () => {
      cancelled = true;
    };
  }, [hasActivePlan]);

  async function copyScript(script: PortalScript) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(script.script);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = script.script;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("Seu navegador não permitiu copiar o script.");
      }
      setCopiedId(script.id);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o conteúdo do script e copie manualmente.");
    }
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Scripts"
        subtitle="Ferramentas da administração para agilizar a organização do seu acervo."
      />

      {!hasActivePlan ? (
        <PortalCard>
          <div className="mx-auto max-w-xl py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10 text-amber-300">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-white">Disponível para clientes com plano ativo</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Ative um plano BRS para acessar os scripts disponibilizados pela administração.
            </p>
            <Link
              href="/plans"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#00ff9d] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#00e68a]"
            >
              Ver planos
            </Link>
          </div>
        </PortalCard>
      ) : loading ? (
        <PortalCard>
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-[#ff2ea6]" />
            Carregando scripts disponíveis…
          </div>
        </PortalCard>
      ) : error && scripts.length === 0 ? (
        <PortalCard>
          <p role="alert" className="py-6 text-center text-sm text-red-300">{error}</p>
        </PortalCard>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-[#ff2ea6]/20 bg-[radial-gradient(ellipse_at_top_left,rgba(255,46,166,0.13),transparent_55%),#111411] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.28)] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#ff2ea6]/25 bg-[#ff2ea6]/10 text-[#ff2ea6] sm:flex">
                <Code2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff2ea6]">Biblioteca BRS</p>
                <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">Scripts prontos para usar</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
                  Copie o código e execute no seu computador. Cada ferramenta vem com instruções, requisitos e um resumo do que será feito.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-3 text-xs text-zinc-300">
                <Tags className="h-4 w-4 shrink-0 text-[#ff2ea6]" />
                Ferramentas locais
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-3 text-xs text-zinc-300">
                <Zap className="h-4 w-4 shrink-0 text-[#ff2ea6]" />
                Código pronto para copiar
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-3 text-xs text-zinc-300">
                <FolderOpen className="h-4 w-4 shrink-0 text-[#ff2ea6]" />
                Instruções por script
              </div>
            </div>
          </section>

          {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}

          {scripts.map((script) => (
            <PortalCard
              key={script.id}
              title={script.title}
              action={
                <button
                  type="button"
                  onClick={() => void copyScript(script)}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#ff2ea6] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-[#55e986] sm:px-4 sm:text-xs"
                  aria-label={`Copiar ${script.title}`}
                >
                  {copiedId === script.id ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  {copiedId === script.id ? "Copiado" : "Copiar script"}
                </button>
              }
            >
              <div className="space-y-5">
                <p className="text-sm leading-relaxed text-zinc-300">{script.description}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.07] bg-[#101210] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ff2ea6]">Como funciona</p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                      Leia a descrição do script para saber a pasta de origem, os tipos de arquivo aceitos e o resultado esperado. Os requisitos podem variar entre ferramentas.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-[#101210] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ff2ea6]">Antes de executar</p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                      Revise o código e confira a pasta selecionada antes de executar. Alguns scripts podem mover ou renomear arquivos e pastas conforme descrito.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[#ff2ea6]/20 bg-[#080b09] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                  <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.025] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#ff2ea6] shadow-[0_0_10px_rgba(255,46,166,0.75)]" />
                      <span className="truncate font-mono text-xs text-zinc-300">{script.fileName}</span>
                    </div>
                    <span className="shrink-0 rounded-md border border-[#ff2ea6]/20 bg-[#ff2ea6]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#ff2ea6]">
                      PowerShell
                    </span>
                  </div>
                  <pre className="max-h-[32rem] overflow-auto p-4 text-[11px] leading-[1.7] text-emerald-50/85 [scrollbar-color:#34443a_#080b09] sm:p-5 sm:text-xs">
                    <code>{script.script}</code>
                  </pre>
                </div>

                <p className="text-[11px] leading-relaxed text-zinc-500">
                  O comportamento de cada ferramenta está descrito acima. Confira o código e a pasta selecionada antes de executar.
                </p>
              </div>
            </PortalCard>
          ))}
        </>
      )}
    </div>
  );
}
