"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { createPortal } from "react-dom";

export type CollectionMenuAction = {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
};

type CollectionContextMenuProps = {
  actions: CollectionMenuAction[];
  /** Acessibilidade */
  label?: string;
  className?: string;
  buttonClassName?: string;
  /** Conteúdo customizado do botão (padrão: …) */
  trigger?: ReactNode;
};

/**
 * Menu contextual: dropdown no desktop, bottom sheet no mobile.
 * Nunca sai da tela; fecha ao tocar fora / Escape.
 */
export function CollectionContextMenu({
  actions,
  label = "Mais opções",
  className = "",
  buttonClassName = "",
  trigger,
}: CollectionContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        const sheet = document.getElementById(menuId);
        if (sheet && sheet.contains(event.target as Node)) return;
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isMobile, menuId]);

  function runAction(action: CollectionMenuAction) {
    if (action.disabled) return;
    setOpen(false);
    action.onClick();
  }

  if (actions.length === 0) return null;

  const menuItems = (
    <div className="py-1">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            disabled={action.disabled}
            onClick={() => runAction(action)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 md:py-2.5"
          >
            {Icon ? <Icon className="h-4 w-4 flex-shrink-0 text-zinc-500" /> : null}
            <span className="min-w-0 flex-1 break-words">{action.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={`inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white active:scale-95 ${buttonClassName}`}
      >
        {trigger ?? <MoreHorizontal className="h-5 w-5" />}
      </button>

      {open && !isMobile ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-[100] max-h-[min(70vh,24rem)] w-[min(calc(100vw-1.5rem),16.5rem)] overflow-y-auto overflow-x-hidden rounded-xl border border-white/10 bg-[#181818] py-1 shadow-2xl shadow-black/60"
        >
          {menuItems}
        </div>
      ) : null}

      {open &&
        isMobile &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[10000]" role="presentation">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
            <div
              id={menuId}
              role="menu"
              aria-label={label}
              className="absolute inset-x-0 bottom-0 max-h-[min(78vh,28rem)] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#181818] pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
            >
              <div className="flex justify-center pt-3 pb-2">
                <span className="h-1 w-10 rounded-full bg-zinc-600" />
              </div>
              <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                {label}
              </p>
              {menuItems}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
