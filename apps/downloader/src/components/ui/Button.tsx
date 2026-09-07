import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1db954] text-black shadow-[0_8px_24px_rgba(29,185,84,0.28)] hover:bg-[#1ed760] hover:shadow-[0_10px_28px_rgba(29,185,84,0.35)] active:scale-[0.98] disabled:hover:bg-[#1db954] disabled:shadow-none",
  secondary:
    "border border-[#1db954]/40 bg-[#1db954]/10 text-[#1db954] hover:bg-[#1db954]/18 hover:border-[#1db954]/65 active:scale-[0.98] disabled:opacity-50",
  ghost:
    "text-zinc-300 hover:bg-white/[0.06] hover:text-white active:scale-[0.98] disabled:opacity-50",
  danger:
    "border border-red-500/40 bg-red-500/12 text-red-300 hover:bg-red-500/22 active:scale-[0.98] disabled:opacity-50",
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
