// ---------------------------------------------------------------------------
// REST-backed domain services. Each maps to a real backend endpoint; the exact
// paths can be adapted to the deployed API. Every method returns data straight
// from the source — no defaults, no fabrication.
// ---------------------------------------------------------------------------

import { apiGet, apiPost } from "./apiClient";
import type {
  Alert,
  ApproveResponse,
  HumanAction,
  Investigation,
  Metrics,
  RiskAssessment,
  TransactionEvent,
} from "../types";

export const transactionService = {
  list: (signal?: AbortSignal) =>
    apiGet<TransactionEvent[]>("/transactions", signal),
  get: (id: string, signal?: AbortSignal) =>
    apiGet<TransactionEvent>(`/transactions/${id}`, signal),
};

export const riskService = {
  assessment: (transactionId: string, signal?: AbortSignal) =>
    apiGet<RiskAssessment>(`/risk/${transactionId}`, signal),
};

export const alertService = {
  list: (signal?: AbortSignal) => apiGet<Alert[]>("/alerts", signal),
  updateStatus: (id: string, status: Alert["status"], assignee?: string) =>
    apiPost<Alert>(`/alerts/${id}/status`, { status, assignee }),
};

export const investigationService = {
  get: (transactionId: string, signal?: AbortSignal) =>
    apiGet<Investigation>(`/investigations/${transactionId}`, signal),
};

export const metricsService = {
  get: (signal?: AbortSignal) => apiGet<Metrics>("/metrics", signal),
};

export const auditService = {
  /** Records a human-gate action; nothing is ever auto-executed. */
  approve: (caseId: string, action: HumanAction) =>
    apiPost<ApproveResponse>("/approve", { caseId, action }),
};
