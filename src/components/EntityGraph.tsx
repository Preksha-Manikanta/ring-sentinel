import { useMemo, useState } from "react";
import { EmptyState } from "./primitives";
import { IconGraph } from "./icons";
import { RISK_COLOR } from "../lib/ui";
import type { EntityGraph as Graph, EntityKind } from "../types";

const KIND_META: Record<EntityKind, { label: string; color: string }> = {
  customer: { label: "CUS", color: "var(--low)" },
  account: { label: "ACC", color: "var(--accent)" },
  device: { label: "DEV", color: "var(--high)" },
  merchant: { label: "MER", color: "var(--investigating)" },
  endpoint: { label: "END", color: "var(--normal)" },
  transaction: { label: "TXN", color: "var(--medium)" },
};

/** Deterministic radial layout so the same graph always renders identically. */
function layout(graph: Graph, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 44;
  const n = graph.nodes.length;
  const pos = new Map<string, { x: number; y: number }>();
  graph.nodes.forEach((node, i) => {
    if (n === 1) {
      pos.set(node.id, { x: cx, y: cy });
      return;
    }
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    pos.set(node.id, {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  });
  return pos;
}

export function EntityGraph({ graph }: { graph: Graph | null }) {
  const [selected, setSelected] = useState<string | null>(null);
  const W = 460;
  const H = 300;
  const pos = useMemo(
    () => (graph ? layout(graph, W, H) : new Map()),
    [graph],
  );

  if (!graph || graph.nodes.length === 0) {
    return (
      <EmptyState
        icon={<IconGraph size={18} />}
        title="No relationship data"
        detail="Entity relationships are populated from the backend. Connect a data source to map connected entities."
      />
    );
  }

  const neighbors = new Set<string>();
  const sharedForSelected = new Set<string>();
  if (selected) {
    graph.edges.forEach((e) => {
      const touches = e.source === selected || e.target === selected;
      if (e.source === selected) neighbors.add(e.target);
      if (e.target === selected) neighbors.add(e.source);
      if (touches) (e.sharedAttributes ?? []).forEach((a) => sharedForSelected.add(a));
    });
  }

  const dim = (id: string) =>
    selected && id !== selected && !neighbors.has(id);

  return (
    <div className="p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[300px]">
        {graph.edges.map((e, i) => {
          const a = pos.get(e.source);
          const b = pos.get(e.target);
          if (!a || !b) return null;
          const active =
            selected && (e.source === selected || e.target === selected);
          const shared = e.kind === "shared_device" || e.kind === "shared_account";
          return (
            <g key={i}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={
                  active
                    ? "var(--accent)"
                    : shared
                      ? "var(--high)"
                      : "var(--border-strong)"
                }
                strokeOpacity={
                  selected ? (active ? 0.9 : 0.15) : shared ? 0.7 : 0.5
                }
                strokeWidth={active ? 2 : 1.2}
                strokeDasharray={shared ? "4 3" : undefined}
              />
            </g>
          );
        })}
        {graph.nodes.map((node) => {
          const p = pos.get(node.id);
          if (!p) return null;
          const meta = KIND_META[node.kind];
          const color = node.risk ? RISK_COLOR[node.risk] : meta.color;
          const isSel = node.id === selected;
          return (
            <g
              key={node.id}
              transform={`translate(${p.x},${p.y})`}
              onClick={() => setSelected(isSel ? null : node.id)}
              style={{ cursor: "pointer", opacity: dim(node.id) ? 0.28 : 1 }}
            >
              <circle
                r={isSel ? 16 : 13}
                fill="var(--surface-0)"
                stroke={color}
                strokeWidth={isSel ? 2.5 : 1.6}
              />
              <text
                textAnchor="middle"
                dy="3"
                fontSize="8"
                fontFamily="var(--font-mono)"
                fill={color}
                style={{ pointerEvents: "none" }}
              >
                {meta.label}
              </text>
              <text
                textAnchor="middle"
                y={26}
                fontSize="8.5"
                fontFamily="var(--font-mono)"
                fill="var(--muted-foreground)"
                style={{ pointerEvents: "none" }}
              >
                {node.label.length > 16 ? node.label.slice(0, 15) + "…" : node.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 pt-1 text-[10px] font-mono text-faint">
        {Object.entries(KIND_META).map(([k, m]) => (
          <span key={k} className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full" style={{ background: m.color }} />
            {m.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="w-3 border-t border-dashed" style={{ borderColor: "var(--high)" }} />
          shared attribute
        </span>
      </div>
      {selected && (
        <div className="px-2 pt-2 text-[10px] font-mono text-muted">
          <span className="text-faint">{selected} · shared links: </span>
          {sharedForSelected.size > 0 ? (
            <span className="text-high">
              {Array.from(sharedForSelected).sort().join(", ")}
            </span>
          ) : (
            <span className="text-faint">none recorded</span>
          )}
        </div>
      )}
    </div>
  );
}
