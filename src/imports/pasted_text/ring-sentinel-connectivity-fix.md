# RING SENTINEL — FINAL CONNECTIVITY & DEMO STREAM REPAIR

You are working on the latest Ring Sentinel project.

The deterministic engine, evaluation, scoring methodology, tests, graph, investigation system, human-action gate, audit system, and frontend are already implemented.

DO NOT rebuild the project.

DO NOT redesign the UI.

DO NOT introduce mock transaction data.

DO NOT fabricate a live stream.

The current application has a startup/connectivity problem.

The frontend currently displays:

```text
OFFLINE
no live stream

CONNECTION OFFLINE
Stream closed

EVENTS RECEIVED
Waiting for live transaction stream

TRANSACTIONS ANALYZED
Waiting for live transaction stream

HIGH-RISK EVENTS
Waiting for live transaction stream

CRITICAL ALERTS
Waiting for live transaction stream

EVENT STREAM — LIVE REPLAY
No transaction data available
The event stream is offline.
Reconnect to a live data source to begin monitoring.
```

The screenshot shows that the frontend is running, but the backend/WebSocket stream is not successfully connecting.

Your task is to fix the actual connectivity/integration problem.

---

# 1. FIRST AUDIT THE CONNECTION ARCHITECTURE

Before changing anything, inspect:

```text
src/services/
src/
api/
api/main.py
api/routes.py
engine/
data/
package.json
vite.config.*
.env*
README
```

Find:

1. frontend API base URL
2. frontend WebSocket URL
3. backend host
4. backend port
5. WebSocket endpoint
6. CORS configuration
7. FastAPI startup configuration
8. dataset loading requirements
9. WebSocket replay implementation
10. connection retry logic

Trace the complete path:

```text
React
  ↓
config.ts / environment
  ↓
WebSocket URL
  ↓
FastAPI
  ↓
WebSocket route
  ↓
Engine / dataset
  ↓
Transaction replay
  ↓
Frontend event stream
```

Do not guess.

Find the exact cause.

---

# 2. FIX THE ROOT CAUSE, NOT THE UI SYMPTOM

Do NOT simply change:

```text
OFFLINE
```

to:

```text
CONNECTED
```

Do NOT fake connection status.

Do NOT populate the frontend with hardcoded events.

Do NOT make the UI claim success when the WebSocket is actually disconnected.

The connection indicator must reflect the actual backend state.

---

# 3. MAKE LOCAL DEMO STARTUP RELIABLE

The project should support a simple documented startup flow.

Prefer:

```bash
python data/generate_dataset.py
```

then:

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

then:

```bash
npm run dev
```

or the project's existing equivalent.

Do not change the architecture unnecessarily.

If the backend already has a startup mechanism, preserve it.

---

# 4. VERIFY THE BACKEND FIRST

Before debugging React, directly verify the backend.

Confirm that:

```text
GET /
GET /health
GET /metrics
```

or the project's equivalent endpoints respond successfully.

Then verify the WebSocket endpoint directly.

The backend must be capable of:

```text
accept connection
↓
load dataset
↓
start replay
↓
send transaction events
↓
continue until replay completes
↓
close cleanly
```

If dataset generation is required, ensure the documented startup process generates it before the backend needs it.

Do NOT silently replace missing data with mock data.

---

# 5. FIX CORS IF NECESSARY

If the frontend runs on:

```text
localhost:5173
```

and backend runs on:

```text
localhost:8000
```

ensure FastAPI CORS permits the frontend origin.

Use the actual development origins from the project.

Do not use:

```text
allow_origins=["*"]
```

unless there is a legitimate reason.

Keep configuration explicit.

---

# 6. FIX THE WEBSOCKET URL

Inspect the frontend WebSocket URL construction.

It must correctly correspond to the actual backend.

For example, conceptually:

```text
http://localhost:8000
        ↓
ws://localhost:8000/...
```

or:

```text
https://...
        ↓
wss://...
```

Do not hardcode an incorrect production URL.

Do not accidentally construct:

```text
ws://localhost:5173
```

when the WebSocket actually lives on port 8000.

The frontend must use a single authoritative configuration.

---

# 7. HANDLE HTTP → WS / HTTPS → WSS CORRECTLY

If the API base URL is configurable, derive the WebSocket protocol correctly.

Conceptually:

```text
http  → ws
https → wss
```

Do not use `ws://` blindly in an HTTPS deployment.

Do not use `wss://` against a local HTTP server.

---

# 8. VERIFY THE ACTUAL WEBSOCKET ROUTE

Find the exact backend route.

For example, if the backend exposes:

```text
/ws/events
```

the frontend must connect to exactly that route.

Do not invent a new route if one already exists.

If the existing route is broken, fix it rather than creating duplicate WebSocket implementations.

---

# 9. VERIFY DATASET LOADING

The WebSocket should not fail because:

```text
accounts.csv
orders.csv
```

are missing.

The project currently uses generated synthetic data.

The startup process should ensure the required dataset exists.

Preferred flow:

```text
generate_dataset.py
        ↓
accounts.csv
orders.csv
        ↓
FastAPI
        ↓
Engine
        ↓
WebSocket replay
```

Do NOT use:

```text
mock transactions
dummy accounts
fake graph nodes
placeholder alerts
```

as a fallback.

---

# 10. DO NOT CALL SYNTHETIC DATA "REAL LIVE DATA"

This is extremely important.

The stream is a dataset replay.

Therefore change misleading UI wording:

Current:

```text
EVENT STREAM — LIVE REPLAY
```

This can be retained only if the wording clearly communicates replay.

Prefer:

```text
EVENT STREAM — DATASET REPLAY
```

or:

```text
EVENT STREAM — LIVE REPLAY
Synthetic dataset
```

The top status could say:

```text
REPLAY CONNECTED
```

rather than:

```text
LIVE
```

This is more honest and actually makes the architecture look more deliberate.

---

# 11. CREATE A CLEAR CONNECTION STATE MODEL

The frontend should distinguish:

```text
CONNECTING
CONNECTED
DISCONNECTED
RECONNECTING
REPLAY_COMPLETE
ERROR
```

Do not collapse everything into OFFLINE.

Recommended visual states:

### Connecting

```text
CONNECTING
Establishing replay stream...
```

### Connected

```text
REPLAY CONNECTED
Dataset replay active
```

### Reconnecting

```text
RECONNECTING
Retrying stream...
```

### Replay completed

```text
REPLAY COMPLETE
All dataset events processed
```

### Error

```text
STREAM ERROR
Backend unavailable
```

The actual visual style should match the existing design system.

Do not redesign the page.

---

# 12. IMPORTANT: CONNECT AUTOMATICALLY ON PAGE LOAD

When the dashboard loads:

```text
React mounts
↓
WebSocket connection starts
↓
backend accepts
↓
replay begins
↓
events appear
```

The user should NOT have to discover a hidden button before seeing the system work.

Keep the existing retry button as a manual fallback.

---

# 13. FIX RECONNECTION

If the backend temporarily disconnects:

```text
CONNECTED
    ↓
DISCONNECTED
    ↓
RECONNECTING
    ↓
CONNECTED
```

Use bounded retry/backoff.

Do NOT create an infinite aggressive reconnect loop.

Do NOT open multiple simultaneous WebSockets.

Ensure cleanup occurs when the component unmounts.

---

# 14. PREVENT DUPLICATE CONNECTIONS

React development mode may cause lifecycle behavior that accidentally creates multiple connections.

Ensure:

```text
one dashboard
→ one active WebSocket
```

Clean up the socket when necessary.

Do not create duplicate event streams.

---

# 15. DO NOT FAKE KPI VALUES

When connected:

```text
Events received
Transactions analyzed
High-risk events
Critical alerts
Active investigations
Detection latency
```

must be derived from actual replayed events and engine results.

When disconnected:

show an honest disconnected state.

Do NOT show:

```text
500 events
23 alerts
7 investigations
```

just because the UI needs something to display.

---

# 16. FIRST EVENTS MUST ACTUALLY ARRIVE

After successful connection, the frontend should begin receiving real dataset events.

The event should flow through:

```text
dataset
↓
backend
↓
engine
↓
WebSocket
↓
React
↓
event stream
```

The frontend must not independently invent the events.

---

# 17. ENSURE HIGH-RISK EVENTS ARE VISIBLE DURING DEMO

The existing dataset contains seeded abuse rings.

The replay should naturally reach transactions belonging to those rings.

Do NOT modify the dataset merely to make the demo look better.

Do NOT inject a fake "critical event".

Do NOT special-case an account for the demo.

Use the existing dataset.

If the replay is sequential, ensure the seeded events are actually emitted during the normal replay window.

---

# 18. MAKE REPLAY SPEED DEMO-FRIENDLY

If the existing replay is too slow, you may add a configurable replay interval.

For example:

```text
REPLAY_INTERVAL_MS
```

with a reasonable demo default.

This must remain actual dataset replay.

Do NOT create artificial events.

The purpose is simply to allow the judge to observe the system within a few minutes.

---

# 19. SHOW ACTUAL ENGINE RESULTS

Each replayed event should be capable of contributing to:

```text
risk score
risk level
case
graph relationship
investigation
```

The frontend must display actual backend values.

For suspicious activity, the judge should eventually see:

```text
transaction
↓
account relationship
↓
network evidence
↓
risk score
↓
high/critical case
```

---

# 20. PRESERVE THE EXISTING EVALUATION

DO NOT change:

```text
83.3% precision
100% recall
5 TP
1 FP
0 FN
```

Do not modify scoring weights.

Do not modify threshold.

Do not change holdout.

Do not alter the evaluation methodology.

This task is ONLY about application connectivity/demo reliability.

---

# 21. PRESERVE HUMAN-IN-THE-LOOP

The replay must never automatically:

```text
block
ban
suspend
delete
```

If a case becomes actionable, the existing human controls remain:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

Human action remains mandatory.

---

# 22. PRESERVE CLAUDE ISOLATION

Claude remains an optional narration layer.

If Claude is unavailable:

```text
event stream still works
risk scoring still works
graph still works
evaluation still works
human action still works
audit still works
```

Do not make the WebSocket depend on Claude.

---

# 23. FIX THE "LIVE RISK ACTIVITY" PANEL

The current panel says:

```text
LIVE RISK ACTIVITY
risk score over time
```

If it is displaying dataset replay, rename it appropriately:

```text
REPLAY RISK ACTIVITY
risk score over replay
```

or:

```text
RISK ACTIVITY
risk score over dataset replay
```

Only use "LIVE" when it clearly means the UI is receiving events live from the replay connection, not that the underlying transactions are real production traffic.

---

# 24. FIX THE EMPTY STATE

Current:

```text
No transaction data available
The event stream is offline.
Reconnect to a live data source to begin monitoring.
```

Replace with something truthful and useful.

For example:

### Before connection

```text
Connecting to dataset replay...
```

### If backend unavailable

```text
Replay unavailable

The Ring Sentinel backend is not reachable.

Start the backend and retry the connection.
```

### If connected

Do not show the empty state.

### If replay completed

```text
Replay complete

All available transactions have been analyzed.
```

---

# 25. MAKE STARTUP ERROR ACTIONABLE

If connection fails, show enough information for the developer/demo operator to understand the problem.

For example:

```text
Backend unavailable
Expected API: configured backend
Expected stream: configured WebSocket endpoint
```

Do not expose secrets.

Do not expose internal stack traces to judges.

---

# 26. VERIFY THE RETRY BUTTON

The existing:

```text
Retry
Retry Connection
```

buttons must actually reconnect.

Do not create buttons that merely change UI state.

Clicking Retry must:

```text
close stale socket
↓
create fresh connection
↓
authenticate/configure if required
↓
resume replay
```

using the existing architecture.

---

# 27. TEST CONNECTION FAILURE

Test:

### Backend running

Expected:

```text
CONNECTED / REPLAY CONNECTED
events arriving
```

### Backend stopped

Expected:

```text
OFFLINE / BACKEND UNAVAILABLE
```

### Backend restarted

Expected:

```text
RECONNECTING
↓
CONNECTED
↓
events arriving
```

### Replay completed

Expected:

```text
REPLAY COMPLETE
```

No fake data should appear in any state.

---

# 28. ADD AUTOMATED TESTS

Add only useful tests.

Test:

```text
WebSocket URL construction
connection state transitions
backend WebSocket route
dataset replay
reconnection
event parsing
```

Do not delete existing tests.

All previous tests must continue passing.

---

# 29. VERIFY COMPLETE DEMO FLOW

After fixing the connection, run the complete application.

The expected experience should be:

```text
Open dashboard
      ↓
Connecting...
      ↓
Replay connected
      ↓
Transaction events appear
      ↓
KPIs populate
      ↓
Risk activity appears
      ↓
Suspicious network appears
      ↓
Investigation case appears
      ↓
Graph shows shared attributes
      ↓
Risk evidence appears
      ↓
Claude narration available if configured
      ↓
Human action
      ↓
Audit record
      ↓
Evaluation panel
```

Everything must use real project data.

---

# 30. DO NOT BREAK OFFLINE HONESTY

If the backend genuinely cannot connect, the UI MUST continue to say:

```text
OFFLINE
```

Do not solve the screenshot problem by pretending the backend is connected.

The goal is:

```text
actual connection
```

not:

```text
fake CONNECTED badge
```

---

# 31. FINAL VERIFICATION COMMANDS

Run:

```bash
python data/generate_dataset.py
pytest -q
python eval/run_eval.py
```

Then start backend and frontend using the documented commands.

Open the dashboard.

Verify that events actually appear.

Capture the browser console/network output if necessary to diagnose failures.

Do not declare success until a real WebSocket connection has been established.

---

# 32. FINAL ACCEPTANCE CRITERIA

The task is complete only when:

* [ ] Backend starts successfully
* [ ] Frontend starts successfully
* [ ] Frontend connects to correct backend
* [ ] WebSocket connects successfully
* [ ] Dataset loads successfully
* [ ] Real dataset replay events arrive
* [ ] No runtime mock data
* [ ] KPI values are dynamically derived
* [ ] Risk events appear
* [ ] Graph receives real relationships
* [ ] Investigation cases appear
* [ ] Retry works
* [ ] Reconnection works
* [ ] Replay completion is handled
* [ ] Offline state remains truthful
* [ ] Claude remains optional
* [ ] Human action gate remains intact
* [ ] Audit remains intact
* [ ] `/metrics` remains intact
* [ ] Existing evaluation remains unchanged
* [ ] 47+ tests pass
* [ ] 83.3% precision remains
* [ ] 100% recall remains
* [ ] 5 TP / 1 FP / 0 FN remains
* [ ] evaluation remains reproducible

---

# 33. FINAL REPORT

Return:

## ROOT CAUSE

Exactly why the frontend was showing:

```text
OFFLINE
Stream closed
```

## FIX

Exactly what was changed.

## CONNECTION

```text
Frontend:
Backend:
WebSocket:
Dataset:
Replay:
```

## TESTS

```text
pytest:
X passed
```

## EVALUATION

Confirm that the existing evaluation remains:

```text
Precision: 83.3%
Recall: 100%
TP: 5
FP: 1
FN: 0
```

## DEMO VERIFICATION

Confirm that opening the dashboard results in:

```text
CONNECTING
→ REPLAY CONNECTED
→ actual events
→ risk analysis
```

## FILES CHANGED

List only actual modifications.

---

# FINAL RULE

The screenshot problem must be solved by making the **real backend-to-frontend data path work**.

Never solve it by:

* hardcoding CONNECTED
* hardcoding transactions
* adding fake alerts
* adding fake graph nodes
* adding mock API responses
* bypassing the WebSocket
* fabricating timestamps
* claiming synthetic transactions are real production payments

Ring Sentinel's strongest advantage is that the demo can show a complete chain:

**real executable backend → deterministic engine → actual synthetic evaluation data → network graph → explainable risk → human decision → audit.**

Make that chain work reliably.

Do not change the detector.
Do not change the evaluation.
Do not redesign the UI.

**Fix connectivity and make the existing system actually come alive.**
