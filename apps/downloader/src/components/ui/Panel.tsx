import type { ReactNode } from "react";

type PanelProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Panel({ title, description, children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#1e1e1e] to-[#171717] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] sm:p-6 ${className}`}
    >
      {title && (
        <h2 className="font-display text-sm font-bold tracking-tight text-white">{title}</h2>
      )}
      {description && <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{description}</p>}
      <div className={title || description ? "mt-4" : undefined}>{children}</div>
    </section>
  );
}
