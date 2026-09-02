"use client";



import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, LogIn, MessageCircle, Receipt, RefreshCw, Send, Sparkles, UserCheck, Wand2 } from "lucide-react";

import {

  calculateEstimatedTotal,

  formatDeadlineOptionLabel,

  formatEstimatedQuote,

  getMusicProducerPlanById,

  MUSIC_PRODUCER_DEADLINE_OPTIONS,

  MUSIC_PRODUCER_PRICING_PLANS,

} from "../lib/music-producer-pricing";
import { MAX_BRIEFING_AI_GENERATIONS } from "../lib/music-producer-constants";
import {
  musicProducerBriefingWhatsAppUrl,
  validateMusicProducerBriefing,
  validateMusicProducerBriefingContact,
  type MusicProducerBriefingPayload,
} from "../lib/music-producer-briefing-message";

const inputClassName =

  "w-full rounded-md border-0 bg-[#282828] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-[#727272] focus:bg-[#333333] focus:ring-2 focus:ring-[#1DB954]";

const selectClassName = `${inputClassName} cursor-pointer`;



const labelClassName = "mb-2 block text-xs font-bold uppercase tracking-wider text-[#b3b3b3]";



type AiResult = {

  projectType: string;

  idea: string;

  lyrics: string;

  style: string;

  occasion: string;

  used?: number;

  remaining?: number;

  max?: number;

  canRegenerate?: boolean;

};



type AiLimitStatus = {

  used: number;

  remaining: number;

  max: number;

  canRegenerate: boolean;

};



type PortalProfile = {

  name: string;

  email: string;

  whatsapp: string;

};



function matchPlanId(projectType: string) {

  const normalized = projectType.trim().toLowerCase();

  return MUSIC_PRODUCER_PRICING_PLANS.find((plan) => plan.name.toLowerCase() === normalized)?.id;

}



export function MusicProducerBriefingForm() {

  const [portalProfile, setPortalProfile] = useState<PortalProfile | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  const [selectedPlanId, setSelectedPlanId] = useState("");

  const [projectIdea, setProjectIdea] = useState("");

  const [lyrics, setLyrics] = useState("");

  const [style, setStyle] = useState("");

  const [occasion, setOccasion] = useState("");

  const [deadline, setDeadline] = useState("normal");

  const [additionalNotes, setAdditionalNotes] = useState("");

  const [ideaPrompt, setIdeaPrompt] = useState("");

  const [loading, setLoading] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [aiError, setAiError] = useState<string | null>(null);

  const [aiGenerated, setAiGenerated] = useState(false);

  const [aiLimit, setAiLimit] = useState<AiLimitStatus>({

    used: 0,

    remaining: MAX_BRIEFING_AI_GENERATIONS,

    max: MAX_BRIEFING_AI_GENERATIONS,

    canRegenerate: true,

  });

  const [success, setSuccess] = useState(false);

  const [submittedQuote, setSubmittedQuote] = useState<string | null>(null);

  const [submittedVia, setSubmittedVia] = useState<"portal" | "whatsapp" | null>(null);

  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string | null>(null);



  const applyPortalProfile = useCallback((profile: PortalProfile) => {
    setPortalProfile(profile);
  }, []);



  const resetProjectFields = useCallback(() => {

    setSelectedPlanId("");

    setProjectIdea("");

    setLyrics("");

    setStyle("");

    setOccasion("");

    setDeadline("normal");

    setAdditionalNotes("");

    setIdeaPrompt("");

    setAiGenerated(false);

    setError(null);

    setAiError(null);

    setAiLimit({

      used: 0,

      remaining: MAX_BRIEFING_AI_GENERATIONS,

      max: MAX_BRIEFING_AI_GENERATIONS,

      canRegenerate: true,

    });

  }, []);



  const loadAiLimit = useCallback(async () => {

    try {

      const res = await fetch("/api/music-producer/generate-idea", { cache: "no-store" });

      if (!res.ok) return;

      const data = (await res.json()) as AiLimitStatus;

      setAiLimit(data);

    } catch {

      /* mantém defaults */

    }

  }, []);



  useEffect(() => {

    let cancelled = false;



    async function loadPortalProfile() {

      try {

        const res = await fetch("/api/portal/data", { cache: "no-store" });

        if (!res.ok || cancelled) return;



        const data = (await res.json()) as {

          user?: { name?: string; email?: string; whatsapp?: string };

        };



        const user = data.user;

        if (!user?.name || !user.email || !user.whatsapp) return;



        applyPortalProfile({

          name: user.name,

          email: user.email,

          whatsapp: user.whatsapp,

        });

      } catch {

        /* visitante sem sessão do portal */

      } finally {

        if (!cancelled) setPortalReady(true);

      }

    }



    void loadPortalProfile();

    void loadAiLimit();

    return () => {

      cancelled = true;

    };

  }, [applyPortalProfile, loadAiLimit]);



  const selectedPlan = useMemo(

    () => (selectedPlanId ? getMusicProducerPlanById(selectedPlanId) : undefined),

    [selectedPlanId],

  );



  const estimate = useMemo(

    () => (selectedPlan ? calculateEstimatedTotal(selectedPlan, deadline) : null),

    [selectedPlan, deadline],

  );



  function buildBriefingPayload(): MusicProducerBriefingPayload {
    if (!portalProfile) {
      throw new Error("Faça login no portal para enviar o pedido.");
    }

    return {
      name: portalProfile.name,
      email: portalProfile.email,
      whatsapp: portalProfile.whatsapp,

      servicePlan: selectedPlan?.name ?? "",

      estimatedQuote: selectedPlan ? formatEstimatedQuote(selectedPlan, deadline) : "",

      deadlineSurcharge: estimate?.surchargeFormatted ?? "",

      idea: projectIdea,

      lyrics,

      style,

      occasion,

      deadline: MUSIC_PRODUCER_DEADLINE_OPTIONS.find((o) => o.id === deadline)?.label ?? deadline,

      message: additionalNotes,

    };

  }



  async function submitBriefingToApi(payload: MusicProducerBriefingPayload) {

    const res = await fetch("/api/music-producer/briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });



    const data = (await res.json()) as { error?: string };



    if (res.status === 401) {
      throw new Error(data.error ?? "Faça login no portal para enviar o pedido.");
    }



    if (!res.ok) {

      throw new Error(data.error ?? "Não foi possível enviar o briefing.");

    }

  }



  function finishBriefingSubmission(via: "portal" | "whatsapp", whatsAppUrl?: string) {

    setSubmittedQuote(estimate?.totalFormatted ?? selectedPlan?.price ?? null);

    setSubmittedVia(via);

    setLastWhatsAppUrl(whatsAppUrl ?? null);

    setSuccess(true);
    resetProjectFields();
  }



  const applyAiResult = useCallback((data: AiResult) => {

    const matchedPlanId = matchPlanId(data.projectType);

    if (matchedPlanId) setSelectedPlanId(matchedPlanId);

    setProjectIdea(data.idea);

    setLyrics(data.lyrics);

    setStyle(data.style);

    setOccasion(data.occasion);

    setAiGenerated(true);

    if (typeof data.used === "number" && typeof data.remaining === "number") {

      setAiLimit({

        used: data.used,

        remaining: data.remaining,

        max: data.max ?? MAX_BRIEFING_AI_GENERATIONS,

        canRegenerate: data.canRegenerate ?? data.remaining > 0,

      });

    }

  }, []);



  async function handleGenerateIdea(regenerate = false) {

    setAiLoading(true);

    setAiError(null);



    try {

      const res = await fetch("/api/music-producer/generate-idea", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          idea: ideaPrompt,

          projectType: selectedPlan?.name ?? "",

          style,

          occasion,

          regenerate,

        }),

      });



      const data = (await res.json()) as AiResult & { error?: string };



      if (!res.ok) {

        setAiError(data.error ?? "Não foi possível gerar a ideia.");

        if (typeof data.remaining === "number") {

          setAiLimit((prev) => ({

            ...prev,

            used: data.used ?? prev.used,

            remaining: data.remaining ?? 0,

            canRegenerate: (data.remaining ?? 0) > 0,

          }));

        }

        return;

      }



      applyAiResult(data);

    } catch {

      setAiError("Erro de conexão. Tente novamente.");

    } finally {

      setAiLoading(false);

    }

  }



  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();



    const payload = buildBriefingPayload();

    const validationError = validateMusicProducerBriefing(payload);



    if (validationError) {

      setError(validationError);

      return;

    }



    setLoading(true);

    setError(null);



    try {

      await submitBriefingToApi(payload);

      finishBriefingSubmission("portal");

    } catch (err) {

      setError(err instanceof Error ? err.message : "Erro de conexão. Tente novamente.");

    } finally {

      setLoading(false);

    }

  }



  async function handleWhatsAppSubmit() {
    const payload = buildBriefingPayload();
    const validationError = validateMusicProducerBriefingContact(payload);

    if (validationError) {
      setError(validationError);
      return;
    }

    const whatsAppUrl = musicProducerBriefingWhatsAppUrl(payload);

    setLoading(true);
    setError(null);

    try {
      await submitBriefingToApi(payload);
    } catch {
      /* registro no site é complementar; o envio principal é pelo WhatsApp */
    } finally {
      setLoading(false);
    }

    window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
    finishBriefingSubmission("whatsapp", whatsAppUrl);
  }



  if (success) {

    return (

      <div className="mt-10 rounded-lg bg-[#282828] p-8 text-center">

        <CheckCircle2 className="mx-auto h-10 w-10 text-[#1DB954]" />

        <h3 className="mt-4 text-xl font-bold text-white">

          {submittedVia === "whatsapp" ? "Briefing pronto no WhatsApp!" : "Briefing enviado!"}

        </h3>

        <p className="mt-2 text-sm leading-relaxed text-[#b3b3b3]">

          {submittedVia === "whatsapp" ? (

            <>

              Registramos seu pedido

              {submittedQuote ? (

                <>

                  {" "}

                  com valor estimado de <span className="font-semibold text-[#1DB954]">{submittedQuote}</span>

                </>

              ) : null}

              {" "}

              e abrimos o WhatsApp com a mensagem preenchida. Confirme o envio na conversa para concluir.

            </>

          ) : (

            <>

              Recebemos seu pedido

              {submittedQuote ? (

                <>

                  {" "}

                  com valor estimado de <span className="font-semibold text-[#1DB954]">{submittedQuote}</span>

                </>

              ) : null}

              . Nossa equipe analisará o briefing e entrará em contato em breve.

            </>

          )}

        </p>

        {submittedVia === "whatsapp" && lastWhatsAppUrl && (

          <a

            href={lastWhatsAppUrl}

            target="_blank"

            rel="noopener noreferrer"

            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-[#25D366] px-6 py-2.5 text-sm font-bold text-[#25D366] transition-all hover:bg-[#25D366]/10"

          >

            <MessageCircle className="h-4 w-4" />

            Abrir WhatsApp novamente

          </a>

        )}

        <button

          type="button"

          onClick={() => {

            setSuccess(false);

            setSubmittedQuote(null);

            setSubmittedVia(null);

            setLastWhatsAppUrl(null);

            void loadAiLimit();

          }}

          className="mt-6 text-sm font-bold text-[#1DB954] hover:underline"

        >

          Enviar outro briefing

        </button>

      </div>

    );

  }



  const canGenerateIdea = Boolean(ideaPrompt.trim() || selectedPlanId || style.trim() || occasion.trim());

  const isFirstGeneration = aiLimit.used === 0;

  const canUseAi = aiLimit.remaining > 0;

  const regenerationsLeft = Math.max(0, aiLimit.max - aiLimit.used);



  if (!portalReady) {

    return (

      <div className="mt-10 flex justify-center py-16">

        <Loader2 className="h-8 w-8 animate-spin text-[#1DB954]" />

      </div>

    );

  }



  if (!portalProfile) {

    return (

      <div className="mt-10 rounded-lg bg-[#282828] p-8 text-center">

        <LogIn className="mx-auto h-10 w-10 text-[#1DB954]" />

        <h3 className="mt-4 text-xl font-bold text-white">Crie sua conta no portal</h3>

        <p className="mt-2 text-sm leading-relaxed text-[#b3b3b3]">

          Nome, e-mail e WhatsApp são cadastrados em <strong className="text-white">/portal</strong>. Depois disso você

          pode enviar pedidos de produção com seus dados já vinculados.

        </p>

        <Link

          href="/portal?return=/musicproducer%23conte-sua-ideia"

          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#1DB954] px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:bg-[#1ed760]"

        >

          <LogIn className="h-4 w-4" />

          Ir para o portal

        </Link>

      </div>

    );

  }



  return (

    <form onSubmit={(e) => void handleSubmit(e)} className="mt-10 space-y-5 text-left">

      {portalProfile && (

        <div className="flex items-center gap-3 rounded-lg border border-[#1DB954]/25 bg-[#1DB954]/10 px-4 py-3 text-sm text-[#b3b3b3]">

          <UserCheck className="h-4 w-4 flex-shrink-0 text-[#1DB954]" />

          <p>

            Você está logado como <span className="font-semibold text-white">{portalProfile.name}</span> ({portalProfile.email} · {portalProfile.whatsapp}).

          </p>

        </div>

      )}



      <div className="rounded-2xl border border-[#1DB954]/30 bg-[#282828] p-5 sm:p-6">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1DB954]/15">

            <Sparkles className="h-5 w-5 text-[#1DB954]" />

          </div>

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="font-display text-lg tracking-wide text-white">Assistente IA</h3>

              <span className="rounded-full border border-[#4285F4]/30 bg-[#4285F4]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8ab4f8]">

                Google Gemini

              </span>

            </div>

            <p className="mt-1 text-sm text-[#b3b3b3]">

              Descreva sua ideia e o Google Gemini gera o conceito, a letra completa e o estilo. Você pode regenerar até{" "}

              {MAX_BRIEFING_AI_GENERATIONS - 1} vezes por pedido.

            </p>

          </div>

        </div>



        <div className="mt-5">

          <label htmlFor="briefing-idea" className={labelClassName}>

            Sua ideia em poucas palavras

          </label>

          <textarea

            id="briefing-idea"

            rows={3}

            value={ideaPrompt}

            onChange={(e) => {

              setIdeaPrompt(e.target.value);

              setAiGenerated(false);

            }}

            className={`${inputClassName} resize-y`}

            placeholder="Ex.: quero uma música de aniversário animada para minha mãe de 60 anos, falando da nossa história..."

          />

        </div>



        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#727272]">

          <span>

            Gerações neste pedido: {aiLimit.used}/{aiLimit.max}

          </span>

          <span>

            {canUseAi

              ? `${regenerationsLeft} ${regenerationsLeft === 1 ? "restante" : "restantes"}`

              : "Limite atingido — envie o briefing para iniciar um novo pedido"}

          </span>

        </div>



        {aiError && (

          <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{aiError}</p>

        )}



        {aiGenerated && (

          <p className="mt-4 rounded-lg bg-[#1DB954]/10 px-4 py-3 text-sm text-[#1DB954]">

            Ideia, letra e estilo gerados! Revise os campos abaixo e ajuste o que quiser antes de enviar.

          </p>

        )}



        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">

          <button

            type="button"

            disabled={aiLoading || !canGenerateIdea || !canUseAi}

            onClick={() => void handleGenerateIdea(!isFirstGeneration)}

            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#FFDF00]/40 bg-gradient-to-r from-[#009739]/20 to-[#1DB954]/20 px-6 py-3 text-sm font-bold text-white transition-all hover:from-[#009739]/30 hover:to-[#1DB954]/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"

          >

            {aiLoading ? (

              <Loader2 className="h-4 w-4 animate-spin" />

            ) : isFirstGeneration ? (

              <Wand2 className="h-4 w-4 text-[#FFDF00]" />

            ) : (

              <RefreshCw className="h-4 w-4 text-[#FFDF00]" />

            )}

            {aiLoading

              ? "Gerando..."

              : isFirstGeneration

                ? "Gerar ideia, letra e estilo"

                : `Regenerar (${regenerationsLeft} restantes)`}

          </button>

        </div>

      </div>



      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="briefing-deadline" className={labelClassName}>
            Prazo desejado *
          </label>
          <select
            id="briefing-deadline"
            required
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={selectClassName}
          >
            {MUSIC_PRODUCER_DEADLINE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {formatDeadlineOptionLabel(option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>

        <label htmlFor="briefing-plan" className={labelClassName}>

          Tipo de produção *

        </label>

        <select

          id="briefing-plan"

          required

          value={selectedPlanId}

          onChange={(e) => setSelectedPlanId(e.target.value)}

          className={selectClassName}

        >

          <option value="" disabled>

            Selecione o serviço...

          </option>

          {MUSIC_PRODUCER_PRICING_PLANS.map((plan) => (

            <option key={plan.id} value={plan.id}>

              {plan.name} — {plan.price} ({plan.period})

            </option>

          ))}

        </select>

      </div>



      {selectedPlan && estimate && (

        <div className="rounded-xl border border-[#FFDF00]/30 bg-[#282828] px-4 py-4">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FFDF00]/15">

              <Receipt className="h-5 w-5 text-[#FFDF00]" />

            </div>

            <div className="min-w-0 flex-1">

              <p className="text-xs font-bold uppercase tracking-wider text-[#FFDF00]">Valor estimado</p>

              <p className="mt-1 font-display text-2xl tracking-wide text-white">{estimate.totalFormatted}</p>

              <p className="mt-1 text-sm text-[#b3b3b3]">

                Base {estimate.baseFormatted}

                {estimate.surchargeFormatted

                  ? ` + ${estimate.surchargeFormatted} (prazo ${estimate.deadlineLabel})`

                  : ` · prazo ${estimate.deadlineLabel}`}

              </p>

              <p className="mt-1 text-xs text-[#727272]">{selectedPlan.period}</p>

              <p className="mt-2 text-xs leading-relaxed text-[#727272]">

                Prazos urgentes: + R$ 25,00 (24h e 48h) · + R$ 15,00 (3 dias). Normal e 5 dias sem acréscimo.

              </p>

            </div>

          </div>

        </div>

      )}



      <div>

        <label htmlFor="briefing-project-idea" className={labelClassName}>

          Ideia do projeto *

        </label>

        <textarea

          id="briefing-project-idea"

          required

          rows={4}

          value={projectIdea}

          onChange={(e) => setProjectIdea(e.target.value)}

          className={`${inputClassName} resize-y`}

          placeholder="Conceito criativo: tema, emoção, público e objetivo da faixa..."

        />

      </div>



      <div>

        <label htmlFor="briefing-lyrics" className={labelClassName}>

          Letra

        </label>

        <textarea

          id="briefing-lyrics"

          rows={10}

          value={lyrics}

          onChange={(e) => setLyrics(e.target.value)}

          className={`${inputClassName} resize-y font-mono text-[13px] leading-relaxed`}

          placeholder={"[Intro]\n...\n\n[Verse 1]\n...\n\n[Pre-Chorus]\n...\n\n[Chorus]\n..."}

        />

        <p className="mt-2 text-xs text-[#727272]">
          Texto da letra em português, com marcadores em inglês: Intro, Verse, Pre-Chorus, Chorus, Bridge, Outro.
        </p>

      </div>



      <div>

        <label htmlFor="briefing-style" className={labelClassName}>

          Estilo *

        </label>

        <textarea

          id="briefing-style"

          required

          rows={3}

          value={style}

          onChange={(e) => setStyle(e.target.value)}

          className={`${inputClassName} resize-y text-[13px] leading-relaxed`}

          placeholder="Brazilian pop, emotional female vocal, warm acoustic guitar, soft drums, 95 BPM, uplifting..."

        />

        <p className="mt-2 text-xs text-[#727272]">

          Style in English: genre, vocals, instruments, mood, BPM and production references.

        </p>

      </div>



      <div>

        <label htmlFor="briefing-occasion" className={labelClassName}>

          Ocasião

        </label>

        <input

          id="briefing-occasion"

          type="text"

          value={occasion}

          onChange={(e) => setOccasion(e.target.value)}

          className={inputClassName}

          placeholder="Ex.: aniversário, campanha, casamento..."

        />

      </div>



      <div>

        <label htmlFor="briefing-notes" className={labelClassName}>

          Observações adicionais

        </label>

        <textarea

          id="briefing-notes"

          rows={3}

          value={additionalNotes}

          onChange={(e) => setAdditionalNotes(e.target.value)}

          className={`${inputClassName} resize-y`}

          placeholder="Referências, links, pedidos especiais ou detalhes extras para a produção..."

        />

      </div>



      {error && (

        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>

      )}



      <div className="space-y-3">

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">

          <button

            type="submit"

            disabled={loading}

            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1DB954] px-8 py-3.5 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"

          >

            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}

            {selectedPlan && estimate

              ? `Enviar briefing · ${estimate.totalFormatted} estimado`

              : "Enviar briefing"}

          </button>



          <button

            type="button"

            disabled={loading}

            onClick={() => void handleWhatsAppSubmit()}

            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366] px-8 py-3.5 text-sm font-bold text-[#25D366] transition-all hover:bg-[#25D366]/10 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"

          >

            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}

            Enviar via WhatsApp

          </button>

        </div>



        <p className="text-xs leading-relaxed text-[#727272]">

          O pedido é registrado na área administrativa e vinculado à sua conta. Pelo WhatsApp, abrimos a conversa com{" "}

          <span className="text-[#b3b3b3]">+55 51 93505-2274</span> com a mensagem preenchida — basta confirmar o envio.

        </p>

      </div>

    </form>

  );

}


