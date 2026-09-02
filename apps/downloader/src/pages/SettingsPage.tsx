import { useEffect, useState } from "react";
import { ExternalLink, FolderOpen, LogOut, User } from "lucide-react";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { BP_MUSICAS_URL } from "../lib/site";
import { openBrazilianPacks } from "../lib/open-site";
import { getDownloadDir, pickDownloadDir } from "../lib/native/download";

export function SettingsPage() {
  const { user, device, logout } = useAuth();
  const [downloadDir, setDownloadDir] = useState<string>("");
  const [loadingDir, setLoadingDir] = useState(true);

  useEffect(() => {
    void getDownloadDir()
      .then(setDownloadDir)
      .finally(() => setLoadingDir(false));
  }, []);

  async function handlePickFolder() {
    const picked = await pickDownloadDir();
    if (picked) setDownloadDir(picked);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Panel title="Conta" description="Sua sessão VIP conectada ao Brazilian Packs.">
        <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-black/40 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1ed760]/10 text-[#1ed760]">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{user?.name}</p>
            <p className="mt-1 text-xs text-zinc-500">Plano {user?.plan}</p>
            {device && (
              <p className="mt-2 text-xs text-zinc-600">
                Dispositivo: {device.deviceName} · {device.platformLabel}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" className="mt-4 !px-0 text-zinc-400 hover:!bg-transparent" onClick={() => void logout()}>
          <LogOut className="h-4 w-4" />
          Sair da conta
        </Button>
      </Panel>

      <Panel title="Pasta de destino" description="Escolha onde os arquivos serão salvos no seu computador.">
        <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-black/40 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              {loadingDir ? "Carregando..." : downloadDir || "Pasta padrão"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Os downloads mantêm a estrutura de pastas enviada pela plataforma VIP.
            </p>
          </div>
        </div>
        <Button variant="secondary" className="mt-4" onClick={() => void handlePickFolder()}>
          <FolderOpen className="h-4 w-4" />
          Escolher pasta
        </Button>
      </Panel>

      <Panel title="Plataforma" description="Acesse o catálogo VIP para enviar músicas ao Downloader.">
        <p className="mb-4 break-all text-xs text-zinc-600">{BP_MUSICAS_URL}</p>
        <Button variant="secondary" onClick={() => void openBrazilianPacks()}>
          <ExternalLink className="h-4 w-4" />
          Abrir Brazilian Packs
        </Button>
      </Panel>
    </div>
  );
}
