import { useStore } from "../store/context";
import { Panel, EmptyState } from "./primitives";
import { IconGauge } from "./icons";
import type { EvaluationResult } from "../types";

const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function Row({
  label,
  baseline,
  sentinel,
  better,
}: {
  label: string;
  baseline: string;
  sentinel: string;
  better?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 px-4 py-2 border-t border-border text-xs">
      <span className="text-muted">{label}</span>
      <span className="text-right font-mono tabular-nums text-faint">{baseline}</span>
      <span
        className="text-right font-mono tabular-nums font-semibold"
        style={{ color: better ? "var(--normal)" : "var(--foreground)" }}
      >
        {sentinel}
      </span>
    </div>
  );
}

export function EvaluationPanel() {
  const { metrics } = useStore();
  const ev = metrics.evaluation;

  return (
    <Panel
      title="Holdout Evaluation"
      subtitle="Baseline vs Ring Sentinel · untouched 20% holdout"
    >
      {!ev ? (
        <EmptyState
          icon={<IconGauge size={18} />}
          title="Awaiting evaluation data"
          detail="Holdout metrics are computed by the backend (eval/run_eval.py). Generate the dataset and connect the API to populate this comparison."
        />
      ) : (
        <div className="pb-2">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-faint">
            <span>Metric</span>
            <span className="text-right">Baseline</span>
            <span className="text-right text-accent">Ring Sentinel</span>
          </div>
          <Row
            label="Precision"
            baseline={pct(ev.baseline.precision)}
            sentinel={pct(ev.ringSentinel.precision)}
            better={ev.ringSentinel.precision >= ev.baseline.precision}
          />
          <Row
            label="Recall"
            baseline={pct(ev.baseline.recall)}
            sentinel={pct(ev.ringSentinel.recall)}
            better={ev.ringSentinel.recall >= ev.baseline.recall}
          />
          <Row
            label="True positives"
            baseline={String(ev.baseline.tp)}
            sentinel={String(ev.ringSentinel.tp)}
            better={ev.ringSentinel.tp >= ev.baseline.tp}
          />
          <Row
            label="False positives"
            baseline={String(ev.baseline.fp)}
            sentinel={String(ev.ringSentinel.fp)}
            better={ev.ringSentinel.fp <= ev.baseline.fp}
          />
          <Row
            label="₹ Prevented*"
            baseline={`₹${INR.format(ev.baseline.rupeesPrevented)}`}
            sentinel={`₹${INR.format(ev.ringSentinel.rupeesPrevented)}`}
            better={ev.ringSentinel.rupeesPrevented >= ev.baseline.rupeesPrevented}
          />
          <Row
            label="FP Cost"
            baseline={`₹${INR.format(ev.baseline.falsePositiveCost)}`}
            sentinel={`₹${INR.format(ev.ringSentinel.falsePositiveCost)}`}
            better={ev.ringSentinel.falsePositiveCost <= ev.baseline.falsePositiveCost}
          />
          <p className="text-[10px] text-faint font-mono px-4 pt-3 leading-relaxed">
            {ev.datasetAccounts} accounts · {ev.datasetOrders} orders ·{" "}
            {ev.seededRings} seeded rings · holdout {ev.holdoutRings.length} ring(s).
            <br />
            * simulated / pre-payout prevented value on the evaluation dataset —
            not actual money saved. Weights/thresholds were not tuned on the holdout.
          </p>
        </div>
      )}
    </Panel>
  );
}
