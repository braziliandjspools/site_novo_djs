import { ExternalLink, MonitorDown } from "lucide-react";
import { Button } from "../ui/Button";
import { openBrazilianPacks } from "../../lib/open-site";

type EmptyQueueStateProps = {
  offline?: boolean;
};

export function EmptyQueueState({ offline = false }: EmptyQueueStateProps) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-[#181818]/60 px-6 py-12 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1ed760]/10 text-[#1ed760]">
        <MonitorDown className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <h2 className="text-lg font-bold text-white">
        {offline ? "Fila salva localmente" : "Sua fila está vazia"}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
        {offline
          ? "Sem internet no momento. Quando a conexão voltar, a fila será sincronizada automaticamente."
          : "Adicione músicas pelo Brazilian Packs e elas aparecerão aqui em poucos segundos."}
      </p>
      {!offline && (
        <Button className="mt-8" onClick={() => void openBrazilianPacks()}>
          <ExternalLink className="h-4 w-4" />
          Abrir Brazilian Packs
        </Button>
      )}
    </div>
  );
}
