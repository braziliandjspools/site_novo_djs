import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-white/15 bg-white text-black hover:border-[#60cdff]/50 hover:bg-[#8ad4ff] active:bg-[#60cdff] disabled:hover:bg-white",
  secondary:
    "border border-white/12 bg-transparent text-white hover:border-[#60cdff]/40 hover:bg-[#60cdff]/10 hover:text-[#8ad4ff] active:bg-[#60cdff]/15 disabled:opacity-50",
  ghost:
    "text-white/70 hover:bg-[#60cdff]/10 hover:text-[#8ad4ff] active:bg-[#60cdff]/15 disabled:opacity-50",
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
