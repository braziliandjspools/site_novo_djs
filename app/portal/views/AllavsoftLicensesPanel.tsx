"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, KeyRound, Loader2, Plus } from "lucide-react";
import { PortalCard } from "../PortalShell";
import { formatDateBr } from "../portal-types";

type LicenseItem = {
  id: string;
  licenseName: string;
  serial: string;
  issuedAt: string;
  copiedAt: string | null;
};

type LicensesPayload = {
  licenses: LicenseItem[];
  maxPerWindow: number;
  windowDays: number;
  issuedInWindow: number;
  remaining: number;
  nextSlotAt: string | null;
  error?: string;
};

export function AllavsoftLicensesPanel() {
  const [data, setData] = useState<LicensesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/portal/allavsoft/licenses", { cache: "no-store" });
    const json = (await res.json()) as LicensesPayload;
    if (!res.ok) {
      throw new Error(json.error ?? "Não foi possível carregar os seriais.");
    }
    setData(json);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar seriais.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/portal/allavsoft/licenses", { method: "POST" });
      const json = (await res.json()) as LicensesPayload & { license?: LicenseItem; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Não foi possível gerar o serial.");
      }
      setData({
        licenses: json.licenses,
        maxPerWindow: json.maxPerWindow,
        windowDays: json.windowDays,
        issuedInWindow: json.issuedInWindow,
        remaining: json.remaining,
        nextSlotAt: json.nextSlotAt,
      });
      setMessage("Serial gerado. Copie agora — após copiar, ele some da lista e não pode ser reutilizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar serial.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(license: LicenseItem) {
    setCopyingId(license.id);
    setError(null);
    setMessage(null);
    try {
      await navigator.clipboard.writeText(license.serial);
      const res = await fetch(`/api/portal/allavsoft/licenses/${license.id}/copy`, {
        method: "POST",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Não foi possível confirmar a cópia.");
      }
      setCopiedId(license.id);
      setMessage("Serial copiado. Ele foi consumido e removido da lista.");
      await refresh();
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao copiar serial.");
    } finally {
      setCopyingId(null);
    }
  }

  function maskSerial(serial: string) {
    if (serial.length <= 8) return "••••••••";
    return `${serial.slice(0, 4)}-••••-••••-••••-••••-••••-••••-${serial.slice(-4)}`;
  }

  return (
    <PortalCard title="Seriais Allavsoft">
      <div className="mb-4 flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#FFDF00]" />
        <div className="space-y-2 text-sm text-zinc-400">
          <p>
            Cada serial é de <span className="text-zinc-200">uso único</span>: ao copiar, ele é consumido
            permanentemente e some desta lista.
          </p>
          <p>
            Você pode gerar até <span className="text-zinc-200">2 seriais a cada 30 dias</span>. No Allavsoft,
            use o nome de licença gerado junto com o serial.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando seriais…
        </div>
      ) : (
        <>
          {data && (
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span>
                Gerados na janela:{" "}
                <span className="font-semibold text-zinc-300">
                  {data.issuedInWindow}/{data.maxPerWindow}
                </span>
              </span>
              <span>
                Restantes:{" "}
                <span className="font-semibold text-zinc-300">{data.remaining}</span>
              </span>
              {data.remaining === 0 && data.nextSlotAt && (
                <span>
                  Próxima vaga em {formatDateBr(data.nextSlotAt)}
                </span>
              )}
            </div>
          )}

          {error && (
            <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p className="mb-3 rounded-lg border border-[#00ff9d]/25 bg-[#00ff9d]/10 px-3 py-2 text-sm text-[#00ff9d]">
              {message}
            </p>
          )}

          {data && data.licenses.length === 0 ? (
            <p className="mb-4 text-sm text-zinc-500">
              Nenhum serial ativo. Gere um novo para ativar no Allavsoft.
            </p>
          ) : (
            <ul className="mb-4 space-y-3">
              {data?.licenses.map((license) => {
                const show = revealed[license.id];
                return (
                  <li
                    key={license.id}
                    className="rounded-lg border border-zinc-800 bg-[#0a0a0a] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                          Nome da licença
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-medium text-white">
                          {license.licenseName}
                        </p>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Gerado em {formatDateBr(license.issuedAt)}
                      </p>
                    </div>
                    <div className="mt-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                        Serial
                      </p>
                      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <code className="min-w-0 flex-1 truncate font-mono text-sm text-[#FFDF00]">
                          {show ? license.serial : maskSerial(license.serial)}
                        </code>
                        <div className="flex flex-shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setRevealed((prev) => ({
                                ...prev,
                                [license.id]: !prev[license.id],
                              }))
                            }
                            className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-500 hover:text-white"
                          >
                            {show ? "Ocultar" : "Revelar"}
                          </button>
                          <button
                            type="button"
                            disabled={copyingId === license.id}
                            onClick={() => void handleCopy(license)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFDF00]/40 bg-[#FFDF00]/15 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FFDF00] hover:bg-[#FFDF00]/25 disabled:opacity-50"
                          >
                            {copyingId === license.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : copiedId === license.id ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            {copiedId === license.id ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            disabled={generating || !data || data.remaining <= 0}
            onClick={() => void handleGenerate()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#00e68a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Gerar serial
          </button>
          {data && data.remaining <= 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              Limite da janela de {data.windowDays} dias atingido.
              {data.nextSlotAt ? ` Nova geração a partir de ${formatDateBr(data.nextSlotAt)}.` : null}
            </p>
          )}
        </>
      )}
    </PortalCard>
  );
}
