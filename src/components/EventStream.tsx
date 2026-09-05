import { useMemo, useState } from "react";
import { useStore } from "../store/context";
import { Btn, EmptyState, Panel, RiskBadge, StatusChip } from "./primitives";
import {
  IconChevron,
  IconInbox,
  IconOffline,
  IconPause,
  IconPlay,
  IconRetry,
  IconSearch,
} from "./icons";
import { cx, fmtAmount, fmtTime, RISK_ORDER } from "../lib/ui";
import type { RiskLevel } from "../types";

const FILTERS: Array<{ id: "all" | RiskLevel; label: string }> = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

export function EventStream() {
  const {
    transactions,
    connection,
    configured,
    streamPaused,
    togglePause,
    select,
    selectedTransactionId,
    retry,
  } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | RiskLevel>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => (filter === "all" ? true : t.level === filter))
      .filter((t) =>
        q
          ? [t.id, t.sender, t.receiver, t.device, t.location]
              .join(" ")
              .toLowerCase()
              .includes(q)
          : true,
      );
  }, [transactions, query, filter]);

  const isOffline = connection === "offline" || connection === "error";

  const actions = (
    <>
      <div className="relative">
        <IconSearch
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ID, entity, device…"
          className="w-56 bg-surface-0 border border-border rounded-[var(--radius)] pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-faint focus:outline-none focus:border-accent/60 font-mono"
        />
      </div>
      <Btn
        variant="outline"
        onClick={togglePause}
        active={streamPaused}
        title={streamPaused ? "Resume stream" : "Pause stream"}
      >
        {streamPaused ? <IconPlay size={13} /> : <IconPause size={13} />}
        {streamPaused ? "Resume" : "Pause"}
      </Btn>
    </>
  );

  return (
    <Panel
      title="Event Stream — Dataset Replay"
      subtitle={
        transactions.length > 0
          ? `${rows.length} of ${transactions.length} events${streamPaused ? " · paused" : ""}`
          : undefined
      }
      actions={actions}
      className="min-h-0"
      bodyClassName="flex flex-col min-h-0"
    >
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto">
        {FILTERS.map((f) => {
          const count =
            f.id === "all"
              ? transactions.length
              : transactions.filter((t) => t.level === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0",
                filter === f.id
                  ? "bg-surface-2 text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {f.label}
              <span className="tabular-nums text-faint font-mono">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {rows.length === 0 ? (
          isOffline ? (
            <EmptyState
              tone="offline"
              icon={<IconOffline size={18} />}
              title={configured ? "Replay unavailable" : "Backend not configured"}
              detail={
                configured
                  ? "The Ring Sentinel backend is not reachable. Start it (uvicorn api.main:app --host 0.0.0.0 --port 8000) or verify the configured backend URL, then retry to begin the dataset replay."
                  : "Set VITE_API_BASE_URL to the reachable Ring Sentinel FastAPI server, then reload — local: http://127.0.0.1:8000  ·  hosted: https://your-backend-host"
              }
              action={
                <Btn variant="outline" onClick={retry}>
                  <IconRetry size={13} /> Retry Connection
                </Btn>
              }
            />
          ) : (
            <EmptyState
              icon={<IconInbox size={18} />}
              title={
                transactions.length === 0
                  ? "Connecting to dataset replay…"
                  : "No events match your filters"
              }
              detail={
                transactions.length === 0
                  ? configured
                    ? "Connected. Awaiting the first transaction event from the dataset replay."
                    : "No backend configured. Events will appear here once VITE_API_BASE_URL points at the FastAPI backend."
                  : "Adjust the risk filter or search query."
              }
            />
          )
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-surface-1">
              <tr className="text-[10px] uppercase tracking-wider text-faint font-mono">
                {[
                  "Time",
                  "Transaction ID",
                  "Sender",
                  "Receiver",
                  "Amount",
                  "Channel",
                  "Location",
                  "Device",
                  "Risk",
                  "Reason",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left font-medium px-3 py-2 border-b border-border whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const selected = t.id === selectedTransactionId;
                return (
                  <tr
                    key={t.id}
                    onClick={() => select(t.id)}
                    className={cx(
                      "cursor-pointer border-b border-border/60 transition-colors",
                      selected
                        ? "bg-accent/10"
                        : "hover:bg-surface-2/60",
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-faint whitespace-nowrap tabular-nums">
                      {fmtTime(t.timestamp)}
                    </td>
                    <td className="px-3 py-2 font-mono text-accent whitespace-nowrap">
                      {t.id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{t.sender}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{t.receiver}</td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums font-medium">
                      {fmtAmount(t.amount, t.currency)}
                    </td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">
                      {t.channel}
                    </td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">
                      {t.location}
                    </td>
                    <td className="px-3 py-2 font-mono text-muted whitespace-nowrap">
                      {t.device}
                    </td>
                    <td className="px-3 py-2">
                      <RiskBadge level={t.level} score={t.score} />
                    </td>
                    <td className="px-3 py-2 text-muted max-w-[220px] truncate">
                      {t.reason}
                    </td>
                    <td className="px-3 py-2">
                      <StatusChip status={t.status} />
                    </td>
                    <td className="px-3 py-2 text-faint">
                      <IconChevron size={14} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  );
}
