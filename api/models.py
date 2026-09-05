"""Response/request models.

Field names are intentionally camelCase to match the existing frontend
TypeScript types (src/types.ts) exactly, so no frontend redesign is needed.
"""
from __future__ import annotations

from pydantic import BaseModel


class RiskSignal(BaseModel):
    key: str
    label: str
    contribution: float
    severity: str
    evidence: str
    observedAt: str | None = None


class RiskAssessment(BaseModel):
    transactionId: str
    score: float
    level: str
    signals: list[RiskSignal]
    engine: str
    computedAt: str


class TransactionEvent(BaseModel):
    id: str
    timestamp: str
    sender: str
    receiver: str
    amount: float
    currency: str
    channel: str
    location: str
    device: str
    score: float
    level: str
    reason: str
    status: str


class GraphNode(BaseModel):
    id: str
    kind: str
    label: str
    risk: str | None = None


class GraphEdge(BaseModel):
    source: str
    target: str
    kind: str
    sharedAttributes: list[str] = []


class EntityGraph(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class TimelineEntry(BaseModel):
    id: str
    kind: str
    at: str
    label: str
    detail: str | None = None
    actor: str | None = None


class Dossier(BaseModel):
    summary: str
    keyFindings: list[str]
    uncertainty: str
    # Deterministic, non-binding suggestion from engine policy (NOT from Claude).
    suggestedAction: str
    identityLikelySameActor: bool
    identityConfidence: float
    available: bool
    unavailableReason: str | None = None


class Investigation(BaseModel):
    transaction: TransactionEvent
    accountAgeDays: int | None = None
    deviceInfo: str
    history: list[TransactionEvent]
    assessment: RiskAssessment
    graph: EntityGraph
    timeline: list[TimelineEntry]
    dossier: Dossier


class Alert(BaseModel):
    id: str
    createdAt: str
    severity: str
    entity: str
    trigger: str
    score: float
    assignee: str | None = None
    status: str
    transactionId: str


class EvaluationResult(BaseModel):
    precision: float
    recall: float
    rupeesPrevented: float
    falsePositiveCost: float
    tp: int
    fp: int
    fn: int


class Evaluation(BaseModel):
    datasetAccounts: int
    datasetOrders: int
    seededRings: int
    holdoutRings: list[str]
    holdoutFraction: float
    flagCutoff: float
    baseline: EvaluationResult
    ringSentinel: EvaluationResult


class Metrics(BaseModel):
    eventsReceived: int
    transactionsAnalyzed: int
    highRiskEvents: int
    criticalAlerts: int
    activeInvestigations: int
    detectionLatencyMs: int | None = None
    sourceTimestamp: str | None = None
    # Real holdout evaluation (baseline vs Ring Sentinel); None if unavailable.
    evaluation: Evaluation | None = None


class Cluster(BaseModel):
    clusterId: str
    score: float
    level: str
    accounts: list[str]
    sharedAttributes: list[str]
    signals: list[RiskSignal]


class ApproveRequest(BaseModel):
    caseId: str
    action: str  # validated against the LLM action enum in routes
    evidence: dict | None = None


class ApproveResponse(BaseModel):
    recorded: bool
    action: str
    caseId: str
    timestamp: str
    hash: str
    previousHash: str
