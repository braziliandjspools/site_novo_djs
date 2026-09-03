import { useState } from "react";
import { CheckCircle2, Link2, Loader2, Download } from "lucide-react";
import { Button } from "./ui/Button";
import { Panel } from "./ui/Panel";
import { useAuth } from "../context/AuthContext";
import { useDownloadManager } from "../context/DownloadManagerContext";
import { importPackLink, parsePackLinkInput, previewPackLink, type PackPreview } from "../lib/api/pack-import";
import { formatApiError } from "../lib/errors";

export function ImportPackPanel() {
  const { sessionToken } = useAuth();
  const { syncNow } = useDownloadManager();
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<PackPreview | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleValidate() {
    if (!sessionToken) {
      setError("Faça login para validar o link.");
      return;
    }
    const parsed = parsePackLinkInput(url);
    if (!parsed) {
      setError("Cole um link válido do site (ex.: …/musicas/dl/julho-2024/semana-01/funk).");
      setPreview(null);
      return;
    }

    setValidating(true);
    setError(null);
    setSuccess(null);
    setPreview(null);
    try {
      const result = await previewPackLink(sessionToken, url);
      setPreview(result);
      if (result.trackCount === 0) {
        setError("Pasta encontrada, mas sem faixas para baixar.");
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setValidating(false);
    }
  }

  async function handleImport() {
    if (!sessionToken || !preview) return;
    setImporting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await importPackLink(sessionToken, preview.slug);
      setSuccess(
        result.count === 1
          ? "1 faixa adicionada à fila."
          : `${result.count} faixas adicionadas à fila.`,
      );
      syncNow();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <Panel
      title="Importar link do site"
      description="Cole o link do mês, semana ou estilo copiado no acervo VIP. O app valida e enfileira todas as faixas mantendo a estrutura de pastas."
    >
      <div className="space-y-3">
        <label htmlFor="pack-link" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
          Link da pasta
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              id="pack-link"
              type="url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setPreview(null);
                setSuccess(null);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleValidate();
                }
              }}
              placeholder="https://…/musicas/dl/julho-2024  (mês inteiro) ou …/semana-01/funk"
              className="w-full rounded-lg border border-zinc-800 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#1db954]"
            />
          </div>
          <Button
            variant="secondary"
            disabled={validating || !url.trim()}
            onClick={() => void handleValidate()}
            className="flex-shrink-0"
          >
            {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Validar
          </Button>
        </div>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
        {success && (
          <p className="flex items-center gap-2 rounded-lg bg-[#1db954]/10 px-3 py-2 text-xs text-[#1db954]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {success}
          </p>
        )}

        {preview && (
          <div className="rounded-xl border border-white/[0.06] bg-[#141414] px-4 py-3">
            <p className="text-sm font-bold text-white">{preview.folderName}</p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{preview.relativePath}</p>
            <p className="mt-3 text-lg font-black tabular-nums text-[#1db954]">
              {preview.trackCount}{" "}
              <span className="text-sm font-semibold text-zinc-400">
                {preview.trackCount === 1 ? "faixa" : "faixas"}
              </span>
            </p>
            {preview.sampleTitles.length > 0 && (
              <ul className="mt-2 space-y-1 text-[11px] text-zinc-500">
                {preview.sampleTitles.map((title) => (
                  <li key={title} className="truncate">
                    · {title}
                  </li>
                ))}
                {preview.trackCount > preview.sampleTitles.length && (
                  <li className="text-zinc-600">
                    · e mais {preview.trackCount - preview.sampleTitles.length}…
                  </li>
                )}
              </ul>
            )}
            <Button
              className="mt-4 w-full"
              disabled={importing || preview.trackCount === 0}
              onClick={() => void handleImport()}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Baixar todas
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}
