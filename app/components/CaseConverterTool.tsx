"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  CaseLower,
  CaseSensitive,
  CaseUpper,
  Check,
  Copy,
  Eraser,
  Highlighter,
  Type,
} from "lucide-react";

const DEFAULT_IGNORE =
  "a, o, as, os, de, dos, das, do, da, e, ou, para, por, no, na, nos, nas";

function capitalizeToken(token: string) {
  const match = token.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}])(.*)$/u);
  if (!match) return token;
  return `${match[1]}${match[2].toLocaleUpperCase("pt-BR")}${match[3].toLocaleLowerCase("pt-BR")}`;
}

function wordCore(token: string) {
  return token
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    .toLocaleLowerCase("pt-BR");
}

function parseIgnoreList(raw: string) {
  return raw
    .split(",")
    .map((part) => part.trim().toLocaleLowerCase("pt-BR"))
    .filter(Boolean);
}

function toUpper(text: string) {
  return text.toLocaleUpperCase("pt-BR");
}

function toLower(text: string) {
  return text.toLocaleLowerCase("pt-BR");
}

function toAlternating(text: string) {
  let upper = true;
  return Array.from(text)
    .map((char) => {
      if (!/\p{L}/u.test(char)) return char;
      const next = upper ? char.toLocaleUpperCase("pt-BR") : char.toLocaleLowerCase("pt-BR");
      upper = !upper;
      return next;
    })
    .join("");
}

function reverseText(text: string) {
  return Array.from(text).reverse().join("");
}

function toTitleCase(text: string, minLetters: number, ignoreRaw: string) {
  const ignore = new Set(parseIgnoreList(ignoreRaw));
  let seenWord = false;
  return text
    .split(/(\s+)/u)
    .map((part) => {
      if (/^\s+$/u.test(part) || part.length === 0) return part;
      const core = wordCore(part);
      const isFirst = !seenWord;
      if (core) seenWord = true;
      if (!core) return part;
      if (!isFirst && (core.length < minLetters || ignore.has(core))) {
        return part.replace(/\p{L}/gu, (letter) => letter.toLocaleLowerCase("pt-BR"));
      }
      return capitalizeToken(part);
    })
    .join("");
}

function toSentenceCase(text: string) {
  const lower = text.toLocaleLowerCase("pt-BR");
  return lower.replace(/(^|[.!?…]\s+)(\p{L})/gu, (_, prefix: string, letter: string) => {
    return `${prefix}${letter.toLocaleUpperCase("pt-BR")}`;
  });
}

type ActionId =
  | "upper"
  | "lower"
  | "alt"
  | "reverse"
  | "title"
  | "sentence"
  | "select";

const ACTIONS: {
  id: ActionId;
  label: string;
  hint: string;
  icon: typeof CaseUpper;
}[] = [
  { id: "upper", label: "MAIÚSCULO", hint: "Tudo em caixa alta", icon: CaseUpper },
  { id: "lower", label: "minúsculo", hint: "Tudo em caixa baixa", icon: CaseLower },
  { id: "alt", label: "ALtErNaTiVo", hint: "Letras alternadas", icon: CaseSensitive },
  { id: "reverse", label: "Inverter texto", hint: "Espelha a frase", icon: ArrowLeftRight },
  { id: "title", label: "Primeira Letra Palavra", hint: "Title case", icon: Type },
  { id: "sentence", label: "Primeira Palavra Frase", hint: "Início de frase", icon: Type },
  { id: "select", label: "Selecionar texto", hint: "Seleciona tudo na caixa", icon: Highlighter },
];

export function CaseConverterTool() {
  const [text, setText] = useState("");
  const [minLetters, setMinLetters] = useState(3);
  const [ignoreWords, setIgnoreWords] = useState(DEFAULT_IGNORE);
  const [copied, setCopied] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionId | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = text.length;
  const wordCount = useMemo(() => {
    const parts = text.trim().match(/\S+/g);
    return parts?.length ?? 0;
  }, [text]);

  function apply(id: ActionId) {
    setActiveAction(id);
    if (id === "select") {
      areaRef.current?.focus();
      areaRef.current?.select();
      return;
    }
    const source = text;
    const next =
      id === "upper"
        ? toUpper(source)
        : id === "lower"
          ? toLower(source)
          : id === "alt"
            ? toAlternating(source)
            : id === "reverse"
              ? reverseText(source)
              : id === "title"
                ? toTitleCase(source, minLetters, ignoreWords)
                : toSentenceCase(source);
    setText(next);
  }

  async function copyResult() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      areaRef.current?.select();
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="br-stripe-thin" />
        <div className="border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ed760]">Ferramenta</p>
              <h2 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
                Caixa de texto
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Digite a frase e clique nas opções abaixo para converter.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 tabular-nums">
                {charCount} caractere{charCount === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 tabular-nums">
                {wordCount} palavra{wordCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <label className="sr-only" htmlFor="case-converter-input">
            Texto para converter
          </label>
          <textarea
            id="case-converter-input"
            ref={areaRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Digite ou cole sua frase aqui…"
            rows={10}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-base leading-relaxed text-white outline-none transition placeholder:text-zinc-600 focus:border-[#1ed760]/50 focus:ring-2 focus:ring-[#1ed760]/20"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyResult()}
              disabled={!text}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#1ed760]/40 hover:text-[#1ed760] disabled:opacity-40"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button
              type="button"
              onClick={() => setText("")}
              disabled={!text}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-white/30 hover:text-white disabled:opacity-40"
            >
              <Eraser className="h-4 w-4" />
              Limpar
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ed760]">Opções de gerador</p>
        <h3 className="mt-1 text-lg font-bold text-white">Converter com um clique</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map(({ id, label, hint, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => apply(id)}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                activeAction === id
                  ? "border-[#1ed760]/50 bg-[#1ed760]/10"
                  : "border-white/10 bg-black/30 hover:border-white/25 hover:bg-white/[0.04]"
              }`}
            >
              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1ed760]/15 text-[#1ed760]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white">{label}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ed760]">
          Opções · Primeira Letra Palavra
        </p>
        <h3 className="mt-1 text-lg font-bold text-white">Regras de title case</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Usadas apenas no botão <span className="text-zinc-200">Primeira Letra Palavra</span>.
        </p>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="min-letters" className="text-sm font-semibold text-white">
              1. Ignorar palavras menores que{" "}
              <span className="tabular-nums text-[#1ed760]">{minLetters}</span> letra(s)
            </label>
            <div className="mt-3 flex items-center gap-4">
              <input
                id="min-letters"
                type="range"
                min={1}
                max={8}
                value={minLetters}
                onChange={(event) => setMinLetters(Number(event.target.value))}
                className="h-2 w-full accent-[#1ed760]"
              />
              <input
                type="number"
                min={1}
                max={20}
                value={minLetters}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (!Number.isFinite(value)) return;
                  setMinLetters(Math.max(1, Math.min(20, Math.round(value))));
                }}
                className="w-16 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-center text-sm font-bold tabular-nums text-white outline-none focus:border-[#1ed760]/50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ignore-words" className="text-sm font-semibold text-white">
              2. Ignorar as palavras
            </label>
            <p className="mt-1 text-xs text-zinc-500">Separadas por vírgula · editável</p>
            <textarea
              id="ignore-words"
              value={ignoreWords}
              onChange={(event) => setIgnoreWords(event.target.value)}
              rows={3}
              className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm leading-relaxed text-zinc-200 outline-none focus:border-[#1ed760]/50 focus:ring-2 focus:ring-[#1ed760]/15"
            />
            <button
              type="button"
              onClick={() => setIgnoreWords(DEFAULT_IGNORE)}
              className="mt-2 text-xs font-semibold text-[#1ed760] hover:underline"
            >
              Restaurar lista padrão
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
