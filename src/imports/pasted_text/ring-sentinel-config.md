# RING SENTINEL — FINAL BACKEND CONFIGURATION & BROWSER DEMO CONNECTIVITY FIX

Work on the latest Ring Sentinel project.

## CURRENT EXACT PROBLEM

The frontend currently displays:

```text
BACKEND NOT CONFIGURED

Set VITE_API_BASE_URL (e.g. http://127.0.0.1:8000) to bind the console to the FastAPI dataset replay.
```

The latest `src/services/config.ts` intentionally has NO localhost fallback:

```text
VITE_API_BASE_URL
VITE_WS_URL
```

are read from Vite environment variables.

When they are absent:

```text
apiBaseUrl = ""
wsUrl = ""
```

and the WebSocket service correctly refuses to invent data.

The backend itself is already functional.

Therefore this is a **configuration/deployment problem**, not a detection-engine problem.

---

# ABSOLUTE RULES

DO NOT:

* add mock data
* add fallback transactions
* add fake alerts
* hardcode CONNECTED
* hardcode KPI values
* bypass WebSocket
* move risk calculation into React
* modify the risk scorer
* modify scoring weights
* modify threshold
* modify evaluation
* modify holdout
* modify dataset labels
* modify Claude architecture
* redesign the UI

The only objective is:

> Make the frontend receive the actual generated dataset through the actual FastAPI/WebSocket backend.

---

# 1. KEEP THE CURRENT CONFIGURATION ARCHITECTURE

Preserve:

```text
src/services/config.ts
```

and its environment-variable-based architecture.

Continue supporting:

```text
VITE_API_BASE_URL
VITE_WS_URL
```

`VITE_WS_URL` may remain optional and may be derived from:

```text
VITE_API_BASE_URL
```

using:

```text
http → ws
https → wss
```

---

# 2. ADD A LOCAL ENVIRONMENT TEMPLATE

Create or update:

```text
.env.example
```

with:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000/events
```

Use the actual backend WebSocket route discovered in the repository.

Do NOT commit secrets.

Do NOT put Claude API keys into frontend environment variables.

---

# 3. CREATE A LOCAL DEMO ENVIRONMENT

If appropriate, create:

```text
.env.local.example
```

or document that the developer should create:

```text
.env.local
```

with:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000/events
```

Do NOT commit `.env.local`.

The local browser demo should then work as:

```text
Browser
   ↓
Vite frontend
   ↓
http://127.0.0.1:8000
   ↓
FastAPI
   ↓
ws://127.0.0.1:8000/events
```

---

# 4. SUPPORT HOSTED DEMO CONFIGURATION

The frontend must support a public backend URL.

Document:

```text
VITE_API_BASE_URL=https://YOUR_BACKEND_HOST
VITE_WS_URL=wss://YOUR_BACKEND_HOST/events
```

Do not hardcode the placeholder.

The actual value must be supplied by the deployment environment.

---

# 5. NEVER FALL BACK TO LOCALHOST IN HOSTED MODE

Do NOT change the application to blindly assume:

```text
http://127.0.0.1:8000
```

when deployed.

If:

```text
VITE_API_BASE_URL
```

is absent, the application should honestly show:

```text
BACKEND NOT CONFIGURED
```

This behavior is correct.

---

# 6. MAKE THE ERROR MESSAGE MORE ACTIONABLE

When no backend URL is configured, show:

```text
BACKEND NOT CONFIGURED

Set VITE_API_BASE_URL to the reachable Ring Sentinel FastAPI server.

Local:
http://127.0.0.1:8000

Hosted:
https://your-backend-host
```

Do not claim that localhost will work when the frontend is hosted remotely.

---

# 7. ADD A CONNECTION DIAGNOSTIC

In development mode, show/log:

```text
API:
<configured API URL>

WebSocket:
<configured WebSocket URL>
```

This helps diagnose deployment problems.

Do not expose secrets.

Do not make the diagnostics dominate the judge-facing UI.

---

# 8. VERIFY FASTAPI HOST BINDING

Ensure the documented local command is:

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

or the project's appropriate command.

This allows the backend to be reachable when required by the demo environment.

Do not expose unnecessary services.

---

# 9. VERIFY BACKEND HEALTH

Test:

```text
GET /health
```

Expected:

```text
200 OK
```

If this fails, fix the backend startup/configuration.

Do not modify the frontend to hide the failure.

---

# 10. VERIFY WEBSOCKET

Test the actual endpoint.

Expected:

```text
WebSocket connection accepted
```

Then verify the server sends actual dataset events.

The events must originate from:

```text
data/generate_dataset.py
```

and the existing engine.

---

# 11. VERIFY BROWSER → WEBSOCKET

This is the actual acceptance test.

Open the browser.

Use DevTools:

```text
Network
→ WS
```

Verify the browser is connecting to:

```text
ws://127.0.0.1:8000/events
```

for local mode,

or:

```text
wss://YOUR-BACKEND-HOST/events
```

for hosted mode.

A successful WebSocket handshake should be visible.

Then verify messages are arriving.

---

# 12. IF USING FIGMA MAKE PREVIEW

IMPORTANT:

Figma Make's hosted/preview browser cannot automatically access a FastAPI server running on your laptop's localhost.

Therefore do NOT expect:

```text
Figma hosted frontend
        ↓
localhost:8000
```

to work unless the backend is genuinely exposed/reachable from that environment.

For Figma preview, use a reachable backend:

```text
Figma preview
        ↓
HTTPS
        ↓
public FastAPI backend
        ↓
WSS /events
```

---

# 13. DO NOT USE FRONTEND FALLBACKS

Absolutely no:

```javascript
const events = backendEvents || mockEvents;
```

No:

```text
MOCK_EVENTS
DEMO_TRANSACTIONS
SAMPLE_ALERTS
FAKE_CASES
```

If backend isn't reachable:

```text
BACKEND NOT CONFIGURED
```

or:

```text
OFFLINE
```

is the correct behavior.

---

# 14. DATA SOURCE MUST REMAIN EXPLICIT

The runtime source is:

```text
Synthetic generated dataset
        ↓
FastAPI
        ↓
Ring Sentinel engine
        ↓
WebSocket
        ↓
React
```

The frontend must never create transactions itself.

---

# 15. CHANGE UI TERMINOLOGY

Use:

```text
EVENT STREAM — DATASET REPLAY
```

instead of ambiguous:

```text
EVENT STREAM — LIVE REPLAY
```

Use:

```text
RISK ACTIVITY
risk score over dataset replay
```

Use:

```text
THREAT / RISK DISTRIBUTION
derived from replayed events
```

When connected:

```text
REPLAY CONNECTED
dataset replay active
```

Never claim:

```text
LIVE PRODUCTION TRANSACTION STREAM
```

because the dataset is synthetic.

---

# 16. PRESERVE CONNECTION STATES

Keep:

```text
CONNECTING
CONNECTED
RECONNECTING
OFFLINE
REPLAY_COMPLETE
ERROR
```

The state must come from actual WebSocket lifecycle events.

---

# 17. AUTOMATIC CONNECT

On page load:

```text
React mount
↓
connect()
↓
WebSocket onopen
↓
REPLAY CONNECTED
↓
messages
```

No manual click should be required during a correctly configured demo.

---

# 18. RETRY

Retry must actually reconnect.

It must NOT simply change the UI.

Prevent multiple simultaneous sockets.

---

# 19. PRESERVE ALL EXISTING FUNCTIONALITY

Do NOT modify:

```text
risk scoring
evaluation
holdout
graph
Claude
human action
audit
```

The existing evaluation must remain:

```text
83.3% precision
100% recall
5 TP
1 FP
0 FN
```

subject to dynamic calculation.

---

# 20. VERIFY DATASET REPLAY

Run:

```bash
python data/generate_dataset.py
```

Then start:

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

Then start the frontend.

Open the browser.

Confirm:

```text
CONNECTING
↓
REPLAY CONNECTED
↓
actual dataset events
↓
KPI updates
```

---

# 21. VERIFY NO MOCK DATA

Search for:

```text
mock
dummy
fake
sample
placeholder
fallback
demoEvents
mockEvents
```

Inspect each occurrence.

Remove only runtime fake-data paths.

Documentation/examples are allowed.

---

# 22. FINAL DEMO MODES

Document two modes.

## LOCAL

```text
.env.local

VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000/events
```

Start:

```bash
python data/generate_dataset.py
uvicorn api.main:app --host 0.0.0.0 --port 8000
npm run dev
```

Then open the Vite URL.

---

## HOSTED

Configure:

```text
VITE_API_BASE_URL=https://ACTUAL_BACKEND_HOST
VITE_WS_URL=wss://ACTUAL_BACKEND_HOST/events
```

Deploy the frontend.

Deploy the FastAPI backend separately if necessary.

Verify the judge's browser can reach both.

---

# 23. HOSTED BACKEND REQUIREMENTS

The backend deployment must:

* expose HTTPS
* support WebSockets
* allow the frontend origin
* keep the dataset available
* start FastAPI correctly
* expose `/health`
* expose `/events`
* expose `/metrics`

Do not use a hosting service/configuration that doesn't support WebSockets.

---

# 24. CORS

Configure FastAPI CORS for the actual frontend origin.

Do not simply use:

```text
*
```

without understanding the security implications.

---

# 25. WSS

If frontend is HTTPS:

```text
HTTPS frontend
      ↓
WSS
      ↓
HTTPS backend
```

Never:

```text
HTTPS
 ↓
ws://
```

---

# 26. FINAL BROWSER TEST

Do not declare success because:

```text
FastAPI works
```

The required test is:

```text
Browser loads
↓
WebSocket handshake succeeds
↓
first actual message arrives
↓
Event Stream updates
↓
KPI updates
↓
risk activity updates
```

---

# 27. FINAL EXPECTED SCREEN

The final connected state should show something equivalent to:

```text
● REPLAY CONNECTED
  dataset replay active

EVENT STREAM — DATASET REPLAY

ord_01746    acct_...    ₹...    HIGH
ord_01060    acct_...    ₹...    LOW
ord_00750    acct_...    ₹...    LOW

EVENTS RECEIVED          actual count
TRANSACTIONS ANALYZED    actual count
HIGH-RISK EVENTS         actual count
CRITICAL ALERTS          actual count
```

Every value must come from actual backend events.

---

# 28. FINAL REGRESSION

Run:

```bash
python data/generate_dataset.py
pytest -q
python eval/run_eval.py
```

Confirm the existing evaluation remains unchanged.

---

# 29. FINAL REPORT

Return:

## ROOT CAUSE

Exactly why:

```text
BACKEND NOT CONFIGURED
```

appeared.

## CONFIGURATION

Show:

```text
Local API URL:
Local WS URL:
Hosted API configuration:
Hosted WS configuration:
```

## BROWSER TEST

```text
WebSocket opened: YES/NO
First event received: YES/NO
Events displayed: YES/NO
KPI updated: YES/NO
Risk activity updated: YES/NO
```

## DATA SOURCE

Explicitly state:

```text
Runtime data:
ACTUAL GENERATED SYNTHETIC DATASET

Frontend fallback/mock data:
NONE
```

## EVALUATION

Confirm:

```text
Precision: 83.3%
Recall: 100%
TP: 5
FP: 1
FN: 0
```

## TESTS

```text
pytest:
X passed
```

---

# FINAL COMMANDMENT

The current "BACKEND NOT CONFIGURED" state is CORRECT when no backend URL has been provided.

Do not hide it.

Do not fake it.

Configure the application with a **real reachable FastAPI URL**.

For local development:

```text
127.0.0.1:8000
```

For a hosted judge demo:

```text
actual HTTPS backend
+
actual WSS WebSocket
```

The final result must be:

```text
BROWSER
   ↓
ACTUAL FASTAPI BACKEND
   ↓
ACTUAL WEBSOCKET
   ↓
ACTUAL GENERATED DATASET
   ↓
ACTUAL RING SENTINEL ENGINE
   ↓
ACTUAL REACT UI
```

No fallback data.

No mock transactions.

No fake connection state.

No scoring changes.

No evaluation changes.

**Make the real connection work.**
