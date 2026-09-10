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
      className={`rounded-2xl border border-white/[0.06] bg-[var(--bg-card)] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.22)] sm:p-6 ${className}`}
    >
      {title && (
        <h2 className="font-display text-base font-extrabold tracking-tight text-white">{title}</h2>
      )}
      {description && (
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{description}</p>
      )}
      <div className={title || description ? "mt-4" : undefined}>{children}</div>
    </section>
  );
}
