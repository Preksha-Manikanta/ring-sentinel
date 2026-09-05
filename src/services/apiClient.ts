import { authHeaders, config } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Thin fetch wrapper for REST calls. Throws ApiError on any non-2xx or network
 * failure so callers surface honest error/empty states instead of guessing.
 */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!config.apiBaseUrl) {
    throw new ApiError("No API base URL configured");
  }
  let res: Response;
  try {
    res = await fetch(`${config.apiBaseUrl}${path}`, {
      headers: { Accept: "application/json", ...authHeaders() },
      signal,
    });
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : "Network error");
  }
  if (res.status === 401 || res.status === 403) {
    throw new ApiError("Authentication failed", res.status);
  }
  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status})`, res.status);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  if (!config.apiBaseUrl) {
    throw new ApiError("No API base URL configured");
  }
  let res: Response;
  try {
    res = await fetch(`${config.apiBaseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : "Network error");
  }
  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status})`, res.status);
  }
  return (await res.json()) as T;
}
