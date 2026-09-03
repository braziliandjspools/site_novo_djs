import { Monitor, Terminal } from "lucide-react";
import { Button } from "./ui/Button";
import { isDesktopRuntime } from "../lib/native/download";

type DesktopRequiredNoticeProps = {
  variant?: "full" | "banner";
};

export function DesktopRequiredNotice({ variant = "full" }: DesktopRequiredNoticeProps) {
  if (isDesktopRuntime()) return null;

  if (variant === "banner") {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        Modo navegador — downloads e pasta de destino não funcionam aqui. Use a janela{" "}
        <strong className="font-semibold">BRS Downloader</strong> aberta pelo comando abaixo.
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
        <Monitor className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <h1 className="max-w-lg text-2xl font-bold text-white">Abra o app desktop, não o navegador</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
        Você está em <span className="text-zinc-200">http://localhost:1420</span> no navegador.
        Esse modo serve só para testar layout — <strong className="text-white">não baixa arquivos</strong> e
        aparece como <span className="text-zinc-300">Navegador (dev)</span>.
      </p>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-500">
        Feche esta aba. Na raiz do projeto, execute o comando abaixo. Use a{" "}
        <strong className="text-zinc-300">janela do BRS Downloader</strong> que abrir sozinha (não o Chrome/Edge).
      </p>
      <div className="mt-8 w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-left">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          <Terminal className="h-3.5 w-3.5" />
          PowerShell — pasta do projeto
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-black px-4 py-3 text-sm text-[#1db954]">
          cd D:\Downloads\brazilian-packs-landing{"\n"}npm run downloader:dev
        </pre>
      </div>
      <Button
        variant="secondary"
        className="mt-6"
        onClick={() => {
          window.location.reload();
        }}
      >
        Já abri o app desktop — recarregar
      </Button>
    </div>
  );
}

export function useIsDesktopApp() {
  return isDesktopRuntime();
}
