import { useEffect, useState } from "react";
import { ExternalLink, FolderOpen, LogOut, User } from "lucide-react";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useDownloadManager } from "../context/DownloadManagerContext";
import { BP_MUSICAS_URL } from "../lib/site";
import { APP_VERSION, DEFAULT_API_BASE_URL, normalizeApiBaseUrl, setCachedApiBaseUrl } from "../lib/api/config";
import { isUpdaterConfigured } from "../lib/updater";
import { openPlatform } from "../lib/open-site";
import { SITE_NAME } from "../lib/site";
import { downloadManager } from "../lib/download/download-manager";
import { notificationManager } from "../lib/notifications/notification-manager";
import {
  getAppPreferences,
  setAppPreferences,
  type AppPreferences,
  type ExistingFileBehavior,
} from "../lib/native/app-preferences";
import {
  getDownloadDir,
  hasDownloadDirConfigured,
  openDownloadDir,
  pickDownloadDir,
} from "../lib/native/download";

const DEFAULT_PREFS: AppPreferences = {
  startWithWindows: false,
  minimizeToTray: true,
  autoDownload: true,
  showNotifications: true,
  downloadDir: null,
  maxConcurrentDownloads: 3,
  preserveFolderStructure: true,
  existingFileBehavior: "ignore",
  apiBaseUrl: null,
};

const EXISTING_FILE_OPTIONS: { value: ExistingFileBehavior; label: string; description: string }[] = [
  {
    value: "ignore",
    label: "Ignorar automaticamente",
    description:
      "Pula o download quando o arquivo já existe. Arquivos comprovadamente iguais (mesmo ID e tamanho) são sempre ignorados.",
  },
  {
    value: "ask",
    label: "Perguntar",
    description: "Exibe um diálogo para substituir, renomear ou ignorar quando houver conflito.",
  },
  {
    value: "rename",
    label: "Renomear automaticamente",
    description: "musica.mp3 → musica (1).mp3 quando o arquivo já existir.",
  },
  {
    value: "replace",
    label: "Substituir",
    description: "Sobrescreve o arquivo existente na pasta de destino.",
  },
];

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-black/40 p-4 transition-colors hover:border-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-[#1ed760] focus:ring-[#1ed760]"
      />
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-zinc-500">{description}</span>
      </span>
    </label>
  );
}

export function SettingsPage() {
  const { user, device, logout } = useAuth();
  const { maxConcurrency, setMaxConcurrency } = useDownloadManager();
  const [downloadDir, setDownloadDir] = useState<string>("");
  const [loadingDir, setLoadingDir] = useState(true);
  const [dirError, setDirError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFS);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [configured, loadedPrefs] = await Promise.all([
          hasDownloadDirConfigured(),
          getAppPreferences(),
        ]);
        setPrefs(loadedPrefs);
        if (!configured) {
          setDownloadDir("");
          return;
        }
        const dir = await getDownloadDir();
        setDownloadDir(dir);
      } catch (error) {
        setDirError(error instanceof Error ? error.message : "Não foi possível carregar a pasta.");
      } finally {
        setLoadingDir(false);
      }
    })();
  }, []);

  async function updatePreference(patch: Partial<AppPreferences>) {
    setPrefsError(null);
    const next = { ...prefs, ...patch, maxConcurrentDownloads: maxConcurrency };
    setPrefs(next);
    try {
      const saved = await setAppPreferences(next);
      setPrefs(saved);
      downloadManager.setAutoDownload(saved.autoDownload);
      notificationManager.setEnabled(saved.showNotifications);
    } catch (error) {
      setPrefsError(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  async function handlePickFolder() {
    setDirError(null);
    try {
      const picked = await pickDownloadDir();
      if (picked) {
        setDownloadDir(picked);
        void downloadManager.refreshDiskSpace();
      }
    } catch (error) {
      setDirError(error instanceof Error ? error.message : "Não foi possível alterar a pasta.");
    }
  }

  async function handleOpenFolder() {
    setDirError(null);
    try {
      await openDownloadDir();
    } catch (error) {
      setDirError(error instanceof Error ? error.message : "Não foi possível abrir a pasta.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Panel title="Conta" description={`Sua sessão VIP conectada ao ${SITE_NAME}.`}>
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
        <Button
          variant="ghost"
          className="mt-4 !px-0 text-zinc-400 hover:!bg-transparent"
          onClick={() => void logout()}
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </Button>
      </Panel>

      <Panel title="Windows" description="Integração com bandeja, inicialização e notificações.">
        <div className="space-y-2">
          <PreferenceToggle
            label="Iniciar com Windows"
            description="Abre o downloader automaticamente ao ligar o computador."
            checked={prefs.startWithWindows}
            onChange={(checked) => void updatePreference({ startWithWindows: checked })}
          />
          <PreferenceToggle
            label="Minimizar para bandeja"
            description="Ao fechar a janela, o app continua na bandeja e mantém os downloads."
            checked={prefs.minimizeToTray}
            onChange={(checked) => void updatePreference({ minimizeToTray: checked })}
          />
          <PreferenceToggle
            label="Baixar automaticamente"
            description="Inicia downloads assim que novas músicas entrarem na fila."
            checked={prefs.autoDownload}
            onChange={(checked) => void updatePreference({ autoDownload: checked })}
          />
          <PreferenceToggle
            label="Mostrar notificações"
            description="Alertas nativos do Windows para novas músicas, conclusões e falhas."
            checked={prefs.showNotifications}
            onChange={(checked) => void updatePreference({ showNotifications: checked })}
          />
        </div>
        {prefsError && <p className="mt-3 text-xs text-red-400">{prefsError}</p>}
      </Panel>

      <Panel
        title="Organização"
        description="Como salvar arquivos e lidar com duplicatas na pasta de destino."
      >
        <div className="space-y-2">
          <PreferenceToggle
            label="Preservar estrutura de pastas"
            description="Mantém subpastas do site (ex.: Funk/Setembro 2026/musica.mp3) dentro da pasta de downloads."
            checked={prefs.preserveFolderStructure}
            onChange={(checked) => void updatePreference({ preserveFolderStructure: checked })}
          />
          <div className="rounded-lg border border-zinc-800 bg-black/40 p-4">
            <p className="text-sm font-semibold text-white">Arquivos duplicados</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Como tratar arquivos que já existem na pasta de destino (análise local, sem consulta ao servidor).
            </p>
            <div className="mt-3 space-y-2">
              {EXISTING_FILE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-zinc-800/80 px-3 py-2 transition-colors hover:border-zinc-700"
                >
                  <input
                    type="radio"
                    name="existingFileBehavior"
                    checked={prefs.existingFileBehavior === option.value}
                    onChange={() => void updatePreference({ existingFileBehavior: option.value })}
                    className="mt-1 h-4 w-4 border-zinc-600 bg-zinc-900 text-[#1ed760] focus:ring-[#1ed760]"
                  />
                  <span>
                    <span className="block text-sm text-white">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {prefsError && <p className="mt-3 text-xs text-red-400">{prefsError}</p>}
      </Panel>

      <Panel title="Pasta de downloads" description="Local onde os arquivos finalizados são salvos.">
        <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-black/40 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              {loadingDir ? "Carregando..." : downloadDir || "Não configurada"}
            </p>
            <p className="mt-1 break-all text-xs leading-relaxed text-zinc-500">
              {downloadDir || "Escolha uma pasta para iniciar os downloads."}
            </p>
          </div>
        </div>
        {dirError && <p className="mt-3 text-xs text-red-400">{dirError}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void handlePickFolder()}>
            Alterar pasta
          </Button>
          <Button variant="secondary" disabled={!downloadDir} onClick={() => void handleOpenFolder()}>
            Abrir pasta
          </Button>
        </div>
      </Panel>

      <Panel
        title="Downloads simultâneos"
        description="Quantos arquivos baixar ao mesmo tempo. Padrão: 3."
      >
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMaxConcurrency(value)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                maxConcurrency === value
                  ? "border-[#1ed760] bg-[#1ed760]/10 text-[#1ed760]"
                  : "border-zinc-800 bg-black/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Aplicativo" description="Versão instalada e conexão com o site.">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
            <dt className="text-zinc-500">Versão</dt>
            <dd className="font-mono font-semibold text-white">{APP_VERSION}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
            <dt className="text-zinc-500">Atualizações automáticas</dt>
            <dd className="text-zinc-300">{isUpdaterConfigured() ? "Configurado" : "Desativado"}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <label htmlFor="apiBaseUrl" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            URL do site (API)
          </label>
          <input
            id="apiBaseUrl"
            type="text"
            inputMode="url"
            spellCheck={false}
            value={prefs.apiBaseUrl ?? DEFAULT_API_BASE_URL}
            onChange={(event) => {
              const value = event.target.value;
              setPrefs((current) => ({ ...current, apiBaseUrl: value || null }));
            }}
            onBlur={(event) => {
              const value = normalizeApiBaseUrl(event.target.value);
              void updatePreference({ apiBaseUrl: value || null }).then(() => {
                setCachedApiBaseUrl(value || DEFAULT_API_BASE_URL);
              });
            }}
            className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#1ed760]"
          />
          <p className="mt-2 text-xs text-zinc-600">
            Padrão do build: {DEFAULT_API_BASE_URL}. Use http://localhost:3000 em desenvolvimento.
          </p>
        </div>
      </Panel>

      <Panel title="Plataforma" description="Acesse o catálogo VIP para enviar músicas ao Downloader.">
        <p className="mb-4 break-all text-xs text-zinc-600">{BP_MUSICAS_URL}</p>
        <Button variant="secondary" onClick={() => void openPlatform()}>
          <ExternalLink className="h-4 w-4" />
          Abrir plataforma
        </Button>
      </Panel>
    </div>
  );
}
