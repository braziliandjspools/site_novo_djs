"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Music2, Sparkles, WandSparkles } from "lucide-react";
import { PortalCard, PortalPageHeader } from "../PortalShell";

type CurationResponse = {
  text?: string;
  jobToken?: string;
  status?: string;
  error?: string;
  code?: string;
};

const MUSIC_ASSISTANT_JOB_STORAGE_KEY = "brs_music_assistant_pending_job";

const EXAMPLE_PROMPTS = [
  "Casamento ao ar livre: cerimônia emocionante, jantar com MPB suave e pista crescente com pop brasileiro e internacional.",
  "Festa de 15 anos com pop atual, funk leve e hits dos anos 2000 para várias gerações.",
  "Flashback dançante com disco, dance e eurodance; comece elegante e termine com a pista no auge.",
];

function formatLine(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>
      : part,
  );
}

function CurationText({ text }: { text: string }) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        const heading = line.match(/^#{1,3}\s+(.+)$/);
        const bullet = line.match(/^[-*•]\s+(.+)$/);
        const numbered = line.match(/^(\d{1,2})[.)]\s+(.+)$/);
        if (heading) {
          return <h3 key={index} className="border-b border-white/[0.08] pb-2 pt-2 text-sm font-black uppercase tracking-wide text-[#b9eaff]">{formatLine(heading[1])}</h3>;
        }
        if (bullet) {
          return <p key={index} className="flex gap-2.5 text-sm leading-relaxed text-zinc-200"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" /><span>{formatLine(bullet[1])}</span></p>;
        }
        if (numbered) {
          return <div key={index} className="flex gap-3 text-sm leading-relaxed text-zinc-200"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-300/[0.07] text-[10px] font-black text-sky-200">{numbered[1]}</span><p>{formatLine(numbered[2])}</p></div>;
        }
        return <p key={index} className="text-sm leading-relaxed text-zinc-300">{formatLine(line.replace(/^>\s?/, ""))}</p>;
      })}
    </div>
  );
}

export function PortalMusicAssistantView({ hasAccess }: { hasAccess: boolean }) {
  const [prompt, setPrompt] = useState("");
  const [curation, setCuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planRequired, setPlanRequired] = useState(false);
  const [savedJobToken, setSavedJobToken] = useState<string | null>(null);
  const [queueMessage, setQueueMessage] = useState("Enviando sua ideia para a IA...");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setSavedJobToken(window.sessionStorage.getItem(MUSIC_ASSISTANT_JOB_STORAGE_KEY));
      } catch {
        setSavedJobToken(null);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function clearSavedJob() {
    try {
      window.sessionStorage.removeItem(MUSIC_ASSISTANT_JOB_STORAGE_KEY);
    } catch {
      // A indisponibilidade do armazenamento não deve impedir a exibição do resultado.
    }
    setSavedJobToken(null);
  }

  async function pollForCuration(jobToken: string) {
    setQueueMessage("Sua solicitação está na fila da IA...");
    let temporaryErrors = 0;

    for (let attempt = 0; attempt < 15; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, attempt === 0 ? 15_000 : 60_000));
      setQueueMessage(attempt < 2
        ? "A IA está processando sua curadoria. A resposta pode levar alguns minutos."
        : `A curadoria continua em processamento (${attempt} consultas). Você pode aguardar ou retomar mais tarde.`);

      let response: Response;
      try {
        response = await fetch(`/api/portal/music-assistant/recommendations?job=${encodeURIComponent(jobToken)}`, {
          cache: "no-store",
        });
      } catch {
        temporaryErrors += 1;
        if (temporaryErrors >= 3) throw new Error("Não foi possível consultar o andamento agora. A solicitação continua salva; tente retomá-la mais tarde.");
        continue;
      }

      const responseText = await response.text();
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("json")) {
        temporaryErrors += 1;
        if (temporaryErrors >= 3) throw new Error("O servidor está temporariamente indisponível. A solicitação continua salva para você retomar depois.");
        continue;
      }

      let data: CurationResponse;
      try {
        data = JSON.parse(responseText) as CurationResponse;
      } catch {
        temporaryErrors += 1;
        if (temporaryErrors >= 3) throw new Error("A resposta do servidor está inválida. A solicitação continua salva para você retomar depois.");
        continue;
      }

      if (response.status === 403 && data.code === "plan_required") {
        clearSavedJob();
        setPlanRequired(true);
        throw new Error(data.error ?? "Seu plano não tem acesso ao Organizador Musical com IA.");
      }
      if (response.status === 429 || response.status >= 500) {
        temporaryErrors += 1;
        if (temporaryErrors >= 3) throw new Error(data.error ?? "A consulta está temporariamente indisponível. Retome o processamento em instantes.");
        continue;
      }
      if (!response.ok) {
        clearSavedJob();
        throw new Error(data.error ?? "Não foi possível consultar esta curadoria.");
      }

      temporaryErrors = 0;
      if (data.status === "completed" && data.text?.trim()) {
        clearSavedJob();
        setCuration(data.text.trim());
        return;
      }
      if (data.status === "failed") {
        clearSavedJob();
        throw new Error(data.error ?? "A IA não conseguiu concluir a curadoria.");
      }
      if (data.status !== "pending") {
        clearSavedJob();
        throw new Error("O status da curadoria retornou inválido.");
      }
    }

    setQueueMessage("O processamento ainda não terminou. Sua solicitação foi salva nesta sessão e pode ser retomada mais tarde.");
    setLoading(false);
  }

  async function resumeCuration() {
    if (!savedJobToken || loading) return;
    setLoading(true);
    setError(null);
    setPlanRequired(false);
    try {
      await pollForCuration(savedJobToken);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível retomar a curadoria.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestPrompt = prompt.trim();
    if (requestPrompt.length < 8) {
      setError("Conte um pouco mais sobre o evento, o público ou o clima que você quer criar.");
      return;
    }

    setLoading(true);
    setError(null);
    setPlanRequired(false);
    setCuration("");
    setQueueMessage("Enviando sua ideia para a IA...");

    try {
      const response = await fetch("/api/portal/music-assistant/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ prompt: requestPrompt }),
      });
      const responseText = await response.text();
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("json")) {
        throw new Error(response.status >= 500
          ? "O organizador está temporariamente indisponível. Tente novamente em instantes."
          : "O servidor respondeu em um formato inesperado. Atualize a página e tente novamente.");
      }

      let data: CurationResponse;
      try {
        data = JSON.parse(responseText) as CurationResponse;
      } catch {
        throw new Error("O servidor retornou uma resposta inválida. Tente novamente em instantes.");
      }
      if (response.status === 403 && data.code === "plan_required") {
        setPlanRequired(true);
        throw new Error(data.error ?? "Este recurso precisa de um plano elegível ativo.");
      }
      if (!response.ok) throw new Error(data.error || "Não foi possível iniciar a curadoria agora.");
      if (!data.jobToken) throw new Error("A IA não confirmou o recebimento do pedido. Tente novamente.");
      try {
        window.sessionStorage.setItem(MUSIC_ASSISTANT_JOB_STORAGE_KEY, data.jobToken);
      } catch {
        // A curadoria continua sendo consultada nesta página mesmo sem armazenamento local.
      }
      setSavedJobToken(data.jobToken);
      await pollForCuration(data.jobToken);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível montar a curadoria agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Organizador Musical"
        subtitle="Descreva o evento e receba uma curadoria em texto, organizada por momentos e energia para sua pista."
      />

      {!hasAccess ? (
        <section className="relative overflow-hidden rounded-2xl border border-sky-300/15 bg-[radial-gradient(ellipse_at_top_right,rgba(125,211,252,0.12),transparent_42%),linear-gradient(135deg,#11171b,#0d0f12_65%)] p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200/15 bg-sky-200/[0.07] text-sky-100"><WandSparkles className="h-5 w-5" /></div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">Recurso exclusivo</p>
          <h2 className="mt-2 max-w-xl text-2xl font-black tracking-tight text-white sm:text-3xl">Sua próxima seleção começa com uma ideia.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">
            O Organizador Musical com IA está disponível para assinantes com VIP ativo nos planos Trimestral, Semestral e Anual.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-300">
            {["Trimestral · R$ 96,00", "Semestral · R$ 180,00", "Anual · R$ 336,00"].map((plan) => (
              <span key={plan} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-2"><Check className="h-3.5 w-3.5 text-sky-200" />{plan}</span>
            ))}
          </div>
          <Link href="/plans" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-200 px-5 py-3 text-sm font-black text-[#0b1115] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-100">
            Ver planos e ativar acesso <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-sky-200/15 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.12),transparent_48%),linear-gradient(120deg,#12191d,#101214_62%)] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.25)] sm:p-7">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-200/15 bg-sky-200/[0.07] text-sky-100 sm:h-12 sm:w-12"><Sparkles className="h-5 w-5 sm:h-6 sm:w-6" /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">Curadoria inteligente</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">O que você está preparando?</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
                  Conte sobre o evento, público, estilos, época, idioma e energia desejada. A IA organiza uma proposta prática para você montar o set.
                </p>
              </div>
            </div>

            <form onSubmit={(event) => void handleSearch(event)} className="mt-5">
              <label htmlFor="portal-music-assistant-prompt" className="sr-only">Descreva seu evento ou ideia musical</label>
              <textarea
                id="portal-music-assistant-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value.slice(0, 600))}
                maxLength={600}
                rows={4}
                placeholder="Ex.: casamento ao ar livre, cerimônia emocionante, jantar com MPB suave e pista crescente com pop e clássicos dos anos 2000..."
                className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-[#0b0d0f]/90 px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-zinc-500 focus:border-sky-200/35 focus:ring-2 focus:ring-sky-200/[0.08]"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                <span>Inclua referências e restrições para receber sugestões mais alinhadas.</span>
                <span>{prompt.length}/600</span>
              </div>
              <button
                type="submit"
                disabled={loading || prompt.trim().length < 8}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-200 px-5 py-3 text-sm font-black text-[#0b1115] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music2 className="h-4 w-4" />}
                {loading ? "Aguardando a IA…" : "Criar curadoria musical"}
              </button>
              {savedJobToken && !loading ? (
                <button type="button" onClick={() => void resumeCuration()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-sky-200/20 bg-sky-200/[0.06] px-4 py-2.5 text-sm font-bold text-sky-100 transition hover:bg-sky-200/[0.12] sm:ml-3 sm:mt-4 sm:w-auto">
                  <Loader2 className="h-4 w-4" /> Retomar curadoria em andamento
                </button>
              ) : null}
            </form>

            <div className="mt-5 border-t border-white/[0.08] pt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Comece por um exemplo</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button key={example} type="button" onClick={() => setPrompt(example)} className="min-h-11 min-w-[230px] max-w-[280px] shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 py-2 text-left text-xs leading-relaxed text-zinc-300 transition hover:border-sky-200/25 hover:bg-sky-200/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/30">
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {error ? (
            <div role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm leading-relaxed text-rose-100">
              {error}
              {planRequired ? <Link href="/plans" className="ml-2 font-bold underline underline-offset-4">Ver planos</Link> : null}
            </div>
          ) : null}

          {loading ? (
            <PortalCard>
              <div className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200/15 bg-sky-200/[0.06] text-sky-100"><Loader2 className="h-5 w-5 animate-spin" /></div>
                <div>
                  <p className="text-sm font-bold text-white">A IA está organizando seu set…</p>
                  <p className="mt-1 max-w-lg text-xs leading-relaxed text-zinc-400">{queueMessage}</p>
                </div>
              </div>
            </PortalCard>
          ) : null}

          {curation ? (
            <PortalCard title="Sua curadoria musical" action={<span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/15 bg-sky-200/[0.06] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-sky-100"><Sparkles className="h-3 w-3" />Gerada por IA</span>}>
              <div className="rounded-xl border border-white/[0.07] bg-[#0b0d0f]/70 p-4 sm:p-6">
                <CurationText text={curation} />
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-zinc-400">
                Sugestões geradas por IA, sem consulta ao vivo. Confira títulos, versões e disponibilidade antes de fechar sua seleção.
              </p>
              <button type="button" onClick={() => { setCuration(""); setError(null); }} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-4 text-xs font-bold text-zinc-300 transition hover:border-sky-200/20 hover:bg-sky-200/[0.04] hover:text-white">
                Criar outra curadoria
              </button>
            </PortalCard>
          ) : null}
        </>
      )}
    </div>
  );
}
