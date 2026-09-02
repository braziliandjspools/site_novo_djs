import { displayFolderName, parseMonthStatus, type MonthStatus } from "../../lib/vip-music-slugs";

export function monthStatusClass(status: MonthStatus) {
  if (status === "completo") return "bg-[#1ed760]/15 text-[#1ed760]";
  if (status === "em-atualizacao") return "bg-amber-500/15 text-amber-400";
  if (status === "em-breve") return "bg-zinc-700/50 text-zinc-400";
  return "bg-zinc-800 text-zinc-500";
}

type AtualizacoesMonthHeroProps = {
  folderName: string;
  styleCount: number;
  hasVip: boolean;
};

export function AtualizacoesMonthHero({ folderName, styleCount, hasVip }: AtualizacoesMonthHeroProps) {
  const title = displayFolderName(folderName);
  const { label, status } = parseMonthStatus(folderName);

  return (
    <section className="relative mb-8 w-full overflow-hidden rounded-md bg-gradient-to-br from-[#1a3264] via-[#181818] to-[#121212]">
      <div className="relative flex flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#1ed760]">Pack do mês</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{title}</h1>
            {label && (
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${monthStatusClass(status)}`}>
                {label}
              </span>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Estilos organizados por pasta. Abra, ouça e baixe as faixas com um clique.
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <span className="rounded-full bg-black/30 px-4 py-2 text-xs font-semibold text-zinc-200">
            {styleCount} {styleCount === 1 ? "estilo" : "estilos"}
          </span>
          <span
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              hasVip ? "bg-[#1ed760]/15 text-[#1ed760]" : "bg-zinc-800 text-zinc-500"
            }`}
          >
            {hasVip ? "Premium ativo" : "Visualização"}
          </span>
        </div>
      </div>
    </section>
  );
}
