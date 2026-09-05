import { createContext, useContext } from "react";
import type { Alert, ConnectionState, Metrics, TransactionEvent } from "../types";

export interface State {
  connection: ConnectionState;
  connectionDetail: string | null;
  lastEventAt: string | null;
  configured: boolean;
  historyLoaded: boolean;
  loadError: string | null;
  transactions: TransactionEvent[];
  alerts: Alert[];
  serverMetrics: Metrics | null;
  eventsReceived: number;
  streamPaused: boolean;
  selectedTransactionId: string | null;
}

export interface StoreValue extends State {
  metrics: Metrics;
  hasData: boolean;
  retry: () => void;
  togglePause: () => void;
  select: (id: string | null) => void;
  updateAlert: (alert: Alert) => void;
}

/**
 * Context lives in its own module (no component/provider exports) so that
 * editing the provider does not make Fast Refresh recreate a second context
 * object — which would leave `useStore` reading a null context and throwing
 * "useStore must be used within StoreProvider".
 */
export const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
