import Link from "next/link";
import { Disc3, FolderOpen, Music2 } from "lucide-react";
import { resolveCollectionsPath } from "../../../lib/vip-collections";
import { VipMusicTrackList } from "../../components/VipMusicTrackList";
import { getVipMusicSession, vipMusicClientAccess } from "../../../lib/vip-music-access";
import { JsonLd } from "../../../components/JsonLd";
import { breadcrumbJsonLd } from "../../../lib/seo";

export default async function AlbumPathPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const [data, session] = await Promise.all([resolveCollectionsPath(slug.join("/")), getVipMusicSession()]);
  const access = vipMusicClientAccess(session);
  const crumbs = [{ name: "Início", path: "/" }, { name: "Músicas", path: "/musicas" }, { name: "Álbuns", path: "/musicas/albuns" }, ...data.resolvedPath.map((item) => ({ name: item.displayName, path: `/musicas/albuns/${item.slug}` }))];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <main className="w-full space-y-6">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <Link href="/musicas/albuns" className="font-medium text-zinc-400 hover:text-white">Álbuns</Link>
          {data.resolvedPath.map((item) => (
            <span key={item.id} className="flex items-center gap-2"><span>/</span><span className="font-medium text-white">{item.displayName}</span></span>
          ))}
        </nav>
        <header className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#101010] p-5 sm:flex-row sm:items-end sm:p-7">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#18212a] to-[#090909] shadow-2xl sm:h-44 sm:w-44">
            {data.coverUrl ? <img src={data.coverUrl} alt="" className="h-full w-full object-cover" /> : <Disc3 className="h-16 w-16 text-[#60cdff]/30" />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#60cdff]">{data.resolvedPath.length > 1 ? "Volume / acervo" : "Álbum / coleção"}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-4xl">{data.displayName}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45">
              <span><FolderOpen className="mr-1 inline h-3.5 w-3.5" />{data.albumCount} pastas</span>
              <span><Music2 className="mr-1 inline h-3.5 w-3.5" />{data.trackCount} faixas</span>
            </div>
          </div>
        </header>
        {data.level === "folders" ? (
          <section>
            <div className="mb-4"><h2 className="text-lg font-bold text-white">{data.resolvedPath.length === 1 ? "Volumes" : "Pastas do acervo"}</h2><p className="mt-1 text-sm text-white/40">A estrutura do Drive é preservada automaticamente.</p></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {data.items.map((item) => (
                <Link key={item.id} href={`/musicas/albuns/${[...data.slugSegments, item.slug].join("/")}`} className="group rounded-2xl border border-white/[0.08] bg-[#0c0c0c] p-4 transition hover:-translate-y-1 hover:border-[#60cdff]/40">
                  <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#18212a] to-[#090909]">
                    {item.coverUrl ? <img src={item.coverUrl} alt="" className="h-full w-full object-cover" /> : <Disc3 className="h-12 w-12 text-[#60cdff]/25" />}
                  </div>
                  <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.16em] text-[#60cdff]/70">{data.resolvedPath.length === 1 ? "Volume" : "Pasta"}</p>
                  <h2 className="mt-1 line-clamp-2 text-sm font-bold text-white group-hover:text-[#8ad4ff]">{item.displayName}</h2>
                  <div className="mt-2 text-[10px] text-white/40"><Music2 className="mr-1 inline h-3 w-3" />{item.trackCount} faixas</div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-2 sm:p-3">
            <VipMusicTrackList folderId={data.folderId} tracks={data.tracks} canPlay={access.canPlay} canDownload={access.canDownload} coverUrl={data.coverUrl} albumTitle={data.displayName} layout="discography" />
          </section>
        )}
      </main>
    </>
  );
}
