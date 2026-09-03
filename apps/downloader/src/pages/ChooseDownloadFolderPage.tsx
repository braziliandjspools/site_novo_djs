import { useEffect, useState } from "react";
import { CheckCircle2, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useDownloadManager } from "../context/DownloadManagerContext";
import {
  getDefaultDownloadDir,
  getDownloadDir,
  hasDownloadDirConfigured,
  pickDownloadDir,
  setDownloadDir,
} from "../lib/native/download";

type ChooseDownloadFolderPageProps = {
  onConfigured: () => void;
};

export function ChooseDownloadFolderPage({ onConfigured }: ChooseDownloadFolderPageProps) {
  const { syncNow } = useDownloadManager();
  const [suggestedPath, setSuggestedPath] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [suggested, configured] = await Promise.all([
          getDefaultDownloadDir(),
          hasDownloadDirConfigured(),
        ]);
        setSuggestedPath(suggested);
        if (configured) {
          const current = await getDownloadDir();
          setSelectedPath(current);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function finalizeFolder(path: string) {
    setSubmitting(true);
    setError(null);
    try {
      const saved = await getDownloadDir();
      setSelectedPath(saved || path);
      syncNow();
      onConfigured();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível confirmar a pasta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePickFolder() {
    setSubmitting(true);
    setError(null);
    try {
      const picked = await pickDownloadDir();
      if (!picked) return;
      setSelectedPath(picked);
      await finalizeFolder(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível selecionar a pasta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUseSuggested() {
    if (!suggestedPath) return;
    setSubmitting(true);
    setError(null);
    try {
      const saved = await setDownloadDir(suggestedPath);
      setSelectedPath(saved);
      await finalizeFolder(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível usar a pasta sugerida.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1db954]/10 text-[#1db954]">
        <FolderOpen className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <h1 className="max-w-md text-2xl font-bold text-white">Escolha onde suas músicas serão salvas</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
        Exemplo: <span className="text-zinc-300">D:\Brazilian Remix Service</span>
      </p>

      {loading ? (
        <p className="mt-6 text-xs text-zinc-600">Carregando sugestão…</p>
      ) : (
        <div className="mt-6 w-full max-w-lg rounded-xl border border-zinc-800 bg-[#181818]/80 p-4 text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Pasta sugerida</p>
          <p className="mt-2 break-all text-sm text-zinc-300">{suggestedPath}</p>
          {selectedPath && (
            <>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1db954]">
                Pasta selecionada
              </p>
              <p className="mt-2 flex items-start gap-2 break-all text-sm text-white">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1db954]" />
                {selectedPath}
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 max-w-lg rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      <div className="mt-8 flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:justify-center">
        <Button disabled={submitting || !suggestedPath} onClick={() => void handleUseSuggested()}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
          Usar pasta sugerida
        </Button>
        <Button variant="secondary" disabled={submitting} onClick={() => void handlePickFolder()}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
          Escolher outra pasta
        </Button>
      </div>
    </div>
  );
}
