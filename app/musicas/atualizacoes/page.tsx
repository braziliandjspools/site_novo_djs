"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Loader2, Music } from "lucide-react";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  displayFolderName,
  folderHref,
  parseMonthStatus,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import { MusicasPageHeader } from "../MusicasShell";
import { useMusicasSession } from "../components/MusicasSessionContext";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { monthsReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";

function statusClass(status: ReturnType<typeof parseMonthStatus>["status"]) {
  if (status === "completo") return "bg-[#1ed760]/15 text-[#1ed760]";
  if (status === "em-atualizacao") return "bg-amber-500/15 text-amber-400";
  if (status === "em-breve") return "bg-zinc-700/50 text-zinc-400";
  return "bg-zinc-800 text-zinc-500";
}

const MONTH_GRADIENTS = [
  "from-emerald-700 to-[#121212]",
  "from-blue-800 to-[#121212]",
  "from-violet-800 to-[#121212]",
  "from-rose-800 to-[#121212]",
  "from-amber-800 to-[#121212]",
  "from-cyan-800 to-[#121212]",
];

function monthGradient(index: number) {
  return MONTH_GRADIENTS[index % MONTH_GRADIENTS.length];
}

export default function AtualizacoesPage() {
  const { authenticated, hasVip } = useMusicasSession();
  const [folders, setFolders] = useState<VipMusicFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/musicas/tree", { cache: "no-store" })
      .then((res) => res.json())
      .then((treeData) => {
        setFolders((treeData as { folders?: VipMusicFolder[] }).folders ?? []);
        if ((treeData as { error?: string }).error) {
          setError((treeData as { error?: string }).error ?? null);
        }
      })
      .catch(() => setError("Não foi possível carregar as atualizações."))
      .finally(() => setLoading(false));
  }, []);

  const folderIds = folders.map((folder) => folder.id);
  const newFolderIds = useNewFolderHighlights(monthsReadKey(), folderIds);

  return (
    <div>
      <MusicasPageHeader
        title="Atualizações"
        subtitle="Packs 2026 — meses e estilos sincronizados com o Google Drive."
      />

      {authenticated && !hasVip && <VipUpgradeBanner />}

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {!loading && !error && (
        <>
          <h2 className="mb-4 text-xl font-bold text-white">Packs 2026</h2>
          {folders.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum mês encontrado.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {folders.map((folder, index) => {
                const slug = slugifyFolderName(folder.name);
                const { label, status } = parseMonthStatus(folder.name);
                const isNew = newFolderIds.has(folder.id);
                return (
                  <Link
                    key={folder.id}
                    href={folderHref([slug])}
                    className={`group relative overflow-hidden rounded-md bg-gradient-to-br p-4 transition-transform hover:scale-[1.02] ${monthGradient(index)} ${
                      isNew ? "ring-2 ring-[#1ed760] ring-offset-2 ring-offset-[#121212]" : ""
                    }`}
                  >
                    {isNew && (
                      <span className="absolute right-3 top-3 rounded-full bg-[#1ed760] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                        Novo
                      </span>
                    )}
                    <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-sm bg-black/30">
                      <Music className="h-5 w-5 text-white" />
                    </div>
                    <p className="truncate text-base font-bold text-white">{displayFolderName(folder.name)}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {label ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(status)}`}>
                          {label}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">Pack mensal</span>
                      )}
                      <ChevronRight className="h-4 w-4 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
