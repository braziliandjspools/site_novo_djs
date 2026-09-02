import type { LucideIcon } from "lucide-react";
import { CARD_COLORS, type CardColor } from "../lib/theme";

type IconBoxProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: CardColor;
  className?: string;
};

export function IconBox({ icon: Icon, title, description, color = "green", className = "" }: IconBoxProps) {
  const c = CARD_COLORS[color];

  return (
    <div
      className={`group flex flex-col items-center rounded-2xl border ${c.border} bg-[#282828] p-5 text-center transition-all duration-300 sm:p-6 md:items-start md:text-left ${c.hoverBorder} hover:-translate-y-1 hover:bg-[#333333] ${className}`}
    >
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${c.iconBg} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className={`h-7 w-7 ${c.text}`} />
      </div>
      <h3 className="font-display text-lg tracking-wide text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}
