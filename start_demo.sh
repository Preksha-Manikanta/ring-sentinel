#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Ring Sentinel — one predictable command for a local demo (MODE A).
#
#   ./start_demo.sh
#
# Starts, in order:
#   1. dataset generation  (data/generate_dataset.py)
#   2. FastAPI backend     (uvicorn api.main:app --host 0.0.0.0 --port 8000)
#   3. Vite frontend       (pnpm dev)
#
# Both long-running processes share this script's process group; Ctrl-C stops
# them together. This is the LOCAL demo path only — for a hosted demo, deploy
# the backend separately and set VITE_API_BASE_URL (see README, MODE B).
#
# No data is faked anywhere: if the backend is down the UI shows OFFLINE.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

# 1. Deterministic synthetic dataset (500 accounts / 2000 orders / seeded rings).
echo "[start_demo] generating dataset…"
python data/generate_dataset.py

# 2. Backend.
echo "[start_demo] starting FastAPI on ${BACKEND_HOST}:${BACKEND_PORT}…"
uvicorn api.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" --reload &
BACKEND_PID=$!

# Stop the backend when this script exits (Ctrl-C, error, or normal end).
cleanup() {
  echo "[start_demo] shutting down…"
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# Point the frontend at the local backend for this run unless already set.
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://127.0.0.1:${BACKEND_PORT}}"
export VITE_WS_URL="${VITE_WS_URL:-ws://127.0.0.1:${BACKEND_PORT}/events}"

# 3. Frontend (foreground). Prefer pnpm, fall back to npm.
echo "[start_demo] starting frontend → ${VITE_API_BASE_URL}"
if command -v pnpm >/dev/null 2>&1; then
  pnpm dev
else
  npm run dev
fi
