import { config } from "./config";
import type { ConnectionState, TransactionEvent } from "../types";

type EventHandler = (event: TransactionEvent) => void;
type StateHandler = (state: ConnectionState, detail?: string) => void;

/**
 * Realtime transport. Connects to the configured WebSocket endpoint and streams
 * live transaction events. If no endpoint is configured, it reports OFFLINE and
 * never emits a single event — the UI stays honest.
 */
export class WebsocketService {
  private socket: WebSocket | null = null;
  private eventHandlers = new Set<EventHandler>();
  private stateHandlers = new Set<StateHandler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEventAt: string | null = null;
  private manualClose = false;
  private replayComplete = false;

  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  onState(handler: StateHandler): () => void {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  get lastEventTimestamp(): string | null {
    return this.lastEventAt;
  }

  connect(): void {
    // Guard against duplicate streams: if a socket is already connecting or
    // open, don't dial a second one (auto-connect + a stray retry must not
    // double-subscribe to the replay).
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.CONNECTING ||
        this.socket.readyState === WebSocket.OPEN)
    ) {
      this.diag("connect", "ignored — socket already active");
      return;
    }
    this.manualClose = false;
    this.replayComplete = false;
    if (!config.wsUrl) {
      this.emitState("offline", "No realtime endpoint configured");
      return;
    }
    this.emitState("connecting");
    this.diag("connecting", `dialing ${config.wsUrl}`);
    try {
      this.socket = new WebSocket(config.wsUrl);
    } catch {
      this.emitState("offline", "Unable to open connection");
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.diag("open", `connected to ${config.wsUrl}`);
      this.emitState("live");
    };
    this.socket.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data) as
          | TransactionEvent
          | { type: "control"; event: string };
        // Terminal control frame: the backend finished replaying the dataset.
        // Mark completion so onclose does NOT trigger an endless replay loop.
        if ((parsed as { type?: string }).type === "control") {
          if ((parsed as { event?: string }).event === "replay_complete") {
            this.replayComplete = true;
            this.emitState("complete", "All dataset events replayed");
          }
          return;
        }
        const event = parsed as TransactionEvent;
        this.lastEventAt = event.timestamp ?? new Date().toISOString();
        this.eventHandlers.forEach((h) => h(event));
      } catch {
        // ignore malformed frames rather than fabricate an event
      }
    };
    this.socket.onerror = () => {
      this.diag("error", "socket error");
      this.emitState("error", "Connection error");
    };
    this.socket.onclose = (ev) => {
      this.diag("close", `code=${ev.code} reason=${ev.reason || "(none)"} clean=${ev.wasClean}`);
      if (this.manualClose) {
        this.emitState("offline", "Disconnected");
        return;
      }
      if (this.replayComplete) {
        // clean end of the dataset replay — stay complete, do not reconnect
        this.emitState("complete", "All dataset events replayed");
        return;
      }
      this.emitState("offline", "Stream closed");
      this.scheduleReconnect();
    };
  }

  /** Dev-only connection diagnostics. Never runs in production builds. */
  private diag(phase: string, detail: string): void {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.info(`[ring-sentinel ws] ${phase}: ${detail}`);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.manualClose) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  disconnect(): void {
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  retry(): void {
    this.disconnect();
    this.connect();
  }

  private emitState(state: ConnectionState, detail?: string): void {
    this.stateHandlers.forEach((h) => h(state, detail));
  }
}

export const websocketService = new WebsocketService();
