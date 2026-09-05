# RING SENTINEL — FINAL FRONTEND/BACKEND CONNECTIVITY & DEMO FIX

You are working on the latest uploaded Ring Sentinel project.

## CURRENT VERIFIED STATE

The Ring Sentinel backend has already been independently verified.

The following works:

```text
FastAPI starts successfully
GET /health → 200 OK
WebSocket /events → connection accepted
WebSocket sends actual dataset events
Deterministic engine works
Evaluation works
47+ tests pass
```

The evaluation must remain frozen at approximately:

```text
Precision: 83.3%
Recall: 100.0%
TP: 5
FP: 1
FN: 0
Simulated/pre-payout value: ₹247,888
FP investigation cost: ₹0
```

The current problem is that the browser/frontend displays:

```text
CONNECTING
no live stream
```

and eventually:

```text
OFFLINE
Stream closed

Replay unavailable

The Ring Sentinel backend is not reachable.
Start it (uvicorn api.main:app) and retry
```

even though the FastAPI backend and WebSocket work when tested directly.

Therefore this task is ONLY to fix the **frontend-to-backend connectivity/configuration and demo startup path**.

---

# 🚨 ABSOLUTE RULE

DO NOT modify the detection algorithm.

DO NOT modify the risk scorer.

DO NOT modify scoring weights.

DO NOT modify thresholds.

DO NOT modify the holdout.

DO NOT modify the dataset.

DO NOT modify evaluation methodology.

DO NOT add ML models.

DO NOT add mock data.

DO NOT add fake transactions.

DO NOT hardcode CONNECTED.

DO NOT fake WebSocket events.

DO NOT bypass the backend.

DO NOT redesign the frontend.

Do not solve the problem by hiding the OFFLINE state.

The goal is:

> **Make the browser connect to the actual working FastAPI/WebSocket backend.**

---

# 1. AUDIT THE CURRENT FRONTEND CONNECTION

Inspect:

```text
src/services/
src/services/config.ts
src/
package.json
vite.config.*
.env
.env.*
api/
api/main.py
api/routes.py
README.md
```

Find exactly:

```text
API base URL
WebSocket URL
WebSocket route
frontend port
backend port
CORS configuration
connection retry logic
environment variables
```

Trace:

```text
Browser
   ↓
React
   ↓
config.ts
   ↓
WebSocket URL
   ↓
FastAPI
   ↓
/events
   ↓
dataset replay
   ↓
React
```

Identify the exact reason the browser is failing to connect.

Do not guess.

---

# 2. FIX THE LOCAL DEVELOPMENT CONFIGURATION

The frontend currently appears to assume something equivalent to:

```text
http://localhost:8000
ws://localhost:8000/events
```

Make this configurable.

Use environment variables such as:

```text
VITE_API_BASE_URL
VITE_WS_URL
```

or the project's existing configuration mechanism.

Do not create multiple competing configuration systems.

---

# 3. CORRECT DEFAULT LOCAL CONFIGURATION

For local development, the default should correctly point to the FastAPI server.

Conceptually:

```text
API:
http://localhost:8000

WebSocket:
ws://localhost:8000/events
```

Use the actual route discovered in the code.

Do NOT assume `/events` if the repository uses a different route.

---

# 4. IMPORTANT: DO NOT ASSUME BROWSER LOCALHOST IS THE BACKEND

The project must support situations where the frontend and backend are not served from the same origin.

For example:

```text
Frontend:
https://frontend-host

Backend:
https://backend-host
```

Then the frontend must connect to:

```text
wss://backend-host/...
```

not:

```text
wss://frontend-host/...
```

and not:

```text
ws://localhost:8000/...
```

unless localhost is actually where the backend is reachable.

---

# 5. CORRECTLY DERIVE HTTP / WEBSOCKET PROTOCOLS

If only the API URL is configured, derive the WebSocket protocol correctly:

```text
http://  → ws://
https:// → wss://
```

Example:

```text
VITE_API_BASE_URL=http://localhost:8000
```

should result in:

```text
ws://localhost:8000/events
```

while:

```text
VITE_API_BASE_URL=https://example-backend.com
```

should result in:

```text
wss://example-backend.com/events
```

Do not use `ws://` against HTTPS.

Do not use `wss://` against a plain local HTTP server.

---

# 6. REMOVE TRAILING-SLASH BUGS

Handle configuration safely if someone provides:

```text
http://localhost:8000/
```

instead of:

```text
http://localhost:8000
```

Avoid accidentally generating:

```text
http://localhost:8000//events
```

or:

```text
ws://localhost:8000//events
```

Use one normalized URL builder.

---

# 7. DO NOT DUPLICATE CONNECTION LOGIC

There should be one authoritative WebSocket connection service/hook.

Avoid:

```text
Dashboard opens socket
AND
EventStream opens socket
AND
another component opens socket
```

The desired architecture is:

```text
Application
    ↓
one WebSocket service
    ↓
one connection
    ↓
event distribution
    ↓
components
```

Ensure React unmounting cleans up the socket.

---

# 8. HANDLE REACT DEVELOPMENT MODE

Check whether React Strict Mode or component lifecycle behavior causes:

```text
connect
disconnect
connect
```

or multiple simultaneous sockets.

Ensure there is never an uncontrolled collection of duplicate WebSocket connections.

One active dashboard session should use one active stream.

---

# 9. AUTOMATICALLY CONNECT ON DASHBOARD LOAD

When the dashboard loads:

```text
React mounts
↓
connection begins
↓
CONNECTING
↓
WebSocket accepted
↓
REPLAY CONNECTED
↓
events arrive
```

The user should not have to click Retry just to start the normal demo.

Keep the Retry button for genuine failures.

---

# 10. CONNECTION STATE MUST BE REAL

Implement explicit states:

```text
CONNECTING
CONNECTED
RECONNECTING
DISCONNECTED
REPLAY_COMPLETE
ERROR
```

The UI state must be based on actual WebSocket events.

Do NOT do:

```javascript
setConnected(true)
```

unless the WebSocket's `onopen` actually fires.

Do NOT display:

```text
CONNECTED
```

while the socket is closed.

---

# 11. IMPROVE THE STATUS COPY

The underlying data is a synthetic dataset replay.

Therefore use truthful wording.

When connecting:

```text
CONNECTING
dataset replay
```

When connected:

```text
REPLAY CONNECTED
dataset replay active
```

When disconnected:

```text
OFFLINE
replay stream unavailable
```

When complete:

```text
REPLAY COMPLETE
all available events processed
```

Do NOT claim:

```text
LIVE PRODUCTION DATA
REAL PAYMENT STREAM
```

---

# 12. FIX THE EVENT STREAM TITLE

Current UI:

```text
EVENT STREAM — LIVE REPLAY
```

Prefer:

```text
EVENT STREAM — DATASET REPLAY
```

or:

```text
EVENT STREAM — LIVE DATASET REPLAY
```

The exact wording should fit the existing design.

The important thing is that "replay" remains explicit.

---

# 13. FIX THE RISK ACTIVITY COPY

Current wording may say:

```text
LIVE RISK ACTIVITY
risk score over time
```

Change to:

```text
RISK ACTIVITY
risk score over dataset replay
```

or:

```text
REPLAY RISK ACTIVITY
risk score over replay
```

Do not imply production transactions.

---

# 14. FIX THE THREAT DISTRIBUTION COPY

If it currently says:

```text
derived from live events
```

change to:

```text
derived from replayed events
```

or:

```text
derived from dataset replay
```

This is a small but important honesty improvement.

---

# 15. FIX THE EMPTY STATE

When connection has not yet been established:

```text
Connecting to dataset replay...
```

When backend is unreachable:

```text
Replay unavailable

The Ring Sentinel backend is not reachable.

Start the backend and retry the connection.
```

When connected:

DO NOT show an empty state.

When replay finishes:

```text
Replay complete

All available dataset events have been analyzed.
```

---

# 16. FIX THE RETRY BUTTON

The Retry button must actually reconnect.

On click:

```text
close stale socket if necessary
↓
clear old listeners
↓
create new socket
↓
connect to configured backend
↓
resume dataset replay
```

Do not simply change the UI from:

```text
OFFLINE
```

to:

```text
CONNECTING
```

without actually reconnecting.

---

# 17. PREVENT MULTIPLE REPLAY STREAMS

If Retry is clicked repeatedly, do not start multiple simultaneous streams.

Use a connection guard.

Expected:

```text
Retry
Retry
Retry
```

should still result in:

```text
one active WebSocket
one active replay
```

not:

```text
three WebSockets
three replay streams
duplicate transactions
```

---

# 18. VERIFY BACKEND CORS

Inspect FastAPI CORS.

If the frontend runs on a different origin/port, explicitly allow the actual frontend origin.

For local development, if frontend is:

```text
http://localhost:5173
```

and backend:

```text
http://localhost:8000
```

ensure the backend permits the frontend origin.

Also account for the actual Vite port used by this project.

Do not blindly use:

```text
allow_origins=["*"]
```

unless required.

---

# 19. VERIFY HOST BINDING

For local/remote demo environments, verify whether FastAPI is bound to:

```text
127.0.0.1
```

or:

```text
0.0.0.0
```

If the browser is accessing the backend through another interface/container/host, binding only to `127.0.0.1` may make the backend inaccessible externally.

For a development/demo server, use the appropriate host configuration.

Do not expose the service unnecessarily in production.

---

# 20. VERIFY THE VITE DEV SERVER

Inspect:

```text
vite.config.*
package.json
```

Determine the actual frontend port.

Do not assume 5173.

If the project uses:

```text
8443
```

or another port, use the actual port consistently.

Document it.

---

# 21. SUPPORT ENVIRONMENT CONFIGURATION

Create/update:

```text
.env.example
```

with something like:

```text
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/events
```

Use the actual endpoint.

Do not commit secrets.

Do not commit personal API keys.

---

# 22. MAKE THE README STARTUP FLOW EXPLICIT

The README should contain an exact local startup sequence.

Example:

```bash
# 1. Generate deterministic dataset
python data/generate_dataset.py

# 2. Start backend
uvicorn api.main:app --host 0.0.0.0 --port 8000

# 3. Start frontend
npm install
npm run dev
```

Then:

```text
Open the frontend URL shown by Vite.
```

Explain:

```text
Frontend → FastAPI → WebSocket → Dataset Replay
```

Do not require the user to guess ports.

---

# 23. IF FRONTEND/BACKEND ARE DEPLOYED SEPARATELY

Support:

```text
VITE_API_BASE_URL
VITE_WS_URL
```

so the same frontend build can connect to an externally reachable backend.

Example:

```text
Frontend:
https://ring-sentinel-ui.example

Backend:
https://ring-sentinel-api.example

WebSocket:
wss://ring-sentinel-api.example/events
```

Do not hardcode localhost into production/demo configuration.

---

# 24. DO NOT CREATE A FRONTEND FALLBACK

Absolutely no:

```text
if backend unavailable:
    show demo events
```

No:

```text
MOCK_EVENTS
DEMO_TRANSACTIONS
SAMPLE_CASES
FAKE_RISK
```

The frontend must either display:

```text
actual backend data
```

or:

```text
honest unavailable state
```

---

# 25. EVENT DATA MUST REMAIN BACKEND-DERIVED

When connected, every event must come from:

```text
generated dataset
↓
FastAPI
↓
engine
↓
WebSocket
↓
React
```

The frontend must not independently calculate or invent risk.

---

# 26. VERIFY THE FIRST REAL EVENT

After connection, verify the browser actually receives a WebSocket message.

Do not consider:

```text
socket.onopen
```

alone sufficient.

Confirm:

```text
onopen
↓
message
↓
JSON parse
↓
React state update
↓
event appears
```

---

# 27. VERIFY KPI CALCULATIONS

Once events arrive:

```text
EVENTS RECEIVED
```

must increase based on actual received events.

```text
TRANSACTIONS ANALYZED
```

must reflect actual processed transactions.

```text
HIGH-RISK EVENTS
```

must reflect actual engine results.

```text
CRITICAL ALERTS
```

must reflect actual risk levels.

```text
ACTIVE INVESTIGATIONS
```

must reflect actual generated cases.

```text
DETECTION LATENCY
```

must be calculated from actual processing/replay timing if implemented.

Do not create fake numbers merely to fill cards.

---

# 28. VERIFY HIGH-RISK CASES APPEAR

The existing dataset contains seeded abuse rings.

During normal replay, the frontend should eventually receive events associated with those rings.

The resulting system should naturally produce:

```text
high-risk events
investigation cases
graph relationships
risk evidence
```

Do NOT inject a special demo alert.

Do NOT reorder or alter ground-truth labels to make a case appear.

Use the existing dataset.

---

# 29. KEEP THE EVALUATION SEPARATE FROM THE REPLAY

The holdout evaluation is already validated.

Do not make the WebSocket replay responsible for calculating evaluation metrics.

Keep:

```text
Replay
```

and:

```text
Evaluation
```

as separate concerns.

The replay demonstrates runtime behavior.

The evaluation panel demonstrates offline benchmark performance.

---

# 30. PRESERVE `/metrics`

Do not modify evaluation logic.

Verify:

```text
GET /metrics
```

still returns the existing calculated evaluation.

Frontend evaluation panel must continue consuming backend values.

---

# 31. PRESERVE THE HUMAN ACTION GATE

Do not modify:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

No automatic blocking.

No automatic banning.

No automatic suspension.

No automatic deletion.

The connectivity fix must not bypass the existing action gate.

---

# 32. PRESERVE CLAUDE ISOLATION

Claude remains optional.

The WebSocket must NOT depend on Claude being available.

If Claude fails:

```text
stream works
risk works
graph works
investigation works
evaluation works
human actions work
audit works
```

Only narration should fail.

---

# 33. ADD CONNECTION DIAGNOSTICS

In development mode, provide useful diagnostics for:

```text
WebSocket URL
connection state
close code
close reason
```

Do not expose sensitive information.

This is to make future demo debugging easy.

For example:

```text
Replay stream:
ws://localhost:8000/events

Status:
CONNECTED
```

or:

```text
Status:
ERROR
Reason:
Connection refused
```

Keep detailed diagnostics out of the main judge-facing UI if they clutter it.

---

# 34. TEST THE ACTUAL BROWSER FLOW

Do not stop after testing FastAPI.

The acceptance test must be:

```text
Start backend
↓
Start frontend
↓
Open browser
↓
Dashboard mounts
↓
WebSocket connects
↓
Actual dataset event arrives
↓
Event appears in UI
↓
KPIs update
```

This is the actual bug we need to solve.

---

# 35. TEST FAILURE / RECOVERY

Test:

### Backend OFF

Expected:

```text
OFFLINE
```

### Backend ON

Expected:

```text
CONNECTING
↓
REPLAY CONNECTED
↓
events arrive
```

### Backend restarted

Expected:

```text
RECONNECTING
↓
REPLAY CONNECTED
↓
events arrive
```

### Replay ends

Expected:

```text
REPLAY COMPLETE
```

No fake events in any state.

---

# 36. DO NOT CHANGE THE EVALUATION NUMBERS

After connectivity fixes, run:

```bash
pytest -q
python eval/run_eval.py
```

The evaluation should still produce approximately:

```text
Precision: 83.3%
Recall: 100.0%
TP: 5
FP: 1
FN: 0
```

If connectivity changes cause evaluation changes, investigate immediately.

Do not "fix" the metrics by changing scoring.

---

# 37. FINAL ACCEPTANCE CRITERIA

The project is complete only when ALL are true:

### Backend

* [ ] FastAPI starts
* [ ] `/health` returns 200
* [ ] `/metrics` works
* [ ] WebSocket accepts connections
* [ ] WebSocket sends actual events
* [ ] dataset loads

### Frontend

* [ ] React starts
* [ ] correct API URL
* [ ] correct WebSocket URL
* [ ] no localhost hardcoding where inappropriate
* [ ] environment configuration works
* [ ] automatic connection on page load
* [ ] Retry works
* [ ] reconnection works
* [ ] connection state is truthful

### Stream

* [ ] actual dataset events appear
* [ ] no mock events
* [ ] no fake alerts
* [ ] no fake graph data
* [ ] KPI values update dynamically
* [ ] replay completion handled

### Honesty

* [ ] dataset replay clearly identified
* [ ] no "real production stream" claim
* [ ] no fake LIVE status
* [ ] no fake transactions

### Regression

* [ ] scoring unchanged
* [ ] threshold unchanged
* [ ] holdout unchanged
* [ ] evaluation unchanged
* [ ] Claude isolation unchanged
* [ ] human action gate unchanged
* [ ] audit unchanged
* [ ] all tests pass

---

# 38. FINAL REPORT

When finished, return:

## ROOT CAUSE

Explain precisely why the browser was showing:

```text
CONNECTING
```

and:

```text
OFFLINE — Stream closed
```

despite the backend working.

## FIXES

List every file changed and why.

## CONNECTION

Report:

```text
Frontend URL:
API URL:
WebSocket URL:
Backend port:
Frontend port:
CORS:
```

## BROWSER VERIFICATION

Confirm:

```text
Page loaded:
WebSocket opened:
First event received:
Events displayed:
KPIs updated:
Risk activity updated:
```

## FAILURE/RECOVERY

Confirm:

```text
Backend unavailable → honest OFFLINE
Backend starts → automatic CONNECTED
Retry → actual reconnection
Replay completion → REPLAY COMPLETE
```

## TESTS

```text
pytest:
X passed
```

## EVALUATION REGRESSION

Confirm:

```text
Precision:
Recall:
TP:
FP:
FN:
```

and confirm the evaluation methodology was NOT changed.

---

# FINAL COMMANDMENT

The screenshot shows an **integration problem**, not a detection problem.

The backend already works.

The deterministic engine already works.

The evaluation already works.

Therefore:

**DO NOT TOUCH THE CORE DETECTOR.**

Fix only:

```text
browser
   ↓
frontend configuration
   ↓
actual reachable backend
   ↓
WebSocket
   ↓
dataset replay
   ↓
frontend event rendering
```

The desired final screenshot should show:

```text
REPLAY CONNECTED
dataset replay active
```

with actual transaction events appearing in the Event Stream and the KPI cards updating from those events.

It must NOT show fabricated data.

It must NOT claim production real-time traffic.

It must NOT require the judge to manually understand how to start hidden services.

The final demo should make the system feel alive because the **real backend is actually feeding the UI**, not because the UI is pretending.

**Fix the connection. Verify the browser. Preserve everything else.**
