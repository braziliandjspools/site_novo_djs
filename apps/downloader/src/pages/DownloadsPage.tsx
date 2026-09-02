import { ExternalLink, WifiOff } from "lucide-react";

import { useDownloadManager } from "../context/DownloadManagerContext";

import { Button } from "../components/ui/Button";

import { openBrazilianPacks } from "../lib/open-site";

import { EmptyQueueState } from "../components/downloads/EmptyQueueState";

import { JobRow } from "../components/downloads/JobRow";



export function DownloadsPage() {

  const { jobs, connectionState, workerError, pendingCount, activeJobId } = useDownloadManager();

  const isOffline = connectionState === "offline";



  return (

    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1ed760]">Fila</p>

          <p className="mt-1 text-sm text-zinc-500">

            {pendingCount === 0

              ? "Nenhum item aguardando download"

              : `${pendingCount} item(ns) na fila`}

          </p>

        </div>

        <Button variant="secondary" className="text-xs sm:text-sm" onClick={() => void openBrazilianPacks()}>

          <ExternalLink className="h-4 w-4" />

          Abrir Brazilian Packs

        </Button>

      </div>



      {isOffline && (

        <p className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">

          <WifiOff className="h-4 w-4 flex-shrink-0" />

          Sem conexão

        </p>

      )}



      {workerError && !isOffline && (

        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{workerError}</p>

      )}



      {jobs.length === 0 ? (

        <EmptyQueueState offline={isOffline} />

      ) : (

        <div className="space-y-2">

          {jobs.map((job) => (

            <JobRow key={job.id} job={job} isActive={activeJobId === job.id} />

          ))}

        </div>

      )}

    </div>

  );

}

