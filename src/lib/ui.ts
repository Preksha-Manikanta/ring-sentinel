import type { CaseStatus, RiskLevel } from "../types";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const RISK_COLOR: Record<RiskLevel, string> = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
  normal: "var(--normal)",
};

export const RISK_ORDER: RiskLevel[] = [
  "critical",
  "high",
  "medium",
  "low",
  "normal",
];

export const STATUS_LABEL: Record<CaseStatus, string> = {
  new: "New",
  investigating: "Investigating",
  escalated: "Escalated",
  resolved: "Resolved",
};

export function fmtNum(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function fmtAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${fmtNum(amount)}`;
  }
}

export function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", { hour12: false });
}

export function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { hour12: false });
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "no events yet";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const secs = Math.max(0, Math.round((Date.now() - d) / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}
