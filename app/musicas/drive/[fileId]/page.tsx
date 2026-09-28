import { getAuthorizedVipDriveTrack } from "../../../lib/vip-drive-view";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DriveTrackPage({ params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const access = await getAuthorizedVipDriveTrack(fileId);
  if (!access.ok) {
    if (access.status === 401) redirect("/musicas/entrar?return=/musicas/atualizacoes");
    if (access.status === 403 || access.status === 503) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0b0e0c] px-5 text-center text-white">
          <p className="text-sm">{access.error}</p>
          <Link href="/musicas/atualizacoes" className="rounded-full border border-[#1ed760]/30 px-4 py-2 text-sm text-[#1ed760]">Voltar ao acervo</Link>
        </main>
      );
    }
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#0b0e0c] text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#101412] px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1ed760]">BRS · Drive</p>
          <h1 className="truncate text-base font-semibold">{access.name}</h1>
        </div>
        <Link href="/musicas/atualizacoes" className="shrink-0 rounded-full border border-[#1ed760]/30 bg-[#1ed760]/10 px-4 py-2 text-xs font-bold text-[#1ed760]">Voltar ao acervo</Link>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-5 px-4 py-12">
        <div className="rounded-2xl border border-[#1ed760]/20 bg-[#131a16] p-5 sm:p-8">
          <p className="mb-5 break-words text-lg font-bold">{access.name}</p>
          <audio className="w-full" controls preload="metadata" src={`/api/musicas/drive/${encodeURIComponent(fileId)}`} aria-label={`Ouvir ${access.name}`} />
        </div>
      </div>
    </main>
  );
}
