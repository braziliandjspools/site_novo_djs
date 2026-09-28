import { redirect } from "next/navigation";
import { getVipMusicSession } from "../../../lib/vip-music-access";

type PageProps = {
  params: Promise<{ fileId: string }>;
};

export default async function DriveTrackPage({ params }: PageProps) {
  const { fileId } = await params;
  const session = await getVipMusicSession();

  if (!session.authenticated || !session.canPlay) {
    redirect("/musicas/entrar?return=/musicas/atualizacoes");
  }

  const email = session.user.email?.trim() ?? "";
  if (!/@gmail\.com$/i.test(email)) {
    redirect("/musicas/atualizacoes?drive=requires-gmail");
  }

  const safeFileId = fileId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeFileId) {
    redirect("/musicas/atualizacoes");
  }

  const previewUrl = `https://drive.google.com/file/d/${encodeURIComponent(safeFileId)}/preview`;

  return (
    <main className="min-h-screen bg-[#0b0e0c] text-white">
      <div className="flex h-14 items-center justify-between border-b border-white/10 bg-[#101412] px-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">Google Drive · BRS</p>
          <p className="text-[11px] text-white/45">Visualização protegida dentro da plataforma</p>
        </div>
        <a
          href="/musicas/atualizacoes"
          className="rounded-full border border-[#1ed760]/30 bg-[#1ed760]/10 px-3 py-1.5 text-xs font-bold text-[#1ed760] transition hover:bg-[#1ed760]/20"
        >
          Voltar ao acervo
        </a>
      </div>
      <iframe
        src={previewUrl}
        title="Arquivo do Google Drive"
        className="h-[calc(100vh-3.5rem)] w-full border-0 bg-black"
        allow="autoplay"
        referrerPolicy="no-referrer"
      />
    </main>
  );
}
