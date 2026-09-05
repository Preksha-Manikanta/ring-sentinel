# RING SENTINEL — FORCE-FIX EXISTING PROJECT

## DO NOT REBUILD. DO NOT REDESIGN. FIX THE EXISTING PROJECT.

You are working on the **existing Ring Sentinel project provided in the uploaded ZIP**.

This is a **repair and completion task**, NOT a request to create a new application.

The existing frontend/UI is already substantially built.

Your job is to:

> **AUDIT → IDENTIFY MISMATCHES → FIX ONLY THE MISMATCHES → CONNECT EVERYTHING → TEST EVERYTHING**

Do NOT replace the existing project with a new architecture.

Do NOT redesign the UI.

Do NOT remove working components.

Do NOT create a second implementation of the same feature.

Do NOT simplify the project by deleting functionality.

Preserve the existing visual design, React components, layout, graph interface, investigation interface, services, state management, and UX wherever they already work.

The goal is to make the CURRENT PROJECT conform to the Ring Sentinel specification below.

---

# 1. NON-NEGOTIABLE RULE

The uploaded project is the source of truth for the existing UI.

The Ring Sentinel specification below is the source of truth for the missing functionality.

Therefore:

```text
EXISTING UI
    +
MISSING REAL BACKEND / ENGINE / EVALUATION / AUDIT
    =
FINAL RING SENTINEL
```

NOT:

```text
DELETE EXISTING PROJECT
        ↓
BUILD NEW PROJECT
```

---

# 2. FIRST ACTION — AUDIT THE EXISTING PROJECT

Before changing anything:

1. Inspect the entire uploaded ZIP.
2. Inspect every source file.
3. Identify the existing:

   * dashboard
   * graph
   * case/investigation panel
   * risk UI
   * alerts
   * metrics
   * API client
   * WebSocket implementation
   * services
   * state management
   * TypeScript types
   * existing backend/integration code
4. Identify all existing mock/static/demo data.
5. Identify all existing API assumptions.
6. Identify all missing functionality required below.

Then create an internal checklist:

```text
EXISTING AND WORKING
EXISTING BUT BROKEN
EXISTING BUT MOCKED
MISSING
CONFLICTING WITH SPEC
```

Fix these systematically.

Do NOT immediately start rewriting files.

---

# 3. PRESERVE THE EXISTING FRONTEND

The current frontend is valuable.

KEEP:

* existing React/Vite setup
* existing components
* existing dashboard
* existing graph visualization
* existing investigation panel
* existing risk displays
* existing alert interface
* existing metrics interface
* existing styles
* existing responsive behavior
* existing API service layer
* existing WebSocket service if useful
* existing state management

Only modify frontend code when necessary to connect it to the real backend.

### DO NOT:

* redesign the dashboard
* replace React
* replace the graph library unnecessarily
* introduce another frontend
* change the visual identity
* add unnecessary animations
* create a new component system
* rebuild working components

---

# 4. REMOVE FAKE DATA — BUT KEEP SYNTHETIC DATA

There is an important distinction.

### ALLOWED

The project may use a **real generated synthetic dataset**:

```text
500 accounts
2000 orders
6–8 seeded abuse rings
legitimate look-alike clusters
20% holdout
```

This is valid because it is the evaluation dataset.

### NOT ALLOWED

The frontend must NOT contain:

```text
mockTransactions
fakeAlerts
hardcodedClusters
fakeMetrics
fakeRiskScores
fakeInvestigations
fakeLLMResponses
random dashboard numbers
static demo results pretending to be live
```

If such data exists, replace it with calls to the actual backend.

The UI should display the result of the real:

```text
dataset
→ graph engine
→ risk scorer
→ API
```

pipeline.

---

# 5. DO NOT CHANGE THE PRODUCT THESIS

Ring Sentinel remains:

> A network-level abuse detection and investigation system with deterministic detection, AI-assisted explanation, and mandatory human review.

It is NOT:

* a fraud chatbot
* an autonomous fraud blocker
* an onboarding KYC system
* a generic AI agent
* a payment processor
* a Bumblebee clone

---

# 6. REQUIRED FINAL ARCHITECTURE

The existing project must ultimately connect like this:

```text
                SYNTHETIC DATASET
                500 ACCOUNTS
                2000 ORDERS
                       │
                       ▼
               NETWORKX GRAPH
                       │
                       ▼
           DETERMINISTIC RISK ENGINE
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
      CASE EVIDENCE          HOLDOUT EVAL
            │
            ▼
       CLAUDE NARRATOR
       EXPLANATION ONLY
            │
            ▼
       FASTAPI BACKEND
            │
            ▼
       EXISTING REACT UI
            │
            ▼
       HUMAN ANALYST
            │
       ┌────┼────┐
       ▼    ▼    ▼
     WATCH HOLD ESCALATE
            │
            ▼
      HASH-CHAIN AUDIT
```

The critical boundaries are:

```text
LLM ≠ detector
LLM ≠ risk scorer
LLM ≠ autonomous decision maker
```

and:

```text
NO AUTO-BLOCK
```

---

# 7. ADD THE MISSING DATA PIPELINE

If missing, create:

```text
data/generate_dataset.py
data/schema.md
```

Generate:

```text
500 accounts
2000 orders
6–8 seeded rings
4–12 accounts per ring
```

Each seeded ring must contain at least:

```text
2 shared hidden attributes
```

from:

```text
device_id
ip_address
address
card_fingerprint
upi_id
phone_number
```

The rings must also have behavioral signals such as:

```text
high transaction velocity
promo abuse
refund concentration
suspicious account creation timing
shared payment infrastructure
```

---

# 8. ADD LEGITIMATE LOOK-ALIKE CASES

This is mandatory.

Include legitimate:

### Family

Shared:

```text
address
```

but separate:

```text
devices
payment instruments
normal transaction behavior
```

### Office

Shared:

```text
IP
```

but otherwise independent and normal.

### Single-attribute overlap

Accounts sharing only:

```text
one device
```

or:

```text
one IP
```

must not automatically become high risk.

This is required to demonstrate that Ring Sentinel is not simply:

```text
shared identifier = fraud
```

---

# 9. ADD THE 20% HOLDOUT

Generate:

```text
data/holdout_labels.json
```

The evaluation must contain an untouched 20% holdout.

The holdout must NOT be used to tune:

```text
weights
thresholds
rules
```

The final metrics must be calculated only on that holdout.

Do not alter the holdout after evaluation.

---

# 10. FIX/ADD THE DETERMINISTIC GRAPH ENGINE

If missing, add:

```text
engine/
├── __init__.py
├── graph_builder.py
├── risk_scorer.py
└── config.py
```

If partially implemented, FIX it instead of replacing it unnecessarily.

---

# 11. GRAPH BUILDER REQUIREMENTS

Nodes:

```text
accounts
```

Edges:

```text
shared device
shared IP
shared address
shared card
shared UPI
shared phone
```

Each edge must preserve its evidence.

Example:

```json
{
  "source": "acct_001",
  "target": "acct_019",
  "shared_attributes": [
    "device_id",
    "ip_address"
  ]
}
```

Use:

```text
NetworkX
```

Connected components become:

```text
candidate investigation clusters
```

NOT automatic fraud conclusions.

---

# 12. FIX/ADD DETERMINISTIC RISK SCORING

Risk scoring must be deterministic.

Create/fix:

```text
engine/risk_scorer.py
engine/config.py
```

The scorer must incorporate:

```text
shared infrastructure
transaction velocity
promo/refund ratio
payment concentration
account linkage
behavioral anomalies
```

Use configurable weights in:

```text
engine/config.py
```

Do NOT scatter magic numbers throughout the code.

Every score must be explainable.

Example:

```text
Risk Score: 87

Evidence:
+ shared device across 7 accounts
+ shared IP across 8 accounts
+ elevated transaction velocity
+ high promo redemption ratio
```

Same input must produce the same score.

---

# 13. ABSOLUTE ENGINE RULE

The engine must contain:

```text
ZERO LLM CALLS
```

Search the final codebase for:

```text
anthropic
Claude
LLM
```

inside `engine/`.

There must be none.

---

# 14. ADD/FIX CLAUDE NARRATION

Create/fix:

```text
llm/
├── __init__.py
├── narrator.py
├── prompts.py
└── schemas.py
```

Claude is used ONLY for:

### A. Fuzzy identity interpretation

Interpret ambiguous identity signals.

### B. Dossier writing

Turn deterministic evidence into a concise analyst-readable case file.

Claude must NOT:

* construct the graph
* calculate the numerical risk score
* decide fraud
* block an account
* choose an automatic punitive action
* invent evidence

---

# 15. FORCE ACTION ENUM RESTRICTION

Use Pydantic.

The ONLY allowed actions are:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

The schema itself must reject:

```text
BLOCK
AUTO_BLOCK
SUSPEND
DELETE
BAN
```

Do not rely only on the prompt.

The application code must also reject invalid actions.

---

# 16. HUMAN GATE

There must be NO automatic blocking.

The system can:

```text
detect
score
explain
surface
recommend
```

The analyst must explicitly click:

```text
WATCH
HOLD PAYOUT
ESCALATE HUMAN
```

The click must generate an audit event.

---

# 17. FIX CLAUDE FAILURE HANDLING

Claude is optional.

If:

```text
ANTHROPIC_API_KEY missing
API timeout
network error
malformed Claude response
Claude unavailable
```

the application MUST continue operating.

The case page must still show:

```text
graph
accounts
connections
risk score
deterministic evidence
behavioral signals
```

and display:

```text
AI narration unavailable.
Showing deterministic evidence and risk score.
```

NEVER replace this with fake generated text.

---

# 18. FIX/ADD FASTAPI

Create/fix:

```text
api/
├── __init__.py
├── main.py
├── routes.py
└── models.py
```

At minimum provide:

```text
GET  /clusters
GET  /case/{id}
POST /approve
GET  /metrics
```

If the existing frontend already expects endpoints such as:

```text
/transactions
/alerts
/investigations
/risk
```

support those endpoints rather than rewriting the frontend.

The API must read from the actual dataset/engine.

No hardcoded demo responses.

---

# 19. FRONTEND/API INTEGRATION

Inspect the existing frontend API service.

Map every existing frontend request to the real backend.

Do not leave endpoints pointing to:

```text
mock data
local arrays
fake JSON
placeholder services
```

The existing UI should now consume:

```text
FastAPI
```

responses.

If a frontend field does not match the backend schema:

> adapt the API response or TypeScript type with the smallest possible change.

Do NOT redesign the component.

---

# 20. REAL GRAPH IN THE EXISTING UI

The existing graph must display actual backend graph data.

Nodes should represent actual accounts.

Edges should represent actual shared attributes.

Selecting a suspicious cluster must open its real case.

The graph must not be decorative.

---

# 21. REAL CASE FILE

The existing case/investigation panel must display real:

```text
case ID
risk score
severity
accounts
shared attributes
behavioral evidence
timeline
LLM dossier
uncertainty
```

All evidence must trace back to the deterministic engine.

---

# 22. REAL METRICS

The dashboard metrics must come from:

```text
eval/run_eval.py
```

or a backend representation of those computed metrics.

Never hard-code:

```text
98%
99%
₹1.2 Cr
```

or any other impressive-looking numbers.

---

# 23. ADD/FIX EVALUATION

Create/fix:

```text
eval/
├── __init__.py
├── baseline.py
├── metrics.py
└── run_eval.py
```

Baseline:

> naive exact-match duplicate detector

Compare:

```text
Baseline
vs
Ring Sentinel
```

using the same untouched holdout.

---

# 24. REQUIRED METRICS

Calculate:

```text
precision
recall
₹ prevented
false-positive cost
```

### Precision / Recall

Only from the untouched holdout.

### ₹ prevented

Calculate from simulated suspicious:

```text
promo value
refund value
chargeback-like value
```

within successfully caught rings.

Clearly label this as:

```text
simulated/pre-payout prevented value
```

### False-positive cost

Calculate:

```text
incorrect legitimate clusters
× analyst review time
× loaded analyst hourly cost
```

Use documented assumptions.

Do NOT invent the final number.

---

# 25. REQUIRED EVALUATION OUTPUT

`python eval/run_eval.py`

must print something like:

```text
================================================
RING SENTINEL — HOLDOUT EVALUATION
================================================

Accounts: 500
Orders: 2000
Seeded rings: X
Holdout: 20%

                         BASELINE     RING SENTINEL
----------------------------------------------------
Precision                XX.X%        XX.X%
Recall                   XX.X%        XX.X%
₹ Prevented              ₹XX,XXX      ₹XX,XXX
False-positive cost      ₹X,XXX       ₹X,XXX
----------------------------------------------------
```

Use actual calculated numbers.

---

# 26. ADD/FIX HASH-CHAIN AUDIT

Create/fix:

```text
audit/audit_log.py
```

and:

```text
logs/audit.jsonl
```

Each entry must include:

```text
timestamp
case_id
event_type
action
evidence
previous_hash
current_hash
```

The hash must include the previous record's hash.

Therefore:

```text
record 1
   ↓
hash 1
   ↓
record 2
   ↓
hash 2
```

If a previous record changes, chain verification must fail.

---

# 27. HUMAN ACTION MUST BE AUDITED

When analyst clicks:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

write an audit entry.

The UI should visibly confirm:

```text
Action recorded
Timestamp
Audit hash
```

Do not merely display a fake confirmation.

---

# 28. DO NOT ADD AUTH

Do not add:

```text
authentication
authorization systems
login
RBAC
```

This is explicitly outside scope.

---

# 29. DO NOT ADD REAL PAYMENT INTEGRATION

Do not attempt to integrate actual Razorpay payment processing.

The synthetic dataset is sufficient for the buildathon proof.

---

# 30. DO NOT ADD MULTI-AGENT AI

There should be:

```text
ONE Claude narration call per cluster
```

No:

```text
agent swarm
multi-agent framework
agent supervisor
agent-to-agent architecture
```

---

# 31. EXISTING REAL-TIME SUPPORT

If the current frontend already has WebSocket support:

KEEP IT.

Connect it to the actual backend if practical.

Do not fake a live connection.

If disconnected:

```text
OFFLINE
```

If actually connected:

```text
LIVE
```

Never falsely label a disconnected system as LIVE.

---

# 32. FIX TESTS

Create/fix:

```text
tests/test_graph_builder.py
tests/test_risk_scorer.py
tests/test_narrator.py
tests/test_failure_handling.py
```

### Graph test

Verify seeded rings become connected components.

### Scorer test

Verify more severe seeded rings receive appropriately higher deterministic scores.

### Narrator test

Verify allowed actions are ONLY:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

and:

```text
BLOCK
```

is rejected.

### Failure test

Kill/mimic failure of Claude.

Verify:

```text
case still loads
graph still loads
risk score still loads
evidence still loads
```

---

# 33. DO NOT CHEAT THE TESTS

Do not write tests that merely test constants you created.

Tests must exercise actual project behavior.

Do not:

```text
mock the entire application
```

just to make tests pass.

Mocks may be used specifically to simulate Claude failure.

The graph/risk/evaluation pipeline must use actual generated data.

---

# 34. README FIX

Update the existing README instead of creating a competing README.

It must explain:

```text
Problem
Solution
Architecture
Dataset
Graph construction
Risk scoring
LLM role
Human gate
Holdout methodology
Metrics
False-positive cost
Audit trail
Failure handling
API
How to run
Limitations
Bumblebee differentiation
```

---

# 35. DEMO SCRIPT

Create/update:

```text
docs/demo_script.md
```

Use exactly this sequence:

### 1. Normal case

Show a real suspicious ring.

Show:

```text
graph
evidence
risk score
case dossier
```

Click:

```text
HOLD PAYOUT
```

### 2. Edge case

Show legitimate family/office shared infrastructure.

Show why it is not incorrectly flagged.

### 3. Failure case

Disable Claude.

Show:

```text
AI narration unavailable
```

while deterministic detection continues.

### 4. Metrics

Show:

```text
Baseline vs Ring Sentinel
```

using the untouched holdout.

### 5. Audit

Show:

```text
human action
timestamp
previous hash
current hash
```

### 6. Close

Use:

> Ring Sentinel does not replace the risk analyst. It compresses a network-level investigation into an auditable case file while keeping the final action human-controlled.

---

# 36. PITCH DECK

Update/create:

```text
docs/pitch_deck.md
```

Include these answers verbatim:

### Isn't this just Bumblebee?

> Bumblebee vets merchants at onboarding. This watches an already-onboarded merchant's own customer base for coordinated abuse. Different data, different lifecycle stage.

### Why does this need AI — isn't it a graph query?

> The graph is deterministic on purpose. AI's job is fuzzy identity resolution and writing an audit-grade explanation a non-technical analyst can act on in seconds.

### What's your false-positive cost?

Replace this with the actual computed value from the holdout evaluation. Never say "98% accuracy" without supporting evidence.

### What happens when the AI is wrong?

> A human reviews a case that didn't need review. Worst case is wasted analyst time — never wrongful account action, because nothing is auto-blocked.

### Could this be dangerous in production?

> Only if the action enum ever included auto-block. Yours doesn't, by design.

---

# 37. BUMBLEBEE DIFFERENTIATION

Make sure the implementation and documentation communicate:

```text
Bumblebee
=
merchant onboarding / vetting

Ring Sentinel
=
post-onboarding customer-network abuse investigation
```

Do not claim the products are identical.

---

# 38. REQUIRED ENVIRONMENT FILE

Create/update:

```text
.env.example
```

with:

```text
ANTHROPIC_API_KEY=
```

Do NOT put real secrets in the repository.

The deterministic engine must work without the key.

---

# 39. REQUIREMENTS

Create/update:

```text
requirements.txt
```

Only include dependencies actually required.

At minimum, where used:

```text
fastapi
uvicorn
pandas
networkx
pydantic
anthropic
python-dotenv
pytest
```

---

# 40. ARCHITECTURE DIAGRAM

Create/update:

```text
docs/architecture_diagram.png
```

It must communicate:

```text
DATA
 ↓
NETWORK GRAPH
 ↓
DETERMINISTIC RISK
 ↓
CLAUDE EXPLANATION
 ↓
HUMAN GATE
 ↓
AUDIT LOG
```

Explicitly label:

```text
LLM DOES NOT DECIDE
```

and:

```text
NO AUTO-BLOCK
```

---

# 41. IMPORTANT: DO NOT CHANGE THE UI JUST TO CLAIM COMPLETION

If a requirement can be implemented in the backend while preserving the existing frontend:

**DO THAT.**

If an existing component already visually communicates the requirement:

**REUSE IT.**

Only make frontend changes when required for actual functionality.

---

# 42. FORCEFUL NO-MOCK RULE

Before finishing, search the project for suspicious placeholders:

```text
mock
dummy
fake
sample
placeholder
hardcoded
staticData
demoData
```

For every occurrence:

1. Determine whether it is legitimate documentation/test text.
2. If it is being used as runtime application data, remove it.
3. Replace it with the real backend/data pipeline.

Do not blindly delete legitimate test fixtures or documentation.

---

# 43. FORCEFUL LLM BOUNDARY CHECK

Search the entire project.

The only file allowed to directly instantiate/use the Claude client is:

```text
llm/narrator.py
```

No Claude API calls in:

```text
engine/
data/
eval/
audit/
```

The LLM must never determine the numerical risk score.

---

# 44. FORCEFUL AUTO-BLOCK CHECK

Search the entire codebase for:

```text
BLOCK
AUTO_BLOCK
BAN
SUSPEND
DELETE
```

There must be no executable path that automatically performs these actions.

The only permitted analyst actions are:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

---

# 45. FORCEFUL DATA-FLOW CHECK

Trace one suspicious account cluster from beginning to end:

```text
CSV
 ↓
NetworkX
 ↓
risk score
 ↓
case
 ↓
FastAPI
 ↓
existing React graph
 ↓
case panel
 ↓
Claude dossier
 ↓
human click
 ↓
audit JSONL
```

Verify the complete path actually works.

Do not stop after individual files compile.

---

# 46. FINAL COMMANDS TO RUN

Before declaring success:

```bash
pytest
```

Then:

```bash
python eval/run_eval.py
```

Then start the backend:

```bash
uvicorn api.main:app --reload
```

Then start the existing frontend using its existing package manager/start command.

Verify the actual browser flow.

---

# 47. FINAL END-TO-END DEMO TEST

Perform this exact sequence:

### TEST 1

Open dashboard.

Verify real data loads.

### TEST 2

Open suspicious cluster.

Verify graph renders.

### TEST 3

Open case.

Verify deterministic score and evidence.

### TEST 4

Enable Claude.

Verify dossier is generated.

### TEST 5

Click:

```text
HOLD PAYOUT
```

Verify audit entry.

### TEST 6

Disable Claude.

Open another case.

Verify:

```text
graph
score
evidence
```

still appear.

### TEST 7

Open legitimate family/office case.

Verify it is not automatically treated as a fraud ring.

### TEST 8

Open metrics.

Verify values correspond to actual evaluation output.

---

# 48. FINAL ACCEPTANCE CRITERIA

DO NOT SAY "DONE" until ALL are true:

```text
[ ] Existing UI preserved
[ ] No unnecessary redesign
[ ] No duplicate frontend
[ ] No fake runtime data
[ ] Real synthetic dataset generated
[ ] 500 accounts
[ ] 2000 orders
[ ] 6–8 seeded rings
[ ] Legitimate look-alike cases
[ ] 20% untouched holdout
[ ] NetworkX graph works
[ ] Shared attributes captured
[ ] Deterministic scoring works
[ ] Velocity included
[ ] Promo/refund behavior included
[ ] Explainable evidence
[ ] Engine contains zero LLM calls
[ ] Claude only used for fuzzy identity + dossier
[ ] Claude does not determine risk score
[ ] Pydantic action enum enforced
[ ] BLOCK impossible
[ ] Human action required
[ ] FastAPI connected
[ ] Existing frontend connected to real API
[ ] Graph uses real backend data
[ ] Case file uses real backend data
[ ] Metrics use real evaluation
[ ] Precision calculated on holdout
[ ] Recall calculated on holdout
[ ] ₹ prevented calculated
[ ] False-positive cost calculated
[ ] Audit log works
[ ] Hash chain works
[ ] Human action logged
[ ] Claude failure handled
[ ] Graph survives Claude failure
[ ] Risk score survives Claude failure
[ ] Tests pass
[ ] README updated
[ ] Architecture diagram exists
[ ] Demo script exists
[ ] Pitch deck exists
[ ] Bumblebee differentiation documented
```

---

# 49. ABSOLUTE FINAL INSTRUCTION

You are NOT being asked to make a prettier Ring Sentinel.

You are being asked to make the **existing Ring Sentinel implementation actually truthful and functional**.

Therefore:

### DO NOT:

```text
rebuild
redesign
replace
simplify
mock
hardcode
fake
```

### DO:

```text
inspect
reuse
repair
connect
implement
test
verify
```

If something already works:

> **LEAVE IT ALONE.**

If something is visually correct but backed by fake/static data:

> **CONNECT IT TO THE REAL BACKEND.**

If something required by the specification is completely missing:

> **ADD ONLY THAT MISSING PIECE.**

If something contradicts the specification:

> **FIX THE CONTRADICTION WITH THE SMALLEST POSSIBLE CHANGE.**

Do not stop at "the files exist."

Do not stop at "the API starts."

Do not stop at "the UI looks correct."

The project is complete ONLY when the **existing UI works end-to-end with the real deterministic engine, real evaluation, optional Claude narration, human gate, and hash-chained audit trail.**

The final implementation must be demonstrable live without pretending that mock data or fake AI results are real.
