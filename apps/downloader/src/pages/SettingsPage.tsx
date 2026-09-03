import { useEffect, useState } from "react";
import { Download, ExternalLink, FolderOpen, Info, Loader2, LogOut, User } from "lucide-react";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useDownloadManager } from "../context/DownloadManagerContext";
import { APP_VERSION, DEFAULT_API_BASE_URL, normalizeApiBaseUrl, setCachedApiBaseUrl } from "../lib/api/config";
import { APP_CHANGELOG, APP_CORE_VERSION, RUSTC_VERSION, WEBUI_VERSION } from "../lib/app-info";
import { checkForAppUpdates, openUpdateDownload } from "../lib/updater";
import { openPlatform } from "../lib/open-site";
import { BP_MUSICAS_URL, BP_PRIVACY_CONDUCT_URL, BP_PRIVACY_COOKIES_URL, BP_PRIVACY_DOWNLOADER_URL, SITE_NAME } from "../lib/site";
import { downloadManager } from "../lib/download/download-manager";
import { notificationManager } from "../lib/notifications/notification-manager";
import {
  getAppPreferences,
  setAppPreferences,
  DEFAULT_PREFERENCES,
  type AppPreferences,
  type ExistingFileBehavior,
  type SpeedLimitMode,
} from "../lib/native/app-preferences";
import {
  getDownloadDir,
  hasDownloadDirConfigured,
  openDownloadDir,
  pickDownloadDir,
} from "../lib/native/download";

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
        className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-[#1db954] focus:ring-[#1db954]"
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
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [customMbpsDraft, setCustomMbpsDraft] = useState("3");
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [latestDownloadUrl, setLatestDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [configured, loadedPrefs] = await Promise.all([
          hasDownloadDirConfigured(),
          getAppPreferences(),
        ]);
        setPrefs(loadedPrefs);
        setCustomMbpsDraft(String(loadedPrefs.speedLimitCustomMbps ?? 3));
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
      downloadManager.setSchedulePreferences(saved);
      downloadManager.setZipCompressDownloads(saved.zipCompressDownloads);
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

  async function handleSpeedLimitMode(mode: SpeedLimitMode) {
    if (mode === "custom") {
      const parsed = Number(customMbpsDraft.replace(",", "."));
      const speedLimitCustomMbps = Number.isFinite(parsed) && parsed > 0 ? parsed : prefs.speedLimitCustomMbps;
      setCustomMbpsDraft(String(speedLimitCustomMbps));
      await updatePreference({ speedLimitMode: "custom", speedLimitCustomMbps });
      return;
    }
    await updatePreference({ speedLimitMode: mode });
  }

  async function commitCustomMbps() {
    const parsed = Number(customMbpsDraft.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setCustomMbpsDraft(String(prefs.speedLimitCustomMbps));
      return;
    }
    const speedLimitCustomMbps = Math.min(1000, Math.max(0.1, parsed));
    setCustomMbpsDraft(String(speedLimitCustomMbps));
    await updatePreference({ speedLimitMode: "custom", speedLimitCustomMbps });
  }

  const speedLimitOptions: { value: SpeedLimitMode; label: string }[] = [
    { value: "unlimited", label: "Sem limite" },
    { value: "1", label: "1 MB/s" },
    { value: "2", label: "2 MB/s" },
    { value: "5", label: "5 MB/s" },
    { value: "10", label: "10 MB/s" },
    { value: "20", label: "20 MB/s" },
    { value: "custom", label: "Personalizado" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Panel title="Conta" description={`Sua sessão VIP conectada ao ${SITE_NAME}.`}>
        <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-black/40 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1db954]/10 text-[#1db954]">
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
            description="Alertas nativos do Windows e entradas no sininho para novas músicas, conclusões e falhas."
            checked={prefs.showNotifications}
            onChange={(checked) => void updatePreference({ showNotifications: checked })}
          />
          <PreferenceToggle
            label="Verificar atualizações do aplicativo"
            description="O app consulta o site periodicamente e avisa no sininho quando houver um novo instalador (.exe)."
            checked={prefs.checkAppUpdates}
            onChange={(checked) => void updatePreference({ checkAppUpdates: checked })}
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
          <div className="space-y-2">
            <PreferenceToggle
              label="Compactar downloads em arquivo ZIP"
              description="Cria um único arquivo ZIP com as músicas após o download."
              checked={prefs.zipCompressDownloads}
              onChange={(checked) => void updatePreference({ zipCompressDownloads: checked })}
            />
            <div className="flex items-start gap-2 rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2.5 text-xs leading-relaxed text-zinc-500">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-500" aria-hidden />
              <span>
                Esta opção utiliza recursos moderados do seu computador durante a compactação,
                principalmente em packs grandes.
              </span>
            </div>
          </div>
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
                    className="mt-1 h-4 w-4 border-zinc-600 bg-zinc-900 text-[#1db954] focus:ring-[#1db954]"
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
        title="Downloads"
        description="Agendamento local da fila. Não usa servidor nem Neon."
      >
        <div className="space-y-3">
          <PreferenceToggle
            label="Baixar somente em determinados horários"
            description="Fora da janela, novos downloads aguardam. Ao entrar no horário, a fila retoma sozinha."
            checked={prefs.scheduleEnabled}
            onChange={(checked) => void updatePreference({ scheduleEnabled: checked })}
          />

          {prefs.scheduleEnabled && (
            <div className="rounded-lg border border-zinc-800 bg-black/40 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="scheduleStart"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500"
                  >
                    Iniciar
                  </label>
                  <input
                    id="scheduleStart"
                    type="time"
                    value={prefs.scheduleStart}
                    onChange={(event) => {
                      const scheduleStart = event.target.value || prefs.scheduleStart;
                      setPrefs((current) => ({ ...current, scheduleStart }));
                    }}
                    onBlur={(event) => {
                      void updatePreference({
                        scheduleStart: event.target.value || "00:00",
                      });
                    }}
                    className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#1db954]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="scheduleEnd"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500"
                  >
                    Parar
                  </label>
                  <input
                    id="scheduleEnd"
                    type="time"
                    value={prefs.scheduleEnd}
                    onChange={(event) => {
                      const scheduleEnd = event.target.value || prefs.scheduleEnd;
                      setPrefs((current) => ({ ...current, scheduleEnd }));
                    }}
                    onBlur={(event) => {
                      void updatePreference({
                        scheduleEnd: event.target.value || "07:00",
                      });
                    }}
                    className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#1db954]"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-600">
                Intervalos que atravessam meia-noite são suportados (ex.: 23:00 → 06:00). Ao terminar o horário, os
                downloads ativos são pausados com retomada — sem cancelar jobs.
              </p>
            </div>
          )}

          <PreferenceToggle
            label="Downloads iniciados manualmente ignoram o horário"
            description="Retomar ou tentar novamente pela interface pode iniciar mesmo fora da janela."
            checked={prefs.scheduleAllowManualOverride}
            onChange={(checked) => void updatePreference({ scheduleAllowManualOverride: checked })}
          />
        </div>
        {prefsError && <p className="mt-3 text-xs text-red-400">{prefsError}</p>}
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
                  ? "border-[#1db954] bg-[#1db954]/10 text-[#1db954]"
                  : "border-zinc-800 bg-black/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title="Rede"
        description="Limite total de velocidade compartilhado entre todos os downloads ativos."
      >
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
          Limite de velocidade
        </p>
        <div className="flex flex-wrap gap-2">
          {speedLimitOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => void handleSpeedLimitMode(option.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                prefs.speedLimitMode === option.value
                  ? "border-[#1db954] bg-[#1db954]/10 text-[#1db954]"
                  : "border-zinc-800 bg-black/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {prefs.speedLimitMode === "custom" && (
          <div className="mt-4">
            <label
              htmlFor="speedLimitCustomMbps"
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500"
            >
              Velocidade personalizada (MB/s)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="speedLimitCustomMbps"
                type="number"
                min={0.1}
                max={1000}
                step={0.1}
                inputMode="decimal"
                value={customMbpsDraft}
                onChange={(event) => setCustomMbpsDraft(event.target.value)}
                onBlur={() => void commitCustomMbps()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                className="w-32 rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#1db954]"
              />
              <span className="text-xs text-zinc-500">MB/s</span>
            </div>
          </div>
        )}

        <p className="mt-3 text-xs leading-relaxed text-zinc-600">
          O limite vale para o conjunto dos downloads (não por arquivo). Alterações valem na hora, inclusive durante
          transferências em andamento.
        </p>
        {prefsError && <p className="mt-2 text-xs text-red-400">{prefsError}</p>}
      </Panel>

      <Panel title="Aplicativo" description="Versão instalada, atualizações e conexão com o site.">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
            <dt className="text-zinc-500">Versão instalada</dt>
            <dd className="font-mono font-semibold text-white">{APP_VERSION}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={updateBusy}
            onClick={() => {
              void (async () => {
                setUpdateBusy(true);
                setUpdateMessage(null);
                try {
                  const result = await checkForAppUpdates({ silent: false, notifyFeed: true });
                  setUpdateMessage(result.message);
                  setLatestDownloadUrl(result.latest?.downloadUrl ?? null);
                } finally {
                  setUpdateBusy(false);
                }
              })();
            }}
          >
            {updateBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Verificar atualizações
          </Button>
          {latestDownloadUrl && (
            <Button variant="primary" onClick={() => void openUpdateDownload(latestDownloadUrl)}>
              <Download className="h-4 w-4" />
              Baixar nova versão
            </Button>
          )}
        </div>
        {updateMessage && <p className="mt-3 text-xs text-zinc-400">{updateMessage}</p>}

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
            className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#1db954]"
          />
          <p className="mt-2 text-xs text-zinc-600">
            Padrão do build: {DEFAULT_API_BASE_URL}. Use http://localhost:3000 em desenvolvimento.
          </p>
        </div>
      </Panel>

      <Panel title="Sobre" description="Informações do app, versões e links legais.">
        <button
          type="button"
          onClick={() => void openPlatform(BP_MUSICAS_URL)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1db954] px-5 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-[#1ed760]"
        >
          <ExternalLink className="h-4 w-4" />
          APP ONLINE
        </button>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
            <dt className="text-zinc-500">Versão WebUI atual</dt>
            <dd className="font-mono font-semibold text-white">{WEBUI_VERSION}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
            <dt className="text-zinc-500">Versão atual</dt>
            <dd className="font-mono font-semibold text-white">{APP_CORE_VERSION}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
            <dt className="text-zinc-500">Versão do Rust</dt>
            <dd className="font-mono font-semibold text-white">{RUSTC_VERSION}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs leading-relaxed text-zinc-400">
          Este app usa a biblioteca Rust, na qual você pode se basear para criar sua própria UI no futuro.
        </p>

        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1db954]">Changelog</p>
          <div className="mt-3 space-y-4">
            {APP_CHANGELOG.map((entry) => (
              <div key={entry.version} className="rounded-xl border border-white/[0.06] bg-[#141414] px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-white">v{entry.version}</p>
                  <p className="text-[11px] text-zinc-500">{entry.date}</p>
                </div>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-400">
                  {entry.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[#1db954]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button variant="secondary" onClick={() => void openPlatform(BP_PRIVACY_DOWNLOADER_URL)}>
            <ExternalLink className="h-4 w-4" />
            Política de Privacidade
          </Button>
          <Button variant="secondary" onClick={() => void openPlatform(BP_PRIVACY_COOKIES_URL)}>
            <ExternalLink className="h-4 w-4" />
            Política de Cookies
          </Button>
          <Button variant="secondary" onClick={() => void openPlatform(BP_PRIVACY_CONDUCT_URL)}>
            <ExternalLink className="h-4 w-4" />
            Código de Conduta
          </Button>
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          Políticas abrem no navegador padrão.
        </p>
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
