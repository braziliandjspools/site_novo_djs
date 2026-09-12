"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Megaphone,
} from "lucide-react";
import { PortalCard } from "../PortalShell";
import { formatDateBr } from "../portal-types";

type LicenseItem = {
  id: string;
  licenseName: string;
  serial: string;
  issuedAt: string;
  copiedAt: string | null;
  consumed: boolean;
  licenseNameRegenCount: number;
  licenseNameRegenRemaining: number;
  supportNotifiedAt: string | null;
};

type LicensesPayload = {
  licenses: LicenseItem[];
  maxPerWindow: number;
  windowDays: number;
  issuedInWindow: number;
  remaining: number;
  nextSlotAt: string | null;
  maxLicenseNameRegens: number;
  canNotifySupport: boolean;
  supportAlreadyNotified: boolean;
  error?: string;
};

export function AllavsoftLicensesPanel() {
  const [data, setData] = useState<LicensesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copyingSerialId, setCopyingSerialId] = useState<string | null>(null);
  const [copiedSerialId, setCopiedSerialId] = useState<string | null>(null);
  const [copiedNameId, setCopiedNameId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
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
      const json = (await res.json()) as LicensesPayload & {
        license?: LicenseItem;
        error?: string;
      };
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
        maxLicenseNameRegens: json.maxLicenseNameRegens,
        canNotifySupport: json.canNotifySupport,
        supportAlreadyNotified: json.supportAlreadyNotified,
      });
      setMessage(
        "Serial gerado. Copie o nome e o serial. Ao copiar o serial, ele é consumido e fica desativado nesta lista.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar serial.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopyName(license: LicenseItem) {
    setError(null);
    setMessage(null);
    try {
      await navigator.clipboard.writeText(license.licenseName);
      setCopiedNameId(license.id);
      setMessage("Nome da licença copiado.");
      setTimeout(() => setCopiedNameId(null), 2000);
    } catch {
      setError("Não foi possível copiar o nome.");
    }
  }

  async function handleCopySerial(license: LicenseItem) {
    if (license.consumed) return;
    setCopyingSerialId(license.id);
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
      setCopiedSerialId(license.id);
      setMessage("Serial copiado e consumido. Ele permanece visível, desativado.");
      await refresh();
      setTimeout(() => setCopiedSerialId(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao copiar serial.");
    } finally {
      setCopyingSerialId(null);
    }
  }

  async function handleRename(license: LicenseItem) {
    if (license.licenseNameRegenRemaining <= 0) return;
    setRenamingId(license.id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/portal/allavsoft/licenses/${license.id}/rename`, {
        method: "POST",
      });
      const json = (await res.json()) as { license?: LicenseItem; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Não foi possível regenerar o nome.");
      }
      if (json.license) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                licenses: prev.licenses.map((l) =>
                  l.id === json.license!.id ? { ...l, ...json.license! } : l,
                ),
              }
            : prev,
        );
      } else {
        await refresh();
      }
      setMessage("Novo nome de licença gerado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao regenerar nome.");
    } finally {
      setRenamingId(null);
    }
  }

  async function handleNotifySupport() {
    if (
      !window.confirm(
        "Enviar aviso ao admin informando que nenhum dos seriais ativou? Seu nome, e-mail e WhatsApp serão enviados.",
      )
    ) {
      return;
    }
    setNotifying(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/portal/allavsoft/licenses/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as LicensesPayload & { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Não foi possível avisar o admin.");
      }
      setData({
        licenses: json.licenses,
        maxPerWindow: json.maxPerWindow,
        windowDays: json.windowDays,
        issuedInWindow: json.issuedInWindow,
        remaining: json.remaining,
        nextSlotAt: json.nextSlotAt,
        maxLicenseNameRegens: json.maxLicenseNameRegens,
        canNotifySupport: json.canNotifySupport,
        supportAlreadyNotified: json.supportAlreadyNotified,
      });
      setMessage("Aviso enviado ao admin. Em breve entraremos em contato.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao avisar o admin.");
    } finally {
      setNotifying(false);
    }
  }

  function maskSerial(serial: string) {
    if (serial.length <= 8) return "••••••••";
    return `${serial.slice(0, 4)}-••••-••••-••••-••••-••••-••••-${serial.slice(-4)}`;
  }

  const maxNameRegens = data?.maxLicenseNameRegens ?? 5;

  return (
    <PortalCard title="Seriais Allavsoft">
      <div className="mb-4 flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#FFDF00]" />
        <div className="space-y-2 text-sm text-zinc-400">
          <p>
            Cada serial é de <span className="text-zinc-200">uso único</span>: ao copiar, ele é
            consumido e fica desativado nesta lista (sempre visível).
          </p>
          <p>
            Você pode gerar até <span className="text-zinc-200">2 seriais a cada 30 dias</span>. O
            nome <span className="text-zinc-200">User_XXXXXX</span> pode ser regenerado até{" "}
            <span className="text-zinc-200">{maxNameRegens} vezes</span> por serial.
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
                <span>Próxima vaga em {formatDateBr(data.nextSlotAt)}</span>
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
              Nenhum serial ainda. Gere um novo para ativar no Allavsoft.
            </p>
          ) : (
            <ul className="mb-4 space-y-3">
              {data?.licenses.map((license) => {
                const show = revealed[license.id];
                const consumed = license.consumed;
                return (
                  <li
                    key={license.id}
                    className={`rounded-lg border px-4 py-3 ${
                      consumed
                        ? "border-zinc-800/80 bg-[#080808] opacity-70"
                        : "border-zinc-800 bg-[#0a0a0a]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                          Nome da licença
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="font-mono text-sm font-medium text-white">
                            {license.licenseName}
                          </p>
                          <button
                            type="button"
                            onClick={() => void handleCopyName(license)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-500 hover:text-white"
                          >
                            {copiedNameId === license.id ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {copiedNameId === license.id ? "Copiado" : "Copiar"}
                          </button>
                          <button
                            type="button"
                            disabled={
                              renamingId === license.id ||
                              license.licenseNameRegenRemaining <= 0
                            }
                            onClick={() => void handleRename(license)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            title={`Regenerações restantes: ${license.licenseNameRegenRemaining}`}
                          >
                            {renamingId === license.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Novo nome ({license.licenseNameRegenRemaining}/{maxNameRegens})
                          </button>
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-zinc-500">
                        <p>Gerado em {formatDateBr(license.issuedAt)}</p>
                        {consumed && license.copiedAt && (
                          <p className="mt-0.5 text-zinc-600">
                            Consumido em {formatDateBr(license.copiedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                          Serial
                        </p>
                        {consumed && (
                          <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                            Consumido
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          readOnly
                          disabled={consumed}
                          value={
                            consumed || show ? license.serial : maskSerial(license.serial)
                          }
                          className="min-w-0 flex-1 truncate rounded-lg border border-zinc-800 bg-[#050505] px-3 py-2 font-mono text-sm text-[#FFDF00] disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <div className="flex flex-shrink-0 gap-2">
                          {!consumed && (
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
                          )}
                          <button
                            type="button"
                            disabled={consumed || copyingSerialId === license.id}
                            onClick={() => void handleCopySerial(license)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFDF00]/40 bg-[#FFDF00]/15 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FFDF00] hover:bg-[#FFDF00]/25 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {copyingSerialId === license.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : copiedSerialId === license.id || consumed ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            {consumed
                              ? "Consumido"
                              : copiedSerialId === license.id
                                ? "Copiado"
                                : "Copiar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-3">
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

            {data && (data.canNotifySupport || data.supportAlreadyNotified) && (
              <button
                type="button"
                disabled={notifying || !data.canNotifySupport}
                onClick={() => void handleNotifySupport()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {notifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Megaphone className="h-4 w-4" />
                )}
                {data.supportAlreadyNotified
                  ? "Admin já avisado"
                  : "Avisar admin (serial não ativou)"}
              </button>
            )}
          </div>

          {data && data.remaining <= 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              Limite da janela de {data.windowDays} dias atingido.
              {data.nextSlotAt
                ? ` Nova geração a partir de ${formatDateBr(data.nextSlotAt)}.`
                : null}
            </p>
          )}
          {data?.canNotifySupport && (
            <p className="mt-2 text-xs text-zinc-500">
              Se nenhum dos seriais ativar no Allavsoft, avise o admin — enviaremos seu nome,
              e-mail e WhatsApp.
            </p>
          )}
        </>
      )}
    </PortalCard>
  );
}
