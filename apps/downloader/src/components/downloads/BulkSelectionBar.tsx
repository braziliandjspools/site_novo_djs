import { CheckSquare, Pause, Play, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "../ui/Button";

type BulkSelectionBarProps = {
  selectedCount: number;
  visibleCount: number;
  allVisibleSelected: boolean;
  busy?: boolean;
  canPause?: boolean;
  canResume?: boolean;
  canCancel?: boolean;
  canRetry?: boolean;
  canDismiss?: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onDismiss: () => void;
};

export function BulkSelectionBar({
  selectedCount,
  visibleCount,
  allVisibleSelected,
  busy = false,
  canPause = false,
  canResume = false,
  canCancel = false,
  canRetry = false,
  canDismiss = false,
  onSelectAll,
  onClearSelection,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onDismiss,
}: BulkSelectionBarProps) {
  if (visibleCount <= 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-3 py-2.5">
      <p className="mr-1 text-xs font-semibold tabular-nums text-zinc-300">
        {selectedCount > 0
          ? `${selectedCount} selecionado${selectedCount === 1 ? "" : "s"}`
          : `${visibleCount} item(ns)`}
      </p>

      <Button
        variant="ghost"
        className="!h-8 !px-2.5 !text-[11px] text-zinc-400"
        disabled={busy}
        onClick={allVisibleSelected ? onClearSelection : onSelectAll}
      >
        <CheckSquare className="h-3.5 w-3.5" />
        {allVisibleSelected ? "Limpar seleção" : "Selecionar tudo"}
      </Button>

      {selectedCount > 0 && canPause && (
        <Button
          variant="secondary"
          className="!h-8 !px-3 !text-[11px]"
          disabled={busy}
          onClick={onPause}
        >
          <Pause className="h-3.5 w-3.5" />
          Pausar
        </Button>
      )}

      {selectedCount > 0 && canResume && (
        <Button
          variant="secondary"
          className="!h-8 !px-3 !text-[11px]"
          disabled={busy}
          onClick={onResume}
        >
          <Play className="h-3.5 w-3.5" />
          Retomar
        </Button>
      )}

      {selectedCount > 0 && canCancel && (
        <Button
          variant="ghost"
          className="!h-8 !px-3 !text-[11px] text-zinc-400"
          disabled={busy}
          onClick={onCancel}
        >
          <X className="h-3.5 w-3.5" />
          Cancelar
        </Button>
      )}

      {selectedCount > 0 && canRetry && (
        <Button
          variant="secondary"
          className="!h-8 !px-3 !text-[11px]"
          disabled={busy}
          onClick={onRetry}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Tentar novamente
        </Button>
      )}

      {selectedCount > 0 && canDismiss && (
        <Button
          variant="ghost"
          className="!h-8 !px-3 !text-[11px] text-red-400"
          disabled={busy}
          onClick={onDismiss}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remover do histórico
        </Button>
      )}
    </div>
  );
}
