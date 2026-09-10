import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1ed760] text-black shadow-[0_6px_18px_rgba(30,215,96,0.22)] hover:bg-[#3dff86] active:scale-[0.98] disabled:hover:bg-[#1ed760] disabled:shadow-none",
  secondary:
    "border border-[#1ed760]/35 bg-[#1ed760]/10 text-[#1ed760] hover:bg-[#1ed760]/16 hover:border-[#1ed760]/55 active:scale-[0.98] disabled:opacity-50",
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[0.84rem] font-extrabold tracking-[-0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
