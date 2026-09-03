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
      className={`rounded-xl border border-white/[0.06] bg-[#1f1f1f] p-5 sm:p-6 ${className}`}
    >
      {title && <h2 className="text-sm font-bold text-white">{title}</h2>}
      {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
      <div className={title || description ? "mt-4" : undefined}>{children}</div>
    </section>
  );
}
