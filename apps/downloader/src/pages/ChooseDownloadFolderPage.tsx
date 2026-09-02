import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "../components/ui/Button";
import { getDefaultDownloadDir, pickDownloadDir } from "../lib/native/download";

type ChooseDownloadFolderPageProps = {
  onConfigured: (path: string) => void;
};

function SuggestedPath() {
  const [path, setPath] = useState("");

  useEffect(() => {
    void getDefaultDownloadDir().then(setPath);
  }, []);

  if (!path) return null;
  return (
    <p className="mt-2 max-w-md break-all text-xs text-zinc-600">
      Pasta sugerida: <span className="text-zinc-400">{path}</span>
    </p>
  );
}

export function ChooseDownloadFolderPage({ onConfigured }: ChooseDownloadFolderPageProps) {
  async function handlePickFolder() {
    const picked = await pickDownloadDir();
    if (picked) onConfigured(picked);
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1ed760]/10 text-[#1ed760]">
        <FolderOpen className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <h1 className="max-w-md text-2xl font-bold text-white">
        Escolha onde suas músicas serão salvas
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
        Exemplo: <span className="text-zinc-300">D:\Brazilian Packs</span>
      </p>
      <SuggestedPath />
      <Button className="mt-8" onClick={() => void handlePickFolder()}>
        <FolderOpen className="h-4 w-4" />
        Escolher pasta
      </Button>
    </div>
  );
}
