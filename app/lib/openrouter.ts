const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MUSIC_PRODUCER_BRIEFING_MODEL = "liquid/lfm-2.5-2.6b:free";

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

const SYSTEM_PROMPT = `Você é o assistente criativo da BRS — Brazilian Remix Service, especializado em composições e produção musical personalizada.

Use principalmente a ideia escrita pelo cliente em "Sua ideia em poucas palavras". Quando houver um briefing detalhado, siga fielmente seus gêneros, referências, idioma, clima, andamento e instruções; não substitua por um estilo padrão. Transforme a descrição em um direcionamento musical específico e uma letra original completa, prontos para a equipe de produção.

Responda SOMENTE com JSON válido, sem markdown, neste formato exato:
{
  "projectType": "tipo de produção sugerido (ex.: Música produzida, Jingle e vinheta, Intro / drop para DJ...)",
  "idea": "resumo criativo da ideia em 2 a 4 frases: tema, emoção, público e objetivo da faixa",
  "lyrics": "letra completa no idioma explicitamente pedido pelo cliente; se nenhum idioma for indicado, use inglês. Só escreva em português se o cliente pedir português. Organize com nomes de seção entre colchetes, como [Intro], [Verse 1], [Pre-Chorus], [Drop], [Chorus], [Bridge] e [Outro], respeitando o idioma solicitado quando aplicável.",
  "style": "direcionamento musical pronto para produção, no idioma explicitamente indicado pelo cliente ou em inglês se não houver indicação, refletindo gênero, referências, clima, voz, ritmo, instrumentos, BPM quando aplicável e atmosfera",
  "occasion": "ocasião ou contexto de uso"
}

Regras:
- Escreva idea e occasion em português do Brasil.
- O campo style deve ser conciso (1 a 3 linhas), pronto para orientar a produção e diretamente relacionado ao que o cliente descreveu. Use o idioma pedido; se não houver indicação, escreva em inglês. Preserve gêneros e referências específicas e não acrescente estilos incompatíveis.
- Escreva a letra no idioma que o cliente solicitar. Se não especificar idioma, escreva em inglês. Só use português quando o cliente pedir explicitamente português; não deduza o idioma da letra apenas pelo idioma em que a ideia foi digitada.
- Respeite instruções detalhadas de estilo, idioma vocal, gênero, estrutura, andamento e produção, mesmo quando forem diferentes dos exemplos deste prompt. Se houver um prompt rico, trate seus detalhes como requisitos e não como sugestões.
- Use nomes de seção entre colchetes, como [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Bridge], [Outro], [Hook] e [Drop]. Se o cliente pedir os marcadores em outro idioma, siga o pedido; caso contrário, use os nomes em inglês. Nunca deixe nomes de seção fora de colchetes.
- A letra deve ter estrutura e desenvolvimento completos, com versos, refrão marcante e outras seções adequadas ao tipo de projeto. Adapte o tamanho: uma vinheta ou intro deve ser curta; uma música completa deve ter desenvolvimento suficiente para uma produção integral.
- TODA orientação que não seja texto cantado deve ficar em uma linha própria dentro de colchetes: instruções de arranjo, voz, instrumentos, efeitos, dinâmica, variações, builds, drops, transições e finalização. Nunca deixe comandos ou descrições de performance fora de [ ].
- Dentro de lyrics, deixe sem colchetes somente as palavras que devem ser cantadas. Não coloque explicações antes ou depois da letra.
- Exemplo de orientação válida: [Clear upbeat female pop vocal]; [EDM riser, fast claps, pitch building up]; [Massive festival progressive house drop, euphoric lead synth and driving bass]. Crie os elementos de acordo com o briefing, sem copiar esse exemplo literalmente.
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
    return "O cliente ainda não deu detalhes. Crie uma proposta original de música personalizada em inglês, mantendo todas as instruções não cantadas entre colchetes.";
  }

  return parts.join("\n");
}

function extractJson(raw: string): BriefingIdeaResult {
  const trimmed = raw
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = trimmed.indexOf("{");
  if (start < 0) {
    throw new Error("Resposta da IA sem JSON válido.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let json = "";

  for (let index = start; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    json += char;

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) break;
    }
  }

  if (depth !== 0) throw new Error("Resposta da IA sem JSON válido.");

  const parsed = JSON.parse(json) as Partial<BriefingIdeaResult & { message?: string; sunoStyle?: string }>;

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

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY não configurada.");
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brazilianremixservice.com.br",
      "X-Title": "Brazilian Remix Service Music Producer",
    },
    body: JSON.stringify({
      model: MUSIC_PRODUCER_BRIEFING_MODEL,
      temperature: input.regenerate ? 0.9 : 0.75,
      max_tokens: 2200,
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
