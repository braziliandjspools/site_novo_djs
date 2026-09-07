"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import { PLACEHOLDER } from "../../lib/theme";
import {
  childrenAreYearFolders,
  displayFolderName,
  folderHref,
  isYearFolderName,
  slugifyFolderName,
  sortFoldersByYear,
} from "../../lib/vip-music-slugs";
import { AtualizacoesAcervoHero } from "../components/AtualizacoesAcervoHero";
import { MusicasMonthLinks } from "../components/MusicasMonthLinks";
import { useMusicasSession } from "../components/MusicasSessionContext";
import { monthsReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";

export default function AtualizacoesPage() {
  const { hasVip } = useMusicasSession();
  const [folders, setFolders] = useState<VipMusicFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/musicas/tree", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setFolders((data as { folders?: VipMusicFolder[] }).folders ?? []);
        if ((data as { error?: string }).error) {
          setError((data as { error?: string }).error ?? null);
        }
      })
      .catch(() => setError("Não foi possível carregar o acervo."))
      .finally(() => setLoading(false));
  }, []);

  const yearMode = childrenAreYearFolders(folders) || folders.some((f) => isYearFolderName(f.name));
  const yearFolders = yearMode
    ? sortFoldersByYear(
        folders.some((f) => isYearFolderName(f.name))
          ? folders.filter((f) => isYearFolderName(f.name))
          : folders,
        true,
      )
    : [];

  const newFolderIds = useNewFolderHighlights(
    monthsReadKey(),
    folders.map((folder) => folder.id),
  );

  return (
    <div className="w-full">
      <AtualizacoesAcervoHero
        monthCount={yearMode ? yearFolders.length : folders.length}
        hasVip={hasVip}
      />

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && yearMode && (
        <div className="mt-2">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Anos</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(yearFolders.length > 0 ? yearFolders : folders).map((year) => {
              const slug = slugifyFolderName(year.name);
              const label = displayFolderName(year.name);
              return (
                <Link
                  key={year.id}
                  href={folderHref([slug])}
                  title={label}
                  className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-[#181818] transition hover:border-[#1ed760]/40"
                >
                  <div className="relative aspect-square bg-zinc-900">
                    <Image
                      src={PLACEHOLDER.trackCover}
                      alt=""
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    {newFolderIds.has(year.id) && (
                      <span className="absolute left-2 top-2 rounded-md bg-[#1ed760] px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
                        Novo
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-bold text-white" title={label}>
                      {label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">Abrir Sources</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && !yearMode && (
        <MusicasMonthLinks folders={folders} newFolderIds={newFolderIds} variant="hero" />
      )}
    </div>
  );
}
