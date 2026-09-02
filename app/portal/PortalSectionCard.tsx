import type { ReactNode } from "react";

const THEMES = {
  green: {
    border: "border-[#009739]/50",
    bg: "bg-[#009739]/10",
    title: "text-[#00B347]",
  },
  purple: {
    border: "border-purple-500/50",
    bg: "bg-purple-500/10",
    title: "text-white",
  },
  blue: {
    border: "border-[#002776]/60",
    bg: "bg-[#002776]/15",
    title: "text-white",
  },
  yellow: {
    border: "border-[#FFDF00]/40",
    bg: "bg-[#FFDF00]/10",
    title: "text-[#FFDF00]",
  },
  amber: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    title: "text-amber-300",
  },
} as const;

type PortalSectionCardProps = {
  color: keyof typeof THEMES;
  icon?: ReactNode;
  title: string;
  accentTitle?: boolean;
  children: ReactNode;
  className?: string;
};

export function PortalSectionCard({
  color,
  icon,
  title,
  accentTitle = false,
  children,
  className = "",
}: PortalSectionCardProps) {
  const theme = THEMES[color];

  return (
    <section className={`rounded-2xl border ${theme.border} ${theme.bg} p-6 md:p-8 ${className}`}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className={`font-display text-xl ${accentTitle ? theme.title : "text-white"}`}>{title}</h3>
      </div>
      {children}
    </section>
  );
}
