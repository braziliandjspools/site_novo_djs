import { CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import { openPlatform } from "../lib/open-site";
import { BP_PORTAL_URL, SITE_NAME } from "../lib/site";
import { useLocale } from "../i18n/LocaleContext";

export function PortalPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const billing = user?.billing;
  const planLabel = user?.planLabel || user?.servicesLabel || "—";
  const services = user?.services;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Panel title={t("portalTitle")} description={t("portalDescription", { site: SITE_NAME })}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-[#121212] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {t("portalAccount")}
              </p>
              <p className="mt-1.5 text-sm font-bold text-white">{user?.name ?? "—"}</p>
              <p className="mt-1 truncate text-xs text-zinc-500">{user?.email?.trim() || "—"}</p>
              {user?.whatsapp ? (
                <p className="mt-1 text-xs text-zinc-500">
                  {t("portalWhatsapp", { value: user.whatsapp })}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#121212] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {t("portalPlan")}
              </p>
              <p className="mt-1.5 text-sm font-bold text-[#1db954]">{planLabel}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {billing?.nextDueLabel
                  ? t("portalNextDue", { date: billing.nextDueLabel })
                  : t("portalNoDueDate")}
              </p>
              {user?.monthlyValueLabel ? (
                <p className="mt-1 text-xs text-zinc-500">
                  {t("portalMonthly", { value: user.monthlyValueLabel })}
                </p>
              ) : null}
            </div>
          </div>

          {services && (
            <div className="rounded-xl border border-white/[0.06] bg-[#121212] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {t("portalActiveServices")}
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
                <li className={services.poolsVip ? "text-[#1db954]" : "text-zinc-600"}>
                  {services.poolsVip ? "●" : "○"} {t("portalPoolsVip")}
                </li>
                <li className={services.allavsoft ? "text-[#1db954]" : "text-zinc-600"}>
                  {services.allavsoft ? "●" : "○"} {t("portalAllavsoft")}
                </li>
              </ul>
            </div>
          )}

          {billing?.expired ? (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {t("portalExpiredNotice")}
            </p>
          ) : billing?.expiringSoon ? (
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {t("portalExpiringNotice", {
                days: billing.daysUntilDue ?? 0,
                date: billing.nextDueLabel ?? "—",
              })}
            </p>
          ) : (
            <p className="rounded-xl border border-[#1db954]/20 bg-[#1db954]/10 px-4 py-3 text-sm text-[#1db954]">
              {t("portalOkNotice")}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void openPlatform(BP_PORTAL_URL)}>
              <ExternalLink className="h-4 w-4" />
              {t("portalOpenRenew")}
            </Button>
          </div>

          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <CreditCard className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1db954]" />
              {t("portalPaymentHint")}
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1db954]" />
              {t("portalServicesHint")}
            </li>
          </ul>
        </div>
      </Panel>
    </div>
  );
}
