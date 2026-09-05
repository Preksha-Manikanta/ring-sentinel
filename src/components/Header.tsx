import { useStore } from "../store/context";
import { Btn } from "./primitives";
import { IconRetry, IconShield } from "./icons";
import { cx, relativeTime } from "../lib/ui";
import type { ConnectionState } from "../types";

const CONN: Record<
  ConnectionState,
  { label: string; color: string; glyph: string }
> = {
  live: { label: "REPLAY CONNECTED", color: "var(--normal)", glyph: "●" },
  connecting: { label: "CONNECTING", color: "var(--medium)", glyph: "○" },
  offline: { label: "OFFLINE", color: "var(--resolved)", glyph: "×" },
  error: { label: "ERROR", color: "var(--critical)", glyph: "×" },
  complete: { label: "REPLAY COMPLETE", color: "var(--medium)", glyph: "◍" },
};

export function Header({
  view,
  onView,
}: {
  view: string;
  onView: (v: string) => void;
}) {
  const { connection, lastEventAt, retry, configured } = useStore();
  const conn = CONN[connection];

  const tabs = [
    { id: "command", label: "Command Center" },
    { id: "alerts", label: "Alert Center" },
  ];

  return (
    <header className="flex items-center justify-between gap-4 h-14 px-4 border-b border-border bg-surface-0 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-8 rounded-[var(--radius)] bg-accent/12 text-accent border border-accent/30">
            <IconShield size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-[0.22em] font-mono">
              RING SENTINEL
            </div>
            <div className="text-[10px] text-faint tracking-wide">
              Network Transaction Intelligence
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1 pl-4 border-l border-border">
          {tabs.map((t) => (
            <Btn
              key={t.id}
              variant="ghost"
              active={view === t.id}
              onClick={() => onView(t.id)}
            >
              {t.label}
            </Btn>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* connection status — reflects the ACTUAL transport state */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-[var(--radius)] border border-border bg-surface-1">
          <span
            className={cx(
              "inline-flex items-center justify-center size-2.5 rounded-full text-[9px]",
              connection === "live" && "live-dot",
            )}
            style={{ background: conn.color }}
            aria-hidden
          />
          <div className="leading-tight">
            <div
              className="text-[11px] font-semibold font-mono tracking-widest"
              style={{ color: conn.color }}
            >
              {conn.label}
            </div>
            <div className="text-[10px] text-faint font-mono">
              {connection === "live"
                ? `last event ${relativeTime(lastEventAt)}`
                : configured
                  ? "no live stream"
                  : "no source configured"}
            </div>
          </div>
        </div>

        {(connection === "offline" || connection === "error") && (
          <Btn variant="outline" onClick={retry}>
            <IconRetry size={14} /> Retry
          </Btn>
        )}

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="text-right leading-tight">
            <div className="text-xs font-medium">A. Nandakumar</div>
            <div className="text-[10px] text-faint font-mono">
              Fraud Ops · L2 Analyst
            </div>
          </div>
          <div className="flex items-center justify-center size-8 rounded-full bg-surface-2 border border-border-strong text-xs font-semibold text-muted">
            AN
          </div>
        </div>
      </div>
    </header>
  );
}
