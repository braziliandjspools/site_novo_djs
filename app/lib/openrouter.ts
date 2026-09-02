const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type BriefingIdeaInput = {
  idea?: string;
  projectType?: string;
  style?: string;
  occasion?: string;
  regenerate?: boolean;
};

export type BriefingIdeaResult = {
  projectType: string;
  idea: string;
  lyrics: string;
  style: string;
  occasion: string;
};

const SYSTEM_PROMPT = `Você é um assistente criativo da BRS — Brazilian Remix Service, especializado em produção musical personalizada no Brasil.

Com base no que o cliente descrever, crie um conceito musical completo pronto para orientar a produção.

Responda SOMENTE com JSON válido, sem markdown, neste formato exato:
{
  "projectType": "tipo de produção sugerido (ex.: Música produzida, Jingle e vinheta, Intro / drop para DJ...)",
  "idea": "resumo criativo da ideia em 2 a 4 frases: tema, emoção, público e objetivo da faixa",
  "lyrics": "letra completa com texto em português do Brasil, mas TODOS os marcadores de estrutura OBRIGATORIAMENTE em inglês: [Intro], [Verse 1], [Verse 2], [Pre-Chorus], [Chorus], [Bridge], [Outro], [Hook], [Drop] quando fizer sentido. Nunca use Verso, Refrão, Ponte ou Pré-refrão em português nos marcadores.",
  "style": "written musical style description in English: genre, mood, vocals, instrumentation, approximate BPM, production and atmosphere. Ex.: Brazilian pop, emotional female vocal, warm acoustic guitar, soft drums, 95 BPM, uplifting, radio-ready production",
  "occasion": "ocasião ou contexto de uso"
}

Regras:
- Escreva idea e occasion em português do Brasil.
- O campo style deve ser SEMPRE em inglês, conciso (1 a 3 linhas), descritivo e útil para a equipe de produção.
- O texto cantado dentro de lyrics deve ser em português do Brasil.
- Os marcadores de seção em lyrics devem ser SEMPRE em inglês: [Intro], [Verse], [Pre-Chorus], [Chorus], [Bridge], [Outro], etc.
- A letra deve ser original, específica ao pedido e pronta para revisão humana.
- Se o cliente pedir regeneração ou já houver conteúdo, crie uma variação diferente mantendo o briefing.
- Tipos comuns de projectType: Intro / drop para DJ, Jingle e vinheta, Música produzida, Remix personalizado, Letra exclusiva + produção, Distribuição digital.`;

function buildUserPrompt(input: BriefingIdeaInput) {
  const parts: string[] = [];

  if (input.regenerate) {
    parts.push(
      "O cliente pediu uma NOVA versão. Gere uma variação criativa diferente da anterior (nova abordagem na letra, clima ou estilo), mantendo o briefing.",
    );
  }

  if (input.idea?.trim()) {
    parts.push(`Ideia do cliente: ${input.idea.trim()}`);
  }
  if (input.projectType?.trim()) {
    parts.push(`Tipo de produção informado: ${input.projectType.trim()}`);
  }
  if (input.style?.trim()) {
    parts.push(`Estilo / referências informados: ${input.style.trim()}`);
  }
  if (input.occasion?.trim()) {
    parts.push(`Ocasião informada: ${input.occasion.trim()}`);
  }

  if (parts.length === 0) {
    return "O cliente ainda não deu detalhes. Sugira uma ideia criativa para uma música personalizada de homenagem de aniversário, com letra completa e estilo descrito por escrito.";
  }

  return parts.join("\n");
}

function extractJson(raw: string): BriefingIdeaResult {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Resposta da IA sem JSON válido.");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<BriefingIdeaResult & { message?: string; sunoStyle?: string }>;

  const projectType = parsed.projectType?.trim();
  const idea = parsed.idea?.trim() || parsed.message?.trim();
  const lyrics = parsed.lyrics?.trim();
  const style = parsed.style?.trim() || parsed.sunoStyle?.trim();
  const occasion = parsed.occasion?.trim();

  if (!projectType || !idea || !lyrics || !style || !occasion) {
    throw new Error("Resposta da IA incompleta.");
  }

  return { projectType, idea, lyrics, style, occasion };
}

export async function generateBriefingIdea(input: BriefingIdeaInput): Promise<BriefingIdeaResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL ?? "google/gemini-3.7-flash";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY não configurada.");
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://brazilianpacks.com.br",
      "X-Title": "Brazilian Packs Music Producer",
    },
    body: JSON.stringify({
      model,
      temperature: input.regenerate ? 0.95 : 0.85,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("OpenRouter error:", res.status, errText);
    throw new Error("Não foi possível gerar a ideia. Tente novamente.");
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta vazia da IA.");
  }

  return extractJson(content);
}
