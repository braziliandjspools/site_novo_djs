"use client";

import Link from "next/link";
import { FolderOpen, Music2 } from "lucide-react";
import { MusicLibraryTile } from "./MusicLibraryTiles";
import { VipMusicTrackList } from "./VipMusicTrackList";
import { useMusicasSession } from "./MusicasSessionContext";
import type { CollectionChildItem, CollectionsResolveResult } from "../../lib/vip-collections";

function hrefFor(segments: string[]) {
  return segments.length ? `/musicas/colecoes/${segments.map(encodeURIComponent).join("/")}` : "/musicas/colecoes";
}

export function CollectionsBrowseClient({ data }: { data: CollectionsResolveResult }) {
  const { authenticated, hasVip } = useMusicasSession();
  const canPlay = true;
  const canDownload = authenticated && hasVip;

  if (!data.configured) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111] p-6 text-white">
        <h1 className="text-xl font-bold">Coleções</h1>
        <p className="mt-2 text-sm text-white/55">
          A pasta de coleções ainda não foi encontrada no Drive VIP.
        </p>
      </div>
    );
  }

  const parentSegments = data.slugSegments.slice(0, -1);
  const title = data.displayName || "Coleções";

  if (data.level === "tracks") {
    return (
      <div className="space-y-5">
        <nav className="text-sm text-white/50">
          <Link href="/musicas/colecoes" className="hover:text-white">Coleções</Link>
          {data.resolvedPath.map((item, index) => (
            <span key={item.id}>
              {" / "}
              <Link href={hrefFor(data.slugSegments.slice(0, index + 1))} className="hover:text-white">
                {item.displayName}
              </Link>
            </span>
          ))}
        </nav>
        <header>
          <h1 className="text-2xl font-extrabold text-white">{title}</h1>
          <p className="mt-1 text-sm text-white/50">{data.trackCount.toLocaleString("pt-BR")} faixas</p>
        </header>
        <VipMusicTrackList
          folderId={data.folderId}
          tracks={data.tracks}
          canPlay={canPlay}
          canDownload={canDownload}
          relativePath={data.slugSegments.join("/")}
          coverUrl={data.coverUrl}
          albumTitle={title}
          layout="discography"
        />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
          <FolderOpen className="h-4 w-4" />
          {data.slugSegments.length ? "Coleções" : "Acervo"}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white">{title}</h1>
        <p className="mt-1 text-sm text-white/50">
          {data.items.length.toLocaleString("pt-BR")} {data.items.length === 1 ? "pasta" : "pastas"}
          {data.trackCount > 0 ? ` · ${data.trackCount.toLocaleString("pt-BR")} faixas` : ""}
        </p>
      </header>

      {data.slugSegments.length > 0 ? (
        <Link href={hrefFor(parentSegments)} className="inline-flex items-center gap-2 text-sm font-bold text-[#60cdff] hover:underline">
          ← Voltar
        </Link>
      ) : null}

      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#111] p-8 text-center text-white/50">
          Nenhum álbum/pasta encontrado nesta coleção.
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.items.map((item: CollectionChildItem, index) => (
            <MusicLibraryTile
              key={item.id}
              href={hrefFor([...data.slugSegments, item.slug])}
              title={item.displayName}
              subtitle={item.folderCount > 0 ? `${item.folderCount} volumes` : `${item.trackCount} faixas`}
              trackCount={item.trackCount}
              folderCount={item.folderCount}
              imageUrl={item.coverUrl}
              icon={item.folderCount > 0 ? FolderOpen : Music2}
              index={index}
              caption="below"
            />
          ))}
        </section>
      )}
    </div>
  );
}
