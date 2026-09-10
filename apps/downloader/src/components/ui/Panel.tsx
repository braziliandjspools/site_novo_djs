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
      className={`rounded-2xl border border-white/[0.06] bg-[var(--bg-card)] p-4 shadow-[0_8px_28px_rgba(0,0,0,0.22)] sm:p-5 ${className}`}
    >
      {title && (
        <h2 className="font-display text-[0.8rem] font-extrabold tracking-tight text-white">{title}</h2>
      )}
      {description && (
        <p className="mt-1 text-[0.7rem] leading-relaxed text-zinc-500">{description}</p>
      )}
      <div className={title || description ? "mt-3" : undefined}>{children}</div>
    </section>
  );
}
