import { useMemo } from "react";
import { useStore } from "../store/context";
import { EmptyState, Panel } from "./primitives";
import { IconGauge } from "./icons";
import { cx, RISK_COLOR, RISK_ORDER } from "../lib/ui";
import type { RiskLevel } from "../types";

const MIN_FOR_ANALYSIS = 1;

export function RiskDistribution() {
  const { transactions } = useStore();

  const dist = useMemo(() => {
    const counts = Object.fromEntries(
      RISK_ORDER.map((l) => [l, 0]),
    ) as Record<RiskLevel, number>;
    for (const t of transactions) counts[t.level] += 1;
    const total = transactions.length;
    return { counts, total };
  }, [transactions]);

  return (
    <Panel title="Threat / Risk Distribution" subtitle="derived from replayed events">
      <div className="p-4">
        {dist.total < MIN_FOR_ANALYSIS ? (
          <EmptyState
            icon={<IconGauge size={18} />}
            title="Waiting for replay data"
            detail="Distribution is computed from actual replayed events as they arrive from the engine."
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-0">
              {RISK_ORDER.map((l) =>
                dist.counts[l] > 0 ? (
                  <div
                    key={l}
                    style={{
                      width: `${(dist.counts[l] / dist.total) * 100}%`,
                      background: RISK_COLOR[l],
                    }}
                    title={`${l}: ${dist.counts[l]}`}
                  />
                ) : null,
              )}
            </div>
            <ul className="flex flex-col gap-2">
              {RISK_ORDER.map((l) => {
                const c = dist.counts[l];
                const pct = dist.total ? (c / dist.total) * 100 : 0;
                return (
                  <li key={l} className="flex items-center gap-3 text-xs">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ background: RISK_COLOR[l] }}
                    />
                    <span
                      className={cx(
                        "w-16 capitalize",
                        c > 0 ? "text-foreground" : "text-faint",
                      )}
                    >
                      {l}
                    </span>
                    <div className="flex-1 h-1 rounded-full bg-surface-0 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: RISK_COLOR[l] }}
                      />
                    </div>
                    <span className="w-8 text-right tabular-nums font-mono text-muted">
                      {c}
                    </span>
                    <span className="w-10 text-right tabular-nums font-mono text-faint">
                      {pct.toFixed(0)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}
