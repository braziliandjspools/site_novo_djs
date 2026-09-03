import Link from "next/link";
import { redirect } from "next/navigation";
import { MonitorDown } from "lucide-react";
import { previewPackBySlug } from "../../../lib/pack-download";
import { buildPackDownloadUrl } from "../../../lib/pack-download-link";
import { folderHref } from "../../../lib/vip-music-slugs";
import { CopyPackLinkButton } from "../../components/CopyPackLinkButton";

export default async function PackDownloadLandingPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const segments = (slug ?? []).map((part) => decodeURIComponent(part)).filter(Boolean);
  if (segments.length === 0) {
    redirect("/musicas/atualizacoes");
  }

  const packSlug = segments.join("/");
  const preview = await previewPackBySlug(packSlug);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1ed760]">Link do Downloader</p>
        <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
          {"error" in preview ? "Pasta não encontrada" : preview.folder.displayName}
        </h1>
        {"ok" in preview && (
          <p className="mt-2 text-sm text-zinc-400">{preview.folder.relativePath}</p>
        )}
      </div>

      {"error" in preview ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {preview.error}
        </p>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#1a1a1a] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#1ed760]/15 text-[#1ed760]">
              <MonitorDown className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">
                {preview.trackCount} {preview.trackCount === 1 ? "faixa" : "faixas"} neste pack
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Cole este link no BRS Downloader para validar e baixar todas as faixas de uma vez (como se
                tivessem sido enviadas pelo site).
              </p>
              <p className="mt-3 break-all rounded-lg bg-black/40 px-3 py-2 font-mono text-[11px] text-zinc-400">
                {buildPackDownloadUrl(segments)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CopyPackLinkButton slugSegments={segments} className="!h-9 !w-auto !gap-2 !px-3 !text-xs" />
                <span className="text-xs text-zinc-500">Copiar link</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href={folderHref(segments.slice(0, 1))}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Abrir no acervo
        </Link>
        <Link
          href="/musicas/atualizacoes"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white"
        >
          Voltar às atualizações
        </Link>
      </div>
    </div>
  );
}
