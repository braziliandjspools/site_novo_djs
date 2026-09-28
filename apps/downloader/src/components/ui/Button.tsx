import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-black shadow-[0_8px_20px_rgba(61,255,120,0.18)] hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:hover:bg-[var(--accent)] disabled:shadow-none",
  secondary:
    "border border-white/10 bg-white/[0.04] text-white hover:border-[var(--accent)]/50 hover:bg-[var(--accent-dim)] active:scale-[0.98] disabled:opacity-50",
  ghost:
    "text-zinc-300 hover:bg-white/[0.06] hover:text-white active:scale-[0.98] disabled:opacity-50",
  danger:
    "border border-red-500/35 bg-red-500/10 text-red-300 hover:bg-red-500/18 active:scale-[0.98] disabled:opacity-50",
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[0.84rem] font-semibold tracking-[-0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
