import { useStore } from "../store/context";
import { Btn } from "./primitives";
import { IconOffline, IconRetry } from "./icons";
import { connectionDiagnostics, isDev } from "../services/config";

/**
 * Shown only when the app has no live source AND no data to display — the
 * honest "we are not receiving anything" state. It never masks real data.
 */
export function OfflineBanner() {
  const { connection, hasData, configured, connectionDetail, retry } = useStore();
  const offline = connection === "offline" || connection === "error";
  if (!offline || hasData) return null;

  const diag = isDev ? connectionDiagnostics() : null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-high/8 border-b border-high/25">
      <span className="text-high shrink-0">
        <IconOffline size={16} />
      </span>
      <div className="text-xs">
        <span className="font-semibold text-high font-mono tracking-wide">
          {configured ? "CONNECTION OFFLINE" : "BACKEND NOT CONFIGURED"}
        </span>
        <span className="text-muted ml-2">
          {configured
            ? connectionDetail ?? "Backend not reachable. Displaying no data rather than simulated activity."
            : "Set VITE_API_BASE_URL to the reachable FastAPI server — local: http://127.0.0.1:8000 · hosted: https://your-backend-host"}
        </span>
      </div>
      {diag && (
        <span className="hidden md:block text-[10px] font-mono text-faint shrink-0">
          API {diag.api} · WS {diag.ws}
        </span>
      )}
      <Btn variant="outline" onClick={retry} className="ml-auto shrink-0">
        <IconRetry size={13} /> Retry Connection
      </Btn>
    </div>
  );
}
