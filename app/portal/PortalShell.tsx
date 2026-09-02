"use client";

import Link from "next/link";
import {
  CreditCard,
  HeadphonesIcon,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Music2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

export type PortalView =
  | "dashboard"
  | "services"
  | "service-pools"
  | "service-deemix"
  | "service-allavsoft"
  | "service-music-producer"
  | "account"
  | "support";

type PortalShellProps = {
  userName: string;
  activeView: PortalView;
  onNavigate: (view: PortalView) => void;
  onLogout: () => void;
  hasPools: boolean;
  hasDeemix: boolean;
  hasAllavsoft: boolean;
  children: React.ReactNode;
};

const navItems: { id: PortalView; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Painel", icon: Home },
  { id: "services", label: "Meus Serviços", icon: LayoutGrid },
  { id: "service-music-producer", label: "Produções", icon: Music2 },
  { id: "account", label: "Minha Conta", icon: User },
  { id: "support", label: "Suporte", icon: HeadphonesIcon },
];

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
  sub = false,
}: {
  active: boolean;
  onClick: () => void;
  icon?: typeof Home;
  label: string;
  sub?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-center gap-3 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all ${
        sub ? "px-3 py-2 text-[11px]" : "px-3 py-2.5 text-xs"
      } ${
        active
          ? "bg-[#009739]/20 text-[#00ff9d] shadow-[inset_3px_0_0_0_#00ff9d]"
          : "text-zinc-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      {label}
    </button>
  );
}

export function PortalShell({
  userName,
  activeView,
  onNavigate,
  onLogout,
  hasPools,
  hasDeemix,
  hasAllavsoft,
  children,
}: PortalShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const firstName = userName.split(" ")[0];

  const serviceViews: PortalView[] = [];
  if (hasPools) serviceViews.push("service-pools");
  if (hasDeemix) serviceViews.push("service-deemix");
  if (hasAllavsoft) serviceViews.push("service-allavsoft");

  const isServiceDetail = serviceViews.includes(activeView);

  return (
    <div className="flex min-h-screen bg-[#121212] text-zinc-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-800 bg-[#0a0a0a] transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-zinc-800 px-5 py-5">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#009739] via-[#00ff9d] to-[#FFDF00]" />
          <Link href="/" className="mt-3 block font-display text-xl tracking-wide text-white">
            BRAZILIAN<span className="text-[#00ff9d]"> PACKS</span>
          </Link>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Client Area</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ id, label, icon }) => (
            <NavButton
              key={id}
              active={activeView === id || (id === "services" && isServiceDetail)}
              onClick={() => {
                onNavigate(id);
                setMobileOpen(false);
              }}
              icon={icon}
              label={label}
            />
          ))}

          {isServiceDetail && (
            <div className="mt-3 border-t border-zinc-800 pt-3">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">Serviço</p>
              {hasPools && (
                <NavButton
                  active={activeView === "service-pools"}
                  onClick={() => onNavigate("service-pools")}
                  label="Pools VIP"
                  sub
                />
              )}
              {hasDeemix && (
                <NavButton
                  active={activeView === "service-deemix"}
                  onClick={() => onNavigate("service-deemix")}
                  label="Deemix"
                  sub
                />
              )}
              {hasAllavsoft && (
                <NavButton
                  active={activeView === "service-allavsoft"}
                  onClick={() => onNavigate("service-allavsoft")}
                  label="Allavsoft"
                  sub
                />
              )}
            </div>
          )}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <button
            type="button"
            onClick={() => void onLogout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/80 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-[#181818]/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-white">
                  Olá, <span className="text-[#00ff9d]">{firstName}</span>
                </p>
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">Área do cliente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded border border-[#009739]/40 bg-[#009739]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00ff9d] sm:inline">
                Online
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#009739] to-[#00ff9d] text-sm font-black text-black">
                {firstName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-[#121212] p-4 sm:p-6 lg:p-8">{children}</main>

        <footer className="border-t border-zinc-800 bg-[#0a0a0a] px-6 py-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
          Brazilian Packs · Client Area
        </footer>
      </div>
    </div>
  );
}

export function PortalCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-zinc-800 bg-[#1a1a1a] shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${className}`}
    >
      {title && (
        <div className="border-b border-zinc-800 bg-[#222] px-5 py-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-300">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function PortalPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl tracking-wide text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      <div className="mt-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-[#009739] to-[#FFDF00]" />
    </div>
  );
}

export function PortalBadge({
  children,
  variant = "green",
}: {
  children: React.ReactNode;
  variant?: "green" | "amber" | "red";
}) {
  const styles = {
    green: "border-[#009739]/40 bg-[#009739]/15 text-[#00ff9d]",
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    red: "border-red-500/40 bg-red-500/10 text-red-400",
  };
  return (
    <span
      className={`inline-flex rounded border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="group rounded-xl border border-zinc-800 bg-[#1a1a1a] p-5 transition-colors hover:border-[#009739]/40 hover:bg-[#222]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#009739]/15 ring-1 ring-[#009739]/30 transition-all group-hover:bg-[#009739]/25">
          <Icon className="h-5 w-5 text-[#00ff9d]" />
        </div>
      </div>
    </div>
  );
}

export function PortalButton({
  children,
  onClick,
  href,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "accent" | "ghost";
}) {
  const className = {
    primary:
      "inline-flex items-center gap-2 rounded-lg bg-[#00ff9d] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#00e68a]",
    accent:
      "inline-flex items-center gap-2 rounded-lg bg-[#009739] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#00B347]",
    ghost:
      "inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-600 hover:text-white",
  }[variant];

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
