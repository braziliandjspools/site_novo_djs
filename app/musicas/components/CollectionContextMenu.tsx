"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
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
  label?: string;
  className?: string;
  buttonClassName?: string;
  trigger?: ReactNode;
};

type MenuCoords = {
  top: number;
  left: number;
  openUp: boolean;
};

/**
 * Menu contextual: portal fixed no desktop (não é cortado por overflow do hero/lista),
 * bottom sheet no mobile.
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
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    if (!open || isMobile) {
      setCoords(null);
      return;
    }

    function place() {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuWidth = menu?.offsetWidth || 264;
      const menuHeight = menu?.offsetHeight || 240;
      const gap = 6;
      const margin = 12;

      let left = rect.right - menuWidth;
      left = Math.max(margin, Math.min(left, window.innerWidth - menuWidth - margin));

      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      const top = openUp
        ? Math.max(margin, rect.top - gap - menuHeight)
        : Math.min(rect.bottom + gap, window.innerHeight - margin - Math.min(menuHeight, spaceBelow));

      setCoords({ top, left, openUp });
    }

    place();
    // Reposition after first paint when menu size is known
    const raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, isMobile, actions.length]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      const sheet = document.getElementById(menuId);
      if (sheet?.contains(target)) return;
      setOpen(false);
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
        ref={buttonRef}
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

      {open &&
        !isMobile &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            style={
              coords
                ? { position: "fixed", top: coords.top, left: coords.left, zIndex: 10050 }
                : { position: "fixed", top: -9999, left: -9999, zIndex: 10050, visibility: "hidden" }
            }
            className="max-h-[min(70vh,24rem)] w-[min(calc(100vw-1.5rem),16.5rem)] overflow-y-auto overflow-x-hidden rounded-xl border border-white/10 bg-[#181818] py-1 shadow-2xl shadow-black/70"
          >
            {menuItems}
          </div>,
          document.body,
        )}

      {open &&
        isMobile &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[10050]" role="presentation">
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
