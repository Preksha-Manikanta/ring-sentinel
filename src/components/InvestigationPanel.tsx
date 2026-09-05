import { useEffect, useState } from "react";
import { useStore } from "../store/context";
import { auditService, investigationService } from "../services/domainServices";
import { Btn, EmptyState, RiskBadge, StatusChip } from "./primitives";
import { EntityGraph } from "./EntityGraph";
import { IconClose, IconGauge, IconLayers, IconShield } from "./icons";
import type { ApproveResponse, HumanAction } from "../types";
import {
  cx,
  fmtAmount,
  fmtDateTime,
  fmtTime,
  RISK_COLOR,
} from "../lib/ui";
import type { Investigation, TimelineKind, TransactionEvent } from "../types";

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        {icon && <span className="text-faint">{icon}</span>}
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted font-mono">
          {title}
        </h3>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-faint font-mono">
        {label}
      </span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  );
}

const TIMELINE_COLOR: Record<TimelineKind, string> = {
  transaction: "var(--low)",
  detection: "var(--high)",
  scoring: "var(--medium)",
  evidence: "var(--accent)",
  opened: "var(--investigating)",
  action: "var(--investigating)",
  resolution: "var(--normal)",
};

function useInvestigation(id: string | null) {
  const [state, setState] = useState<{
    data: Investigation | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: false, error: null });

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const ctrl = new AbortController();
    setState({ data: null, loading: true, error: null });
    investigationService
      .get(id, ctrl.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Unavailable",
        });
      });
    return () => ctrl.abort();
  }, [id]);

  return state;
}

export function InvestigationPanel() {
  const { selectedTransactionId, transactions, select } = useStore();
  const base: TransactionEvent | undefined = transactions.find(
    (t) => t.id === selectedTransactionId,
  );
  const { data, loading, error } = useInvestigation(selectedTransactionId);

  const [acting, setActing] = useState<HumanAction | null>(null);
  const [receipt, setReceipt] = useState<ApproveResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // reset the action receipt whenever a different case is opened
  useEffect(() => {
    setReceipt(null);
    setActionError(null);
    setActing(null);
  }, [selectedTransactionId]);

  async function takeAction(action: HumanAction) {
    if (!selectedTransactionId) return;
    setActing(action);
    setActionError(null);
    try {
      const res = await auditService.approve(selectedTransactionId, action);
      setReceipt(res);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to record action",
      );
    } finally {
      setActing(null);
    }
  }

  const open = Boolean(selectedTransactionId);

  return (
    <>
      {/* backdrop */}
      <div
        onClick={() => select(null)}
        className={cx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        aria-hidden
      />
      <aside
        className={cx(
          "fixed top-0 right-0 z-50 h-full w-full max-w-[560px] bg-surface-1 border-l border-border-strong shadow-2xl flex flex-col transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {base && (
          <>
            {/* header */}
            <div className="flex items-start justify-between gap-3 px-4 py-4 border-b border-border">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-faint font-mono">
                    Investigation
                  </span>
                  <StatusChip status={base.status} />
                </div>
                <div className="text-lg font-semibold font-mono text-accent mt-0.5">
                  {base.id}
                </div>
                <div className="text-xs text-faint mt-0.5">
                  {fmtDateTime(base.timestamp)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge level={base.level} score={base.score} />
                <button
                  onClick={() => select(null)}
                  className="text-faint hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <IconClose size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              {/* transaction facts — always available from the event */}
              <Section title="Transaction">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Amount" value={fmtAmount(base.amount, base.currency)} />
                  <Field label="Channel" value={base.channel} />
                  <Field label="Sender" value={base.sender} />
                  <Field label="Receiver" value={base.receiver} />
                  <Field label="Location" value={base.location} />
                  <Field label="Device" value={<span className="font-mono">{base.device}</span>} />
                  <Field
                    label="Account Age"
                    value={
                      data?.accountAgeDays != null
                        ? `${data.accountAgeDays} days`
                        : "—"
                    }
                  />
                  <Field
                    label="Device Info"
                    value={data?.deviceInfo ?? "—"}
                  />
                </div>
              </Section>

              {/* WHY flagged — the core of the product */}
              <Section title="Why Was This Flagged?" icon={<IconLayers size={14} />}>
                {loading ? (
                  <SkeletonLines n={3} />
                ) : data && data.assessment.signals.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {data.assessment.signals.map((s) => (
                      <li
                        key={s.key}
                        className="rounded-[var(--radius)] border border-border bg-surface-0 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {s.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <RiskBadge level={s.severity} />
                            <span
                              className="text-xs font-semibold font-mono tabular-nums"
                              style={{ color: RISK_COLOR[s.severity] }}
                            >
                              +{s.contribution}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted mt-1.5 leading-relaxed">
                          {s.evidence}
                        </p>
                        {s.observedAt && (
                          <p className="text-[10px] text-faint font-mono mt-1">
                            observed {fmtTime(s.observedAt)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EvidenceFallback error={error} reason={base.reason} />
                )}
              </Section>

              {/* Risk engine breakdown */}
              <Section title="Risk Engine" icon={<IconGauge size={14} />}>
                {data ? (
                  <RiskEngine assessment={data.assessment} />
                ) : (
                  <div className="rounded-[var(--radius)] border border-border bg-surface-0 p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted">Composite risk score</span>
                      <span
                        className="text-2xl font-semibold font-mono tabular-nums"
                        style={{ color: RISK_COLOR[base.level] }}
                      >
                        {base.score}
                      </span>
                    </div>
                    <p className="text-[11px] text-faint mt-2">
                      Signal-level breakdown loads from the risk engine. Reconnect to
                      retrieve contributing signals.
                    </p>
                  </div>
                )}
              </Section>

              {/* AI dossier — narration only, deterministic evidence stands alone */}
              <Section title="AI Case Dossier" icon={<IconShield size={14} />}>
                {loading ? (
                  <SkeletonLines n={2} />
                ) : data && data.dossier.available ? (
                  <div className="rounded-[var(--radius)] border border-border bg-surface-0 p-3 flex flex-col gap-2">
                    <p className="text-xs text-foreground leading-relaxed">
                      {data.dossier.summary}
                    </p>
                    {data.dossier.keyFindings.length > 0 && (
                      <ul className="flex flex-col gap-1 mt-1">
                        {data.dossier.keyFindings.map((f, i) => (
                          <li key={i} className="text-[11px] text-muted flex gap-2">
                            <span className="text-accent">•</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="text-[11px] text-faint border-t border-border pt-2 mt-1">
                      <span className="uppercase tracking-wider font-mono text-[10px]">
                        Uncertainty
                      </span>
                      <p className="text-muted mt-0.5">{data.dossier.uncertainty}</p>
                    </div>
                    <div className="text-[10px] text-faint font-mono">
                      Suggested (deterministic policy · non-binding):{" "}
                      {data.dossier.suggestedAction} · identity confidence{" "}
                      {(data.dossier.identityConfidence * 100).toFixed(0)}%
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[var(--radius)] border border-medium/30 bg-medium/5 p-3">
                    <p className="text-xs text-medium font-medium">
                      AI narration unavailable.
                    </p>
                    <p className="text-[11px] text-muted mt-1">
                      {data?.dossier.unavailableReason ??
                        "Showing deterministic evidence and risk score."}
                    </p>
                    {data?.dossier.suggestedAction && (
                      <p className="text-[10px] text-faint font-mono mt-2">
                        Suggested (deterministic policy · non-binding):{" "}
                        {data.dossier.suggestedAction}
                      </p>
                    )}
                  </div>
                )}
              </Section>

              {/* Entity graph */}
              <Section title="Entity / Transaction Graph">
                <EntityGraph graph={data?.graph ?? null} />
              </Section>

              {/* Timeline */}
              <Section title="Investigation Timeline">
                {data && data.timeline.length > 0 ? (
                  <ol className="flex flex-col">
                    {data.timeline.map((e, i) => (
                      <li key={e.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className="size-2.5 rounded-full mt-1"
                            style={{ background: TIMELINE_COLOR[e.kind] }}
                          />
                          {i < data.timeline.length - 1 && (
                            <span className="w-px flex-1 bg-border my-1" />
                          )}
                        </div>
                        <div className="pb-4">
                          <div className="text-xs font-medium text-foreground">
                            {e.label}
                          </div>
                          {e.detail && (
                            <div className="text-[11px] text-muted mt-0.5">
                              {e.detail}
                            </div>
                          )}
                          <div className="text-[10px] text-faint font-mono mt-0.5">
                            {fmtDateTime(e.at)}
                            {e.actor && ` · ${e.actor}`}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-faint">
                    Timeline events originate from actual application events. None
                    recorded for this case yet.
                  </p>
                )}
              </Section>
            </div>

            {/* action bar — analyst acts; nothing is automated, nothing auto-blocks */}
            <div className="flex flex-col gap-2 px-4 py-3 border-t border-border bg-surface-0">
              {receipt ? (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-normal font-semibold font-mono">
                    ✓ {receipt.action} recorded
                  </span>
                  <span className="text-faint font-mono">
                    {fmtDateTime(receipt.timestamp)}
                  </span>
                  <span
                    className="text-faint font-mono truncate"
                    title={receipt.hash}
                  >
                    audit {receipt.hash.slice(0, 16)}…
                  </span>
                  <Btn
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => setReceipt(null)}
                  >
                    New action
                  </Btn>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-faint font-mono mr-auto">
                      Human decision required · no auto-block
                    </span>
                    <Btn
                      variant="outline"
                      disabled={acting !== null}
                      onClick={() => takeAction("WATCH")}
                    >
                      {acting === "WATCH" ? "Recording…" : "Watch"}
                    </Btn>
                    <Btn
                      variant="outline"
                      disabled={acting !== null}
                      onClick={() => takeAction("HOLD_PAYOUT")}
                    >
                      {acting === "HOLD_PAYOUT" ? "Recording…" : "Hold Payout"}
                    </Btn>
                    <Btn
                      variant="accent"
                      disabled={acting !== null}
                      onClick={() => takeAction("ESCALATE_HUMAN")}
                    >
                      {acting === "ESCALATE_HUMAN" ? "Recording…" : "Escalate Human"}
                    </Btn>
                  </div>
                  {actionError && (
                    <p className="text-[11px] text-critical">
                      {actionError} — action not recorded (backend offline?).
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function RiskEngine({
  assessment,
}: {
  assessment: Investigation["assessment"];
}) {
  const total = assessment.signals.reduce((s, x) => s + x.contribution, 0) || 1;
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-0 p-3">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs text-muted">
          Composite score · <span className="font-mono">{assessment.engine}</span>
        </span>
        <span
          className="text-2xl font-semibold font-mono tabular-nums"
          style={{ color: RISK_COLOR[assessment.level] }}
        >
          {assessment.score}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {assessment.signals.map((s) => (
          <li key={s.key} className="text-xs">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-muted">{s.label}</span>
              <span className="font-mono tabular-nums" style={{ color: RISK_COLOR[s.severity] }}>
                +{s.contribution}
              </span>
            </div>
            <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(s.contribution / total) * 100}%`,
                  background: RISK_COLOR[s.severity],
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceFallback({
  error,
  reason,
}: {
  error: string | null;
  reason: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-0 p-3">
      <p className="text-xs text-muted">
        <span className="text-foreground font-medium">Primary reason:</span> {reason}
      </p>
      <p className="text-[11px] text-faint mt-2">
        {error
          ? "Full evidence breakdown is served by the detection engine and is currently unavailable. The raw detection reason above still applies."
          : "Detailed evidence loads from the detection engine for this transaction."}
      </p>
    </div>
  );
}

function SkeletonLines({ n }: { n: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden h-14 rounded-[var(--radius)] border border-border bg-surface-0 scan-sweep"
        />
      ))}
    </div>
  );
}
