import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-white/12 bg-[var(--bg-control)] text-white hover:bg-[var(--bg-control-hover)] active:bg-[var(--bg-control-active)] disabled:hover:bg-[var(--bg-control)]",
  secondary:
    "border border-white/10 bg-transparent text-white hover:bg-white/[0.06] active:bg-white/[0.1] disabled:opacity-50",
  ghost:
    "text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-white active:bg-white/[0.1] disabled:opacity-50",
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
