# Ring Sentinel — 5-Minute Demo Script

> Read this as written. Do not improvise the risk claims.

**Setup before recording:** `python data/generate_dataset.py` → start backend
(`uvicorn api.main:app --reload`) → start frontend (`pnpm dev`). Have
`ANTHROPIC_API_KEY` set for beats 1–2, ready to unset for beat 3.

---

### 1. Normal case (a real suspicious ring)
- Open the dashboard. Point out the connection pill shows **LIVE REPLAY** — the
  WebSocket is genuinely connected and streaming engine-scored events from the
  dataset replay (honest wording; this is not production real-time ingestion).
- Open the top alert / a critical transaction. The **investigation drawer** shows the
  cluster: multiple accounts, the **entity graph** with shared-attribute edges, the
  deterministic **risk score**, and the **"Why was this flagged?"** evidence — shared
  device + card + elevated velocity + promo abuse, each with its point contribution.
- The **AI dossier** narrates it in plain language. Note: the score was computed
  before Claude was called.
- Click **HOLD PAYOUT**. Show the green **"HOLD_PAYOUT recorded"** confirmation with
  the audit hash.

### 2. Edge case (legitimate look-alike)
- Open a family/office cluster (shares only an address or office IP).
- Show the evidence line **"Single weak shared identifier … consistent with a
  legitimate family/office"** and the **low/normal** score. Ring Sentinel is not
  `shared identifier = fraud`.

### 3. Failure case (kill Claude on stage)
- Stop the backend, `unset ANTHROPIC_API_KEY`, restart it. Open another case.
- The dossier panel shows **"AI narration unavailable. Showing deterministic evidence
  and risk score."** — while the graph, score, and evidence all still render.

### 4. Metrics (holdout, both systems)
- In a terminal: `python eval/run_eval.py`.
- Read the table: **naive baseline vs Ring Sentinel**, precision / recall / ₹ prevented
  / false-positive cost, computed only on the untouched 20% holdout.

### 5. Audit trail
- `tail -n 1 logs/audit.jsonl`. Point at the human action, the timestamp, and the
  `previous_hash` → `current_hash` chain that recorded the click from beat 1.

### 6. Close
> "Ring Sentinel does not replace the risk analyst. It compresses a network-level
> investigation into an auditable case file while keeping the final action
> human-controlled."
