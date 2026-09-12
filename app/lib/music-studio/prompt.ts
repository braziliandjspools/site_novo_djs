export type MusicPromptInput = {
  title: string;
  style?: string | null;
  mood?: string | null;
  voice?: string | null;
  language?: string | null;
  bpm?: number | null;
  instrumental?: boolean;
  prompt?: string | null;
  lyrics?: string | null;
};

/** Monta a instrução enviada ao modelo de áudio (sem secrets). */
export function buildMusicPrompt(input: MusicPromptInput): string {
  const title = input.title.trim();
  const lines: string[] = [
    `Create a complete, radio-ready song titled "${title}".`,
    "Return full musical audio with coherent structure (intro, verses, choruses, bridge/outro when fitting).",
  ];

  if (input.style?.trim()) {
    lines.push(`Style / genre: ${input.style.trim()}.`);
  }
  if (input.mood?.trim()) {
    lines.push(`Mood / atmosphere: ${input.mood.trim()}.`);
  }
  if (input.voice?.trim()) {
    lines.push(`Vocal direction: ${input.voice.trim()}.`);
  }
  if (input.bpm && Number.isFinite(input.bpm)) {
    lines.push(`Target tempo around ${Math.round(input.bpm)} BPM.`);
  }

  const language = (input.language?.trim() || "pt-BR").toLowerCase();
  if (input.instrumental) {
    lines.push("Make it instrumental only — no sung vocals.");
  } else if (language.startsWith("pt")) {
    lines.push("Vocals and lyrics should be in Brazilian Portuguese when singing.");
  } else {
    lines.push(`Vocals and lyrics language: ${input.language!.trim()}.`);
  }

  if (input.prompt?.trim()) {
    lines.push(`Creative direction: ${input.prompt.trim()}.`);
  }
  if (input.lyrics?.trim()) {
    lines.push(`Prefer these lyrics / structure:\n${input.lyrics.trim()}`);
  }

  lines.push("Also include a text transcript of the lyrics when vocals are present.");
  return lines.join("\n");
}
