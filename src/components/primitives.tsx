import type { ReactNode } from "react";
import { cx, RISK_COLOR, STATUS_LABEL } from "../lib/ui";
import type { CaseStatus, RiskLevel } from "../types";

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cx(
        "flex flex-col border border-border bg-surface-1 rounded-[var(--radius)] overflow-hidden",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-muted font-mono">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-faint mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cx("flex-1 min-h-0", bodyClassName)}>{children}</div>
    </section>
  );
}

export function RiskBadge({
  level,
  score,
}: {
  level: RiskLevel;
  score?: number;
}) {
  const color = RISK_COLOR[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider font-mono"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in oklab, ${color} 40%, transparent)`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: color }}
        aria-hidden
      />
      {level}
      {score !== undefined && (
        <span className="tabular-nums opacity-80">{Math.round(score)}</span>
      )}
    </span>
  );
}

const STATUS_COLOR: Record<CaseStatus, string> = {
  new: "var(--low)",
  investigating: "var(--investigating)",
  escalated: "var(--high)",
  resolved: "var(--resolved)",
};

export function StatusChip({ status }: { status: CaseStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider font-mono"
      style={{ color }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  variant = "ghost",
  active,
  disabled,
  className,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "solid" | "outline" | "accent";
  active?: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-40 disabled:cursor-not-allowed select-none";
  const variants: Record<string, string> = {
    ghost: cx(
      "text-muted hover:text-foreground hover:bg-surface-2",
      active && "bg-surface-2 text-foreground",
    ),
    outline: cx(
      "border border-border-strong text-muted hover:text-foreground hover:border-accent/60",
      active && "border-accent/70 text-foreground",
    ),
    solid: "bg-surface-2 text-foreground hover:bg-border-strong border border-border-strong",
    accent:
      "bg-accent text-accent-foreground hover:bg-accent-strong font-semibold",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(base, variants[variant], className)}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  detail,
  action,
  tone = "neutral",
}: {
  icon?: ReactNode;
  title: string;
  detail?: string;
  action?: ReactNode;
  tone?: "neutral" | "offline";
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 h-full min-h-[160px] px-6 py-10">
      {icon && (
        <div
          className={cx(
            "flex items-center justify-center size-10 rounded-full border",
            tone === "offline"
              ? "border-high/40 text-high"
              : "border-border-strong text-faint",
          )}
        >
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-muted">{title}</p>
        {detail && <p className="text-xs text-faint mt-1 max-w-xs">{detail}</p>}
      </div>
      {action}
    </div>
  );
}
