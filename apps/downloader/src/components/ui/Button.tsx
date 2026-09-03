import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#1db954] text-black hover:bg-[#1ed760] disabled:hover:bg-[#1db954]",
  secondary:
    "border border-[#1db954]/45 bg-[#1db954]/12 text-[#1db954] hover:bg-[#1db954]/20 hover:border-[#1db954]/70 disabled:opacity-50",
  ghost: "text-zinc-300 hover:bg-white/5 hover:text-white disabled:opacity-50",
  danger: "border border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25 disabled:opacity-50",
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
