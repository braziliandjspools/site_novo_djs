"use client";

export type ServiceDraft = {
  poolsVip: boolean;
  deemix: boolean;
  allavsoft: boolean;
};

export const emptyServices = (): ServiceDraft => ({
  poolsVip: false,
  deemix: false,
  allavsoft: false,
});

type ServiceSelectorProps = {
  value: ServiceDraft;
  onChange: (value: ServiceDraft) => void;
  compact?: boolean;
};

const ITEMS = [
  { key: "poolsVip" as const, label: "Pools VIP" },
  { key: "deemix" as const, label: "Deemix" },
  { key: "allavsoft" as const, label: "Allavsoft" },
];

export function ServiceSelector({ value, onChange, compact = false }: ServiceSelectorProps) {
  return (
    <div className={compact ? "flex flex-col gap-1.5" : "flex flex-wrap gap-3"}>
      {ITEMS.map(({ key, label }) => (
        <label
          key={key}
          className={`inline-flex items-center gap-2 ${compact ? "text-[11px] text-zinc-300" : "text-xs text-zinc-300"}`}
        >
          <input
            type="checkbox"
            checked={value[key]}
            onChange={(event) => onChange({ ...value, [key]: event.target.checked })}
            className="h-3.5 w-3.5 accent-[#009739]"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

export function servicesSummary(value: ServiceDraft) {
  const labels = ITEMS.filter((item) => value[item.key]).map((item) => item.label);
  return labels.length ? labels.join(" · ") : "Nenhum";
}
