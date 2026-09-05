import { useMemo, useState } from "react";
import { useStore } from "../store/context";
import { EmptyState, Panel } from "./primitives";
import { IconOffline, IconPulse } from "./icons";
import { fmtAmount, fmtTime, RISK_COLOR } from "../lib/ui";
import type { RiskLevel } from "../types";

interface Pt {
  x: number;
  y: number;
  score: number;
  level: RiskLevel;
  id: string;
  raw: { amount: number; currency: string; timestamp: string };
}

const W = 460;
const H = 200;
const PAD = { top: 14, right: 12, bottom: 22, left: 30 };

export function RiskActivity() {
  const { transactions, connection, select } = useStore();
  const [hover, setHover] = useState<Pt | null>(null);

  const points = useMemo<Pt[]>(() => {
    const rows = transactions
      .map((t) => ({ ...t, tms: new Date(t.timestamp).getTime() }))
      .filter((t) => !Number.isNaN(t.tms))
      .sort((a, b) => a.tms - b.tms);
    if (rows.length === 0) return [];
    const min = rows[0].tms;
    const max = rows[rows.length - 1].tms;
    const span = max - min || 1;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    return rows.map((t) => ({
      x: PAD.left + ((t.tms - min) / span) * innerW,
      y: PAD.top + (1 - t.score / 100) * innerH,
      score: t.score,
      level: t.level,
      id: t.id,
      raw: { amount: t.amount, currency: t.currency, timestamp: t.timestamp },
    }));
  }, [transactions]);

  const isOffline = connection === "offline" || connection === "error";

  return (
    <Panel title="Risk Activity" subtitle="risk score over dataset replay">
      <div className="h-[220px] p-3">
        {points.length === 0 ? (
          <EmptyState
            tone={isOffline ? "offline" : "neutral"}
            icon={isOffline ? <IconOffline size={18} /> : <IconPulse size={18} />}
            title={isOffline ? "Stream offline" : "Awaiting replay events"}
            detail="Scored events will plot here as they arrive from the engine."
          />
        ) : (
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[188px]">
              {/* gridlines + y labels */}
              {[0, 25, 50, 75, 100].map((v) => {
                const y =
                  PAD.top + (1 - v / 100) * (H - PAD.top - PAD.bottom);
                return (
                  <g key={v}>
                    <line
                      x1={PAD.left}
                      x2={W - PAD.right}
                      y1={y}
                      y2={y}
                      stroke="var(--border)"
                      strokeDasharray="2 4"
                    />
                    <text
                      x={PAD.left - 6}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="8"
                      fontFamily="var(--font-mono)"
                      fill="var(--faint-foreground)"
                    >
                      {v}
                    </text>
                  </g>
                );
              })}
              {/* high-risk threshold band */}
              <rect
                x={PAD.left}
                y={PAD.top}
                width={W - PAD.left - PAD.right}
                height={(1 - 70 / 100) * (H - PAD.top - PAD.bottom)}
                fill="var(--critical)"
                fillOpacity={0.05}
              />
              {/* points */}
              {points.map((p) => {
                const big = p.level === "critical" || p.level === "high";
                const color = RISK_COLOR[p.level];
                return (
                  <circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r={big ? 5 : 3.5}
                    fill={color}
                    fillOpacity={big ? 0.95 : 0.55}
                    stroke={color}
                    strokeOpacity={0.4}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHover(p)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => select(p.id)}
                  />
                );
              })}
            </svg>
            {hover && (
              <div
                className="pointer-events-none absolute z-10 rounded-[var(--radius)] border border-border-strong bg-surface-2 px-2.5 py-1.5 text-[11px] shadow-lg"
                style={{
                  left: `${(hover.x / W) * 100}%`,
                  top: `${(hover.y / H) * 100}%`,
                  transform: "translate(-50%, -120%)",
                }}
              >
                <div className="font-mono text-accent">{hover.id}</div>
                <div className="text-muted">
                  score{" "}
                  <span
                    className="font-semibold"
                    style={{ color: RISK_COLOR[hover.level] }}
                  >
                    {hover.score}
                  </span>{" "}
                  · {fmtAmount(hover.raw.amount, hover.raw.currency)}
                </div>
                <div className="text-faint font-mono">
                  {fmtTime(hover.raw.timestamp)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
