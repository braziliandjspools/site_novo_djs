import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-[#1db954]/70 bg-[#1db954] text-[#07120a] shadow-[0_8px_24px_rgba(29,185,84,0.18)] hover:border-[#1ed760] hover:bg-[#1ed760] active:bg-[#19c653] disabled:hover:bg-[#1db954]",
  secondary:
    "border border-white/10 bg-white/[0.035] text-white hover:border-[#1db954]/40 hover:bg-[#1db954]/10 hover:text-[#1ed760] active:bg-[#1db954]/15 disabled:opacity-50",
  ghost:
    "text-white/70 hover:bg-[#1db954]/10 hover:text-[#1ed760] active:bg-[#1db954]/15 disabled:opacity-50",
  danger:
    "border border-red-400/30 bg-[#3a2020] text-[#ffb3ba] hover:bg-[#4a2828] active:bg-[#5a3030] disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-3.5 py-2 text-[0.8125rem] font-medium tracking-[0] transition-[background,border-color,color] duration-120 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
