import { useStore } from "../store/context";
import { fmtNum } from "../lib/ui";
import {
  IconActivity,
  IconAlert,
  IconClock,
  IconGauge,
  IconPulse,
  IconSearch,
} from "./icons";
import type { ReactNode } from "react";

function Kpi({
  label,
  value,
  hint,
  icon,
  tone,
  hasData,
}: {
  label: string;
  value: string | null;
  hint?: string;
  icon: ReactNode;
  tone?: string;
  hasData: boolean;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 p-4 border border-border bg-surface-1 rounded-[var(--radius)] min-h-[104px] hover:border-border-strong transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted font-mono">
          {label}
        </span>
        <span className="text-faint" style={{ color: tone }}>
          {icon}
        </span>
      </div>
      {hasData && value !== null ? (
        <div>
          <div
            className="text-3xl font-semibold tabular-nums tracking-tight"
            style={{ color: tone }}
          >
            {value}
          </div>
          {hint && <div className="text-[10px] text-faint mt-1 font-mono">{hint}</div>}
        </div>
      ) : (
        <div className="text-xs text-faint leading-snug">
          Waiting for dataset
          <br />
          replay stream
        </div>
      )}
    </div>
  );
}

export function KpiRow() {
  const { metrics, hasData } = useStore();
  const m = metrics;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <Kpi
        label="Events Received"
        value={fmtNum(m.eventsReceived)}
        hint="session stream"
        icon={<IconActivity />}
        hasData={hasData}
      />
      <Kpi
        label="Transactions Analyzed"
        value={fmtNum(m.transactionsAnalyzed)}
        hint="scored by engine"
        icon={<IconPulse />}
        hasData={hasData}
      />
      <Kpi
        label="High-Risk Events"
        value={fmtNum(m.highRiskEvents)}
        hint="high + critical"
        icon={<IconGauge />}
        tone={m.highRiskEvents > 0 ? "var(--high)" : undefined}
        hasData={hasData}
      />
      <Kpi
        label="Critical Alerts"
        value={fmtNum(m.criticalAlerts)}
        hint="require review"
        icon={<IconAlert />}
        tone={m.criticalAlerts > 0 ? "var(--critical)" : undefined}
        hasData={hasData}
      />
      <Kpi
        label="Active Investigations"
        value={fmtNum(m.activeInvestigations)}
        hint="in progress"
        icon={<IconSearch />}
        tone={m.activeInvestigations > 0 ? "var(--investigating)" : undefined}
        hasData={hasData}
      />
      <Kpi
        label="Detection Latency"
        value={m.detectionLatencyMs !== null ? `${m.detectionLatencyMs}ms` : null}
        hint="engine → alert"
        icon={<IconClock />}
        hasData={hasData && m.detectionLatencyMs !== null}
      />
    </div>
  );
}
