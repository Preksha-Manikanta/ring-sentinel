// ---------------------------------------------------------------------------
// RING SENTINEL — domain types
// These describe the *contract* with a real backend. Nothing here fabricates
// data; every field is populated only from an actual data source.
// ---------------------------------------------------------------------------

export type RiskLevel =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "normal";

export type CaseStatus =
  | "new"
  | "investigating"
  | "escalated"
  | "resolved";

export type ConnectionState =
  | "connecting"
  | "live"
  | "offline"
  | "error"
  | "complete";

export interface RiskSignal {
  /** stable key, e.g. "velocity_anomaly" */
  key: string;
  label: string;
  /** points this signal contributed to the total risk score */
  contribution: number;
  severity: RiskLevel;
  /** human-readable evidence produced by the engine */
  evidence: string;
  /** ISO timestamp where the signal was observed, if relevant */
  observedAt?: string;
}

export interface RiskAssessment {
  transactionId: string;
  score: number; // 0–100, produced by the engine
  level: RiskLevel;
  signals: RiskSignal[];
  /** engine/model identifier for auditability */
  engine: string;
  computedAt: string;
}

export interface TransactionEvent {
  id: string;
  timestamp: string; // ISO
  sender: string;
  receiver: string;
  amount: number;
  currency: string;
  channel: string;
  location: string;
  device: string;
  score: number;
  level: RiskLevel;
  reason: string; // primary detection reason
  status: CaseStatus;
}

export interface Alert {
  id: string;
  createdAt: string;
  severity: RiskLevel;
  entity: string;
  trigger: string;
  score: number;
  assignee: string | null;
  status: CaseStatus;
  transactionId: string;
}

export type EntityKind =
  | "customer"
  | "account"
  | "device"
  | "merchant"
  | "endpoint"
  | "transaction";

export interface GraphNode {
  id: string;
  kind: EntityKind;
  label: string;
  risk?: RiskLevel;
}

export type EdgeKind =
  | "sent"
  | "received"
  | "used_device"
  | "paid_merchant"
  | "shared_device"
  | "shared_account";

export interface GraphEdge {
  source: string;
  target: string;
  kind: EdgeKind;
  /** every shared linking attribute for this edge — evidence is never collapsed */
  sharedAttributes?: string[];
}

export interface EntityGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type TimelineKind =
  | "transaction"
  | "detection"
  | "scoring"
  | "evidence"
  | "opened"
  | "action"
  | "resolution";

export interface TimelineEntry {
  id: string;
  kind: TimelineKind;
  at: string;
  label: string;
  detail?: string;
  actor?: string;
}

export interface Dossier {
  summary: string;
  keyFindings: string[];
  uncertainty: string;
  /** deterministic, non-binding suggestion from engine policy — NOT from Claude */
  suggestedAction: HumanAction;
  identityLikelySameActor: boolean;
  identityConfidence: number;
  available: boolean;
  unavailableReason?: string | null;
}

export interface Investigation {
  transaction: TransactionEvent;
  accountAgeDays: number | null;
  deviceInfo: string;
  history: TransactionEvent[];
  assessment: RiskAssessment;
  graph: EntityGraph;
  timeline: TimelineEntry[];
  dossier: Dossier;
}

/** The ONLY actions an analyst can take. Never BLOCK — nothing auto-acts. */
export type HumanAction = "WATCH" | "HOLD_PAYOUT" | "ESCALATE_HUMAN";

export interface ApproveResponse {
  recorded: boolean;
  action: HumanAction;
  caseId: string;
  timestamp: string;
  hash: string;
  previousHash: string;
}

export interface EvaluationResult {
  precision: number;
  recall: number;
  rupeesPrevented: number;
  falsePositiveCost: number;
  tp: number;
  fp: number;
  fn: number;
}

export interface Evaluation {
  datasetAccounts: number;
  datasetOrders: number;
  seededRings: number;
  holdoutRings: string[];
  holdoutFraction: number;
  flagCutoff: number;
  baseline: EvaluationResult;
  ringSentinel: EvaluationResult;
}

export interface Metrics {
  eventsReceived: number;
  transactionsAnalyzed: number;
  highRiskEvents: number;
  criticalAlerts: number;
  activeInvestigations: number;
  /** detection latency in ms, from the engine */
  detectionLatencyMs: number | null;
  sourceTimestamp: string | null;
  /** real holdout evaluation (baseline vs Ring Sentinel); null if unavailable */
  evaluation?: Evaluation | null;
}
