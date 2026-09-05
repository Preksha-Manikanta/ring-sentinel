// ---------------------------------------------------------------------------
// Runtime configuration for the data layer.
//
// Endpoints are read from Vite env vars so the exact same frontend binds to a
// real backend without code changes. There is NO implicit localhost or
// same-origin fallback: if nothing is configured the app reports BACKEND NOT
// CONFIGURED and never invents data. Two modes are supported:
//
//   Local demo   VITE_API_BASE_URL=http://127.0.0.1:8000
//   Hosted demo  VITE_API_BASE_URL=https://your-backend-host
//
// VITE_WS_URL is optional; when omitted it is derived from VITE_API_BASE_URL
// (http → ws, https → wss) so an https page never dials an insecure ws:// socket.
// ---------------------------------------------------------------------------

const env = import.meta.env as Record<string, string | undefined>;

/** Strip trailing slashes so `${base}/events` never yields a `//events` path. */
function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Derive the WebSocket endpoint from the REST base so a single configured URL
 * stays consistent across environments: http → ws, https → wss, same host/port.
 * An explicit VITE_WS_URL always wins. Returns "" when neither is configured so
 * the transport layer can report BACKEND NOT CONFIGURED instead of guessing.
 */
export function deriveWsUrl(apiBaseUrl: string, explicit?: string): string {
  if (explicit) return stripTrailingSlash(explicit);
  if (!apiBaseUrl) return "";
  try {
    const u = new URL(apiBaseUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    u.pathname = stripTrailingSlash(u.pathname) + "/events";
    return u.toString();
  } catch {
    return "";
  }
}

// No defaults: an unset backend URL is an explicit "not configured" signal.
const apiBaseUrl = stripTrailingSlash(env.VITE_API_BASE_URL ?? "");
const wsUrl = deriveWsUrl(apiBaseUrl, env.VITE_WS_URL);

export const config = {
  /** REST base, e.g. http://127.0.0.1:8000 or https://api.ring-sentinel.internal */
  apiBaseUrl,
  /** Realtime transport, e.g. ws://127.0.0.1:8000/events or wss://…/events */
  wsUrl,
  /** Optional bearer token for the analyst session */
  authToken: env.VITE_API_TOKEN ?? "",
};

/** True only when a real backend endpoint has been explicitly configured. */
export function hasDataSource(): boolean {
  return Boolean(config.wsUrl || config.apiBaseUrl);
}

/** True in a Vite dev build — gates non-production diagnostics. */
export const isDev: boolean = Boolean(import.meta.env?.DEV);

/**
 * Dev-only view of the resolved endpoints, for diagnosing deployment/config
 * problems. Never includes the auth token or any secret.
 */
export function connectionDiagnostics(): { api: string; ws: string } {
  return {
    api: config.apiBaseUrl || "(not configured)",
    ws: config.wsUrl || "(not configured)",
  };
}

// Log the resolved endpoints once at startup in dev so the console shows exactly
// what the browser will dial (§7). Secrets are never logged.
if (isDev) {
  const d = connectionDiagnostics();
  // eslint-disable-next-line no-console
  console.info(`[ring-sentinel config] API: ${d.api}  WebSocket: ${d.ws}`);
}

export function authHeaders(): Record<string, string> {
  return config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {};
}
