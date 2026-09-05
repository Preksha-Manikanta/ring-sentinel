import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { websocketService } from "../services/websocketService";
import {
  alertService,
  metricsService,
  transactionService,
} from "../services/domainServices";
import { hasDataSource } from "../services/config";
import type { Alert, ConnectionState, Metrics, TransactionEvent } from "../types";
import { StoreContext, type State, type StoreValue } from "./context";

type Action =
  | { type: "connection"; state: ConnectionState; detail?: string }
  | { type: "event"; event: TransactionEvent }
  | { type: "history"; transactions: TransactionEvent[]; alerts: Alert[]; metrics: Metrics | null }
  | { type: "loadError"; message: string }
  | { type: "togglePause" }
  | { type: "select"; id: string | null }
  | { type: "updateAlert"; alert: Alert }
  | { type: "reset" };

const MAX_TX = 500;

const initialState: State = {
  connection: "connecting",
  connectionDetail: null,
  lastEventAt: null,
  configured: hasDataSource(),
  historyLoaded: false,
  loadError: null,
  transactions: [],
  alerts: [],
  serverMetrics: null,
  eventsReceived: 0,
  streamPaused: false,
  selectedTransactionId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "connection":
      return {
        ...state,
        connection: action.state,
        connectionDetail: action.detail ?? null,
        lastEventAt:
          action.state === "live" ? state.lastEventAt : state.lastEventAt,
      };
    case "event": {
      if (state.streamPaused) {
        return { ...state, eventsReceived: state.eventsReceived + 1 };
      }
      const next = [action.event, ...state.transactions].slice(0, MAX_TX);
      return {
        ...state,
        transactions: next,
        eventsReceived: state.eventsReceived + 1,
        lastEventAt: action.event.timestamp,
      };
    }
    case "history":
      return {
        ...state,
        transactions: action.transactions,
        alerts: action.alerts,
        serverMetrics: action.metrics,
        historyLoaded: true,
        loadError: null,
      };
    case "loadError":
      return { ...state, loadError: action.message, historyLoaded: true };
    case "togglePause":
      return { ...state, streamPaused: !state.streamPaused };
    case "select":
      return { ...state, selectedTransactionId: action.id };
    case "updateAlert":
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.alert.id ? action.alert : a,
        ),
      };
    case "reset":
      return { ...initialState, configured: hasDataSource() };
    default:
      return state;
  }
}

/** Metrics derived from data the client actually holds (real events only). */
function deriveMetrics(state: State): Metrics {
  const server = state.serverMetrics;
  const highRisk = state.transactions.filter(
    (t) => t.level === "high" || t.level === "critical",
  ).length;
  const criticalAlerts = state.alerts.filter(
    (a) => a.severity === "critical",
  ).length;
  const active =
    state.alerts.filter(
      (a) => a.status === "investigating" || a.status === "escalated",
    ).length || 0;
  return {
    eventsReceived: server?.eventsReceived ?? state.eventsReceived,
    transactionsAnalyzed:
      server?.transactionsAnalyzed ?? state.transactions.length,
    highRiskEvents: server?.highRiskEvents ?? highRisk,
    criticalAlerts: server?.criticalAlerts ?? criticalAlerts,
    activeInvestigations: server?.activeInvestigations ?? active,
    detectionLatencyMs: server?.detectionLatencyMs ?? null,
    sourceTimestamp: server?.sourceTimestamp ?? state.lastEventAt,
    // holdout evaluation is server-computed only — never derived client-side
    evaluation: server?.evaluation ?? null,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadHistory = useCallback(async () => {
    if (!hasDataSource()) return;
    try {
      const [transactions, alerts, metrics] = await Promise.all([
        transactionService.list().catch(() => [] as TransactionEvent[]),
        alertService.list().catch(() => [] as Alert[]),
        metricsService.get().catch(() => null),
      ]);
      dispatch({ type: "history", transactions, alerts, metrics });
    } catch (err) {
      dispatch({
        type: "loadError",
        message: err instanceof Error ? err.message : "Failed to load",
      });
    }
  }, []);

  useEffect(() => {
    const offEvent = websocketService.onEvent((event) =>
      dispatch({ type: "event", event }),
    );
    const offState = websocketService.onState((s, detail) =>
      dispatch({ type: "connection", state: s, detail }),
    );
    void loadHistory();
    websocketService.connect();
    return () => {
      offEvent();
      offState();
      websocketService.disconnect();
    };
  }, [loadHistory]);

  const retry = useCallback(() => {
    dispatch({ type: "reset" });
    void loadHistory();
    websocketService.retry();
  }, [loadHistory]);

  const togglePause = useCallback(() => dispatch({ type: "togglePause" }), []);
  const select = useCallback(
    (id: string | null) => dispatch({ type: "select", id }),
    [],
  );
  const updateAlert = useCallback(
    (alert: Alert) => dispatch({ type: "updateAlert", alert }),
    [],
  );

  const value = useMemo<StoreValue>(() => {
    const metrics = deriveMetrics(state);
    return {
      ...state,
      metrics,
      hasData: state.transactions.length > 0,
      retry,
      togglePause,
      select,
      updateAlert,
    };
  }, [state, retry, togglePause, select, updateAlert]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
