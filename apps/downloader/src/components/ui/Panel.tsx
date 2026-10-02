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
      className={`rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--bg-card)] p-4 sm:p-5 ${className}`}
    >
      {title && (
        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-white">{title}</h2>
      )}
      {description && (
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--text-subtle)]">{description}</p>
      )}
      <div className={title || description ? "mt-3.5" : undefined}>{children}</div>
    </section>
  );
}
