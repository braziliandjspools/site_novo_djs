import Link from "next/link";
import { Disc3, FolderOpen, Music2 } from "lucide-react";
import { listCollections } from "../../lib/vip-collections";
import { JsonLd } from "../../components/JsonLd";
import { breadcrumbJsonLd, collectionPageJsonLd } from "../../lib/seo";

export default async function AlbunsPage() {
  let data: Awaited<ReturnType<typeof listCollections>> = { configured: false, rootFolderId: null, collections: [] };
  try {
    data = await listCollections();
  } catch (error) {
    console.error("[musicas/albuns] Falha ao carregar catálogo:", error);
  }
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Início", path: "/" }, { name: "Músicas", path: "/musicas" }, { name: "Álbuns", path: "/musicas/albuns" }])} />
      <JsonLd data={collectionPageJsonLd({ name: "Álbuns e coleções BRS", description: "Álbuns, coleções e volumes organizados para DJs.", path: "/musicas/albuns" })} />
      <main className="w-full space-y-7">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <Link href="/musicas/atualizacoes" className="font-medium text-zinc-400 hover:text-white">Atualizações</Link>
          <span>/</span>
          <span className="font-medium text-white">Álbuns</span>
        </nav>
        <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#171b24] via-[#111318] to-[#0a0a0a] px-5 py-7 sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#60cdff]/10 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#60cdff]">Biblioteca BRS</p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">Álbuns</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
              Acervos completos organizados em coleções e volumes, no estilo de uma biblioteca de streaming.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/75">
                <Disc3 className="mr-1.5 inline h-3.5 w-3.5 text-[#60cdff]" />{data.collections.length} {data.collections.length === 1 ? "álbum" : "álbuns"}
              </span>
              <Link href="/musicas/artistas" className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/60 hover:text-white">
                Artistas
              </Link>
            </div>
          </div>
        </header>
        {!data.configured || data.collections.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-12 text-center">
            <Disc3 className="mx-auto h-10 w-10 text-white/20" />
            <h2 className="mt-4 text-lg font-bold text-white">Nenhum álbum disponível ainda</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-white/45">
              Quando o acervo for organizado em ÁLBUNS → nome do álbum → volume 01, 02… ele aparecerá automaticamente aqui.
            </p>
          </section>
        ) : (
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Seus álbuns e coleções</h2>
                <p className="mt-1 text-sm text-white/40">Volumes identificados diretamente na estrutura do acervo.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {data.collections.map((album) => (
                <Link key={album.id} href={`/musicas/albuns/${album.slug}`} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0c] transition hover:-translate-y-1 hover:border-[#60cdff]/40">
                  <div className="aspect-square overflow-hidden bg-gradient-to-br from-[#18212a] to-[#090909]">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Disc3 className="h-16 w-16 text-[#60cdff]/30" /></div>
                    )}
                  </div>
                  <div className="p-3.5">
                    <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-[#60cdff]/70">Álbum / Coleção</p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-extrabold text-white group-hover:text-[#8ad4ff]">{album.displayName}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-white/40">
                      <span><FolderOpen className="mr-1 inline h-3 w-3" />{album.albumCount} volumes</span>
                      {album.trackCount > 0 ? <span><Music2 className="mr-1 inline h-3 w-3" />{album.trackCount} faixas</span> : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
