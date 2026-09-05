import { useMemo, useState } from "react";
import { useStore } from "../store/context";
import { Btn, EmptyState, Panel, RiskBadge, StatusChip } from "./primitives";
import { IconInbox, IconOffline, IconRetry, IconSearch } from "./icons";
import { alertService } from "../services/domainServices";
import { cx, fmtDateTime } from "../lib/ui";
import type { Alert, CaseStatus, RiskLevel } from "../types";

const FILTERS: Array<{ id: string; label: string; match: (a: Alert) => boolean }> =
  [
    { id: "all", label: "All", match: () => true },
    { id: "critical", label: "Critical", match: (a) => a.severity === "critical" },
    { id: "high", label: "High", match: (a) => a.severity === "high" },
    { id: "medium", label: "Medium", match: (a) => a.severity === "medium" },
    {
      id: "investigating",
      label: "Investigating",
      match: (a) => a.status === "investigating",
    },
    { id: "resolved", label: "Resolved", match: (a) => a.status === "resolved" },
  ];

export function AlertCenter() {
  const { alerts, connection, configured, updateAlert, select } = useStore();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) ?? FILTERS[0];
    const q = query.trim().toLowerCase();
    return alerts
      .filter(f.match)
      .filter((a) =>
        q ? [a.id, a.entity, a.trigger].join(" ").toLowerCase().includes(q) : true,
      );
  }, [alerts, filter, query]);

  const isOffline = connection === "offline" || connection === "error";

  async function act(alert: Alert, status: CaseStatus, assignee?: string) {
    // Optimistic update; persists to the backend when one is connected.
    const next = { ...alert, status, assignee: assignee ?? alert.assignee };
    updateAlert(next);
    try {
      await alertService.updateStatus(alert.id, status, assignee);
    } catch {
      /* offline: local state stands until reconnect */
    }
  }

  return (
    <Panel
      title="Alert Center"
      subtitle={alerts.length > 0 ? `${rows.length} of ${alerts.length} alerts` : undefined}
      className="h-full"
      bodyClassName="flex flex-col min-h-0"
      actions={
        <div className="relative">
          <IconSearch
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alert, entity, trigger…"
            className="w-64 bg-surface-0 border border-border rounded-[var(--radius)] pl-8 pr-3 py-1.5 text-xs placeholder:text-faint focus:outline-none focus:border-accent/60 font-mono"
          />
        </div>
      }
    >
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cx(
              "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0",
              filter === f.id
                ? "bg-surface-2 text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {rows.length === 0 ? (
          isOffline ? (
            <EmptyState
              tone="offline"
              icon={<IconOffline size={18} />}
              title="No alerts available"
              detail="Alert data is served from the backend. Reconnect to review the alert queue."
            />
          ) : (
            <EmptyState
              icon={<IconInbox size={18} />}
              title={alerts.length === 0 ? "No alerts raised" : "No alerts match this filter"}
              detail={
                alerts.length === 0
                  ? configured
                    ? "Connected. The engine has not raised any alerts yet."
                    : "No data source configured. Alerts appear once the backend is connected."
                  : "Try a different filter or search."
              }
            />
          )
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface-1">
              <tr className="text-[10px] uppercase tracking-wider text-faint font-mono">
                {["Alert", "Created", "Severity", "Entity", "Trigger", "Assignee", "Status", "Actions"].map(
                  (h) => (
                    <th key={h} className="text-left font-medium px-3 py-2 border-b border-border whitespace-nowrap">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-border/60 hover:bg-surface-2/50">
                  <td className="px-3 py-2.5 font-mono text-accent whitespace-nowrap">{a.id}</td>
                  <td className="px-3 py-2.5 font-mono text-faint whitespace-nowrap tabular-nums">
                    {fmtDateTime(a.createdAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    <RiskBadge level={a.severity as RiskLevel} score={a.score} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{a.entity}</td>
                  <td className="px-3 py-2.5 text-muted max-w-[220px] truncate">{a.trigger}</td>
                  <td className="px-3 py-2.5 text-muted whitespace-nowrap">
                    {a.assignee ?? <span className="text-faint">Unassigned</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusChip status={a.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Btn variant="outline" onClick={() => select(a.transactionId)}>
                        Investigate
                      </Btn>
                      {a.status !== "investigating" && (
                        <Btn
                          variant="ghost"
                          onClick={() => act(a, "investigating", "A. Nandakumar")}
                        >
                          Assign
                        </Btn>
                      )}
                      {a.status !== "escalated" && (
                        <Btn variant="ghost" onClick={() => act(a, "escalated")}>
                          Escalate
                        </Btn>
                      )}
                      {a.status !== "resolved" && (
                        <Btn variant="ghost" onClick={() => act(a, "resolved")}>
                          Resolve
                        </Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  );
}
