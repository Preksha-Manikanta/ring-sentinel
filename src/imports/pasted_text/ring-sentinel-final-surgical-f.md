# RING SENTINEL — FINAL SURGICAL FIX MASTER PROMPT

## IMPORTANT: THIS IS A REPAIR TASK, NOT A REBUILD

You are working on the **CURRENT uploaded Ring Sentinel ZIP**.

The project has already been built through several implementation passes.

Your task is to perform a **FINAL AUDIT AND SURGICAL FIX**.

Do NOT rebuild Ring Sentinel.

Do NOT create a new application.

Do NOT redesign the existing UI.

Do NOT replace the existing React/Vite frontend.

Do NOT replace working components.

Do NOT introduce a new architecture.

Do NOT add unnecessary features.

Your goal is:

```text
CURRENT PROJECT
      ↓
AUDIT
      ↓
FIX ONLY REMAINING PROBLEMS
      ↓
VERIFY END-TO-END
      ↓
STOP
```

The existing project is valuable and must be preserved.

---

# 1. THE GOLDEN RULE

If something already works:

> **LEAVE IT ALONE.**

If something is visually correct but uses fake/static runtime data:

> **CONNECT IT TO THE REAL BACKEND.**

If something required by the specification is missing:

> **ADD ONLY THAT MISSING PIECE.**

If something contradicts the architecture:

> **FIX THE CONTRADICTION WITH THE SMALLEST POSSIBLE CHANGE.**

Do not refactor for style.

Do not rename large numbers of files.

Do not replace working libraries.

Do not optimize prematurely.

---

# 2. CURRENT PROJECT ALREADY HAS THE MAJOR ARCHITECTURE

The current ZIP already contains the major systems:

```text
data/
engine/
llm/
audit/
api/
eval/
tests/
src/
docs/
```

Therefore, do NOT recreate these systems from scratch.

The final system must preserve the existing implementation while correcting the remaining architectural inconsistencies.

---

# 3. FINAL REQUIRED ARCHITECTURE

The project must ultimately operate as:

```text
                    SYNTHETIC DATA
                  500 ACCOUNTS
                  2000 ORDERS
                        │
                        ▼
                NETWORKX GRAPH
                        │
                        ▼
             DETERMINISTIC SCORER
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
       CASE EVIDENCE          HOLDOUT EVAL
              │
              ▼
        CLAUDE NARRATOR
        EXPLANATION ONLY
              │
              ▼
           FASTAPI
              │
              ▼
       EXISTING REACT UI
              │
              ▼
        HUMAN ANALYST
              │
        ┌─────┼─────┐
        ▼     ▼     ▼
      WATCH HOLD  ESCALATE
              │
              ▼
       HASH-CHAIN AUDIT
```

The most important architectural boundary is:

```text
LLM ≠ detector
LLM ≠ risk scorer
LLM ≠ action decision maker
```

And:

```text
NO AUTO-BLOCK
```

---

# 4. FIRST TASK — INSPECT BEFORE EDITING

Before making changes, inspect:

```text
data/
engine/
llm/
audit/
api/
eval/
tests/
src/
docs/
```

Also inspect:

* package.json
* requirements.txt
* .env.example
* README
* existing API service
* WebSocket service
* existing graph component
* investigation/case component
* metrics components
* existing data services
* existing tests

Identify:

```text
WORKING
BROKEN
MOCKED
MISCONNECTED
CONTRADICTORY
MISSING
```

Then fix only the actual problems.

---

# 5. 🚨 FIX #1 — CLAUDE MUST NOT RETURN OR DECIDE ACTION

This is the highest-priority correction.

The current implementation contains a Claude dossier field similar to:

```python
recommended_action
```

and Claude may currently produce:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

This MUST be removed from Claude's responsibility.

## Claude is allowed to return ONLY explanation information.

For example:

```text
summary
identity_resolution
key_findings
evidence_explanation
uncertainty
```

The exact existing names may be preserved where practical.

But Claude must NOT return:

```text
recommended_action
action
decision
fraud_decision
```

as part of its response schema.

---

# 6. ACTION MUST BE DETERMINISTIC/HUMAN CONTROLLED

The correct flow is:

```text
deterministic risk score
        ↓
deterministic policy
        ↓
optional suggested action
        ↓
human analyst chooses
```

NOT:

```text
risk score
   ↓
Claude
   ↓
action
```

If the UI currently displays:

```text
Suggested: HOLD_PAYOUT
```

that suggestion must originate from deterministic backend policy, NOT Claude.

Claude should only explain why the case is risky.

---

# 7. EXACT ACTION ENUM

The system may only support:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

Use Pydantic validation.

The schema must reject:

```text
BLOCK
AUTO_BLOCK
BAN
SUSPEND
DELETE
TERMINATE
```

Do not rely only on prompt wording.

The backend validation itself must enforce this.

---

# 8. NO AUTOMATIC PUNITIVE ACTION

There must be NO executable path where the system automatically:

```text
blocks an account
bans an account
suspends an account
deletes an account
```

The system may:

```text
detect
score
explain
surface
recommend
```

The final action must require an explicit human interaction.

---

# 9. HUMAN ACTION FLOW

The existing frontend buttons should remain.

When the analyst clicks:

```text
WATCH
HOLD PAYOUT
ESCALATE HUMAN
```

the frontend must call the backend.

The backend validates the action.

The backend records it in the audit log.

Only after successful backend persistence should the UI display a success confirmation.

Do not fake the confirmation.

---

# 10. FIX #2 — REAL EVALUATION METRICS MUST FLOW INTO THE API

The current evaluation system already calculates:

```text
precision
recall
₹ prevented
false-positive cost
```

on the holdout set.

Do NOT rewrite the evaluation system unnecessarily.

Instead, connect its actual results to the API.

The existing:

```text
GET /metrics
```

may continue returning operational metrics such as:

```text
eventsReceived
transactionsAnalyzed
highRiskEvents
criticalAlerts
activeInvestigations
detectionLatencyMs
```

BUT it must ALSO expose the actual evaluation results.

Use a structure similar to:

```json
{
  "operational": {
    "...": "existing operational metrics"
  },
  "evaluation": {
    "dataset_accounts": 500,
    "dataset_orders": 2000,
    "seeded_rings": 7,
    "holdout_fraction": 0.20,
    "baseline": {
      "precision": 0.0,
      "recall": 0.0,
      "rupees_prevented": 0,
      "false_positive_cost": 0
    },
    "ring_sentinel": {
      "precision": 0.0,
      "recall": 0.0,
      "rupees_prevented": 0,
      "false_positive_cost": 0
    }
  }
}
```

Use the project's actual computed values.

---

# 11. ABSOLUTELY NO HARDCODED METRICS

Do NOT hard-code:

```text
98%
99%
₹1,00,000
₹10,00,000
```

or any impressive-looking numbers.

The metrics displayed by the API and frontend must come from the evaluation implementation.

The source of truth must be:

```text
eval/run_eval.py
```

or a shared computation used by it.

Avoid duplicating metric calculations in the frontend.

---

# 12. FIX FRONTEND METRICS

The existing dashboard should show the actual comparison:

```text
                  BASELINE       RING SENTINEL

Precision            XX.X%            XX.X%
Recall               XX.X%            XX.X%
₹ Prevented          ₹XX,XXX          ₹XX,XXX
FP Cost              ₹X,XXX           ₹X,XXX
```

Use the existing metric cards/components.

Do NOT redesign the dashboard.

Only connect the existing UI to the real API data.

---

# 13. HOLDOUT METHODOLOGY

The final project must use an untouched 20% holdout.

Verify that:

```text
weights
thresholds
rules
```

were not tuned against the holdout labels.

The documentation must state:

> Metrics are calculated on an untouched 20% holdout set and were not used for threshold or weight tuning.

Do not claim more statistical rigor than the implementation actually provides.

---

# 14. FIX #3 — PRESERVE ALL GRAPH EVIDENCE

The graph backend contains evidence such as:

```text
device_id
ip_address
address
card_fingerprint
upi_id
phone_number
```

Do NOT collapse multiple shared attributes into one generic edge type.

If two accounts share:

```text
device
IP
UPI
```

the API should preserve all three.

Use a structure similar to:

```json
{
  "source": "acct_001",
  "target": "acct_007",
  "kind": "shared_infrastructure",
  "sharedAttributes": [
    "device_id",
    "ip_address",
    "upi_id"
  ]
}
```

Adapt to the project's existing naming conventions where possible.

---

# 15. DO NOT REDESIGN THE GRAPH

The current graph visualization should remain visually intact.

Only ensure that:

```text
backend evidence
        ↓
API
        ↓
existing graph
```

does not lose information.

If the existing graph supports hover/click details, expose the shared attributes there.

Do not build a new graph component.

---

# 16. FIX #4 — BE HONEST ABOUT THE WEBSOCKET

The current WebSocket may replay generated historical orders.

That is acceptable for the hackathon.

But it is not external production real-time transaction ingestion.

Therefore, if the frontend is displaying the replayed dataset, use honest wording such as:

```text
LIVE REPLAY
```

or:

```text
DATASET REPLAY
```

instead of pretending it is live production data.

If there is an actual connected backend stream, then:

```text
LIVE
```

is acceptable while the connection is genuinely active.

---

# 17. FIX #5 — LIVE/OFFLINE MUST REFLECT REAL CONNECTIVITY

Do not determine connection state merely from:

```text
apiBaseUrl exists
```

or:

```text
wsUrl exists
```

A URL can exist while the backend is offline.

The state should be:

```text
backend reachable
    ↓
CONNECTED / LIVE
```

and:

```text
backend unreachable
    ↓
OFFLINE / DISCONNECTED
```

Preserve the existing visual design.

---

# 18. FIX #6 — LEGITIMATE FAMILY/OFFICE CASES

The dataset contains legitimate cases such as:

```text
family:
same address

office:
same IP

single-attribute overlap:
same device
```

These MUST NOT automatically become high risk.

Risk must consider multiple signals:

```text
shared infrastructure
+
behavior
+
velocity
+
promo/refund behavior
+
payment concentration
+
account linkage
```

Do NOT use:

```text
one shared identifier = fraud
```

---

# 19. CLUSTER SIZE MUST NOT CREATE FALSE POSITIVES

If cluster size contributes to the score, verify that a large legitimate office/family cluster does not become high-risk merely because it contains many accounts.

The system should distinguish:

```text
large legitimate shared infrastructure
```

from:

```text
large coordinated abuse network
```

Use behavioral evidence to differentiate them.

Do not remove existing scoring features unless necessary.

---

# 20. VERIFY DATASET

Do not regenerate the dataset merely to make metrics look better.

Verify that the project contains approximately:

```text
500 accounts
2000 orders
6–8 seeded rings
4–12 accounts per seeded ring
```

Each seeded ring should contain at least:

```text
2 shared attributes
```

from:

```text
device
IP
address
card
UPI
phone
```

and meaningful behavioral signals.

---

# 21. VERIFY HOLDOUT

Verify:

```text
20% holdout
```

and that:

```text
holdout labels
```

are stored in:

```text
data/holdout_labels.json
```

Do not tune against those labels after this repair.

---

# 22. ₹ PREVENTED

Keep the existing calculation.

Ensure the UI/documentation calls it:

> simulated/pre-payout prevented value on the evaluation dataset.

Do NOT claim:

> actual Razorpay money saved.

---

# 23. FALSE-POSITIVE COST

Keep the existing calculation.

It must be based on actual incorrectly flagged legitimate cases and documented analyst-cost assumptions.

Do NOT fabricate the number.

---

# 24. CLAUDE FAILURE MUST REMAIN SAFE

If Claude fails because of:

```text
missing API key
timeout
network error
malformed response
service unavailable
```

the case MUST still show:

```text
graph
accounts
connections
risk score
deterministic evidence
behavioral signals
```

The UI should say something like:

```text
AI narration unavailable.
Showing deterministic evidence and risk score.
```

Do NOT produce fake Claude text.

---

# 25. CLAUDE MUST NEVER BE REQUIRED FOR DETECTION

The project must work in deterministic mode without:

```text
ANTHROPIC_API_KEY
```

The following must continue working without Claude:

```text
dataset
graph
risk scoring
case generation
API
evaluation
frontend
```

Claude is an optional explanation layer.

---

# 26. CLAUDE BOUNDARY AUDIT

Search the entire repository.

The actual Claude client invocation must exist only inside:

```text
llm/narrator.py
```

No Claude invocation in:

```text
engine/
data/
eval/
audit/
```

The engine must contain zero LLM calls.

---

# 27. AUTO-BLOCK BOUNDARY AUDIT

Search the repository for:

```text
BLOCK
AUTO_BLOCK
BAN
SUSPEND
DELETE
```

Documentation may mention them when explaining that they are forbidden.

But there must be no executable path that automatically performs those actions.

---

# 28. MOCK DATA AUDIT

Search for:

```text
mock
dummy
fake
placeholder
sample
demoData
mockData
hardcoded
static
```

For every occurrence:

### If it is documentation:

Leave it.

### If it is a legitimate test fixture:

Leave it.

### If it supplies runtime dashboard data:

Remove it and connect the UI to the real backend.

Do not blindly delete legitimate test fixtures.

---

# 29. API DATA MUST BE REAL

Verify:

```text
CSV
 ↓
engine
 ↓
case/metrics
 ↓
FastAPI
 ↓
React
```

No frontend-only fake data.

No static case JSON pretending to be generated.

No hardcoded graph.

No fake risk score.

No fake metrics.

---

# 30. EXISTING API ENDPOINTS

Preserve the existing endpoints wherever possible.

At minimum:

```text
GET  /clusters
GET  /case/{id}
POST /approve
GET  /metrics
```

If the existing frontend requires:

```text
/transactions
/alerts
/investigations
/risk
```

keep/support them.

Do not break the existing frontend contract unnecessarily.

---

# 31. `/approve` SEMANTICS

Keep `/approve` if the frontend already depends on it.

But make sure it means:

> Record the human analyst's selected action.

It must NOT mean:

> Approve Claude's decision.

The action is selected by the analyst.

---

# 32. AUDIT LOG

Preserve the existing hash-chain implementation.

Verify each entry contains at least:

```text
timestamp
case_id
event_type
action
previous_hash
current_hash
```

The current hash must depend on the previous hash.

Changing a historical record should make verification fail.

---

# 33. AUDIT MUST RECORD HUMAN ACTION

When the analyst selects:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

the backend must append an audit record.

The UI confirmation must reflect successful persistence.

---

# 34. TESTS

Run all existing tests:

```bash
pytest
```

Do not delete tests to make the suite pass.

Do not weaken assertions.

Fix actual implementation problems.

---

# 35. REQUIRED TESTS

Verify:

```text
tests/test_graph_builder.py
```

actually detects seeded rings.

Verify:

```text
tests/test_risk_scorer.py
```

actually ranks more severe rings higher.

Verify:

```text
tests/test_narrator.py
```

that:

```text
Claude output contains NO action decision
```

and that:

```text
BLOCK
```

is rejected by the action schema.

Verify:

```text
tests/test_failure_handling.py
```

that Claude failure leaves deterministic detection operational.

---

# 36. ADD HUMAN ACTION TEST

If missing, add a focused test verifying:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

are accepted.

And:

```text
BLOCK
```

is rejected.

Verify successful action creates an audit record.

---

# 37. END-TO-END TEST

Do not stop after unit tests.

Run:

```text
dataset
 ↓
graph
 ↓
score
 ↓
case
 ↓
FastAPI
 ↓
frontend
 ↓
human action
 ↓
audit
```

using an actual case.

---

# 38. FRONTEND BUILD

Run the existing frontend build command.

Do not declare success if:

```text
TypeScript errors
API contract errors
runtime errors
```

remain.

Fix only errors related to the required integration.

---

# 39. BACKEND SMOKE TEST

Start:

```bash
uvicorn api.main:app --reload
```

Verify:

```text
/clusters
/case/{id}
/metrics
/approve
```

actually respond.

---

# 40. FINAL BROWSER TEST

With backend + existing frontend running:

### Test 1

Dashboard loads real data.

### Test 2

Suspicious cluster appears.

### Test 3

Graph renders actual accounts.

### Test 4

Graph preserves shared attributes.

### Test 5

Case file shows deterministic score.

### Test 6

Claude generates explanation when available.

### Test 7

Claude failure still shows deterministic case.

### Test 8

Legitimate family/office case does not become suspicious solely because of shared infrastructure.

### Test 9

Analyst clicks:

```text
HOLD PAYOUT
```

and audit entry is actually written.

### Test 10

Metrics show:

```text
Baseline
vs
Ring Sentinel
```

using actual holdout results.

### Test 11

Connection state correctly reflects:

```text
LIVE / OFFLINE
```

---

# 41. README

Do not rewrite the README unnecessarily.

Only update it to ensure it accurately states:

```text
Ring Sentinel detects coordinated post-onboarding customer abuse networks.

Graph construction is deterministic.

Risk scoring is deterministic.

Claude is used only for fuzzy identity interpretation and case-file narration.

Claude does not determine the numerical risk score.

Claude does not determine the final analyst action.

Human review is mandatory.

No automatic blocking exists.

Metrics are calculated on an untouched 20% holdout set.

₹ prevented is simulated/pre-payout value on the evaluation dataset.

Dataset replay is not production real-time transaction ingestion.
```

---

# 42. DEMO SCRIPT

Preserve the existing demo script structure.

The demo must show:

## 1. Normal case

```text
network
→ deterministic score
→ evidence
→ Claude explanation
→ human HOLD
```

## 2. Legitimate case

```text
family/office
→ shared infrastructure
→ normal behavior
→ not treated as fraud
```

## 3. Claude failure

```text
Claude unavailable
→ graph remains
→ score remains
→ evidence remains
```

## 4. Metrics

Show:

```text
Baseline vs Ring Sentinel
```

using the real holdout.

## 5. Audit

Show:

```text
human action
timestamp
previous hash
current hash
```

## 6. Closing sentence

Use:

> Ring Sentinel does not replace the risk analyst. It compresses a network-level investigation into an auditable case file while keeping the final action human-controlled.

---

# 43. PITCH DECK

Ensure these answers remain accurate:

### Isn't this just Bumblebee?

> Bumblebee vets merchants at onboarding. This watches an already-onboarded merchant's own customer base for coordinated abuse. Different data, different lifecycle stage.

### Why does this need AI — isn't it a graph query?

> The graph is deterministic on purpose. AI's job is fuzzy identity resolution and writing an audit-grade explanation a non-technical analyst can act on in seconds.

### What's your false-positive cost?

Give the actual calculated value from the holdout.

Never claim unsupported accuracy.

### What happens when the AI is wrong?

> A human reviews a case that didn't need review. Worst case is wasted analyst time — never wrongful account action, because nothing is auto-blocked.

### Could this be dangerous in production?

> Only if the action enum ever included auto-block. Yours doesn't, by design.

---

# 44. DO NOT ADD SCOPE

Do NOT add:

```text
authentication
authorization
real payment integration
multi-agent systems
vector database
Kubernetes
microservices
extra LLM calls
complex ML models
UI animation
```

Do not make the project more complicated.

This is a hackathon submission.

---

# 45. FINAL CODEBASE SEARCH

Before finishing, search for:

```text
recommended_action
anthropic
Claude
BLOCK
AUTO_BLOCK
mock
dummy
fake
hardcoded
```

Expected result:

### `recommended_action`

Must NOT be generated by Claude.

If retained anywhere, it must be deterministic policy output, not LLM output.

### Claude

Only actual invocation:

```text
llm/narrator.py
```

### BLOCK

No executable auto-block path.

### Mock/fake

No runtime fake data.

---

# 46. FINAL ACCEPTANCE CHECKLIST

Do not declare the project complete until all are true:

```text
[ ] Existing frontend preserved
[ ] Existing UI not redesigned
[ ] Existing graph preserved
[ ] Existing investigation panel preserved
[ ] No duplicate frontend
[ ] No unnecessary architecture changes

[ ] 500 accounts
[ ] 2000 orders
[ ] 6–8 seeded rings
[ ] 4–12 accounts per ring
[ ] 2+ shared attributes per seeded ring
[ ] legitimate family case
[ ] legitimate office case
[ ] single-attribute overlap cases
[ ] 20% holdout

[ ] NetworkX graph works
[ ] all shared attributes preserved
[ ] deterministic risk score works
[ ] configurable scoring
[ ] velocity included
[ ] promo/refund behavior included
[ ] explainable evidence
[ ] legitimate shared infrastructure protected

[ ] Claude only narrates
[ ] Claude does not calculate risk
[ ] Claude does not decide action
[ ] Claude does not output recommended_action
[ ] action schema enforced
[ ] WATCH allowed
[ ] HOLD_PAYOUT allowed
[ ] ESCALATE_HUMAN allowed
[ ] BLOCK rejected
[ ] no auto-block

[ ] FastAPI works
[ ] /clusters works
[ ] /case/{id} works
[ ] /approve works
[ ] /metrics works
[ ] frontend connected to actual backend
[ ] no runtime mock data

[ ] real evaluation metrics exposed
[ ] baseline precision
[ ] Ring Sentinel precision
[ ] baseline recall
[ ] Ring Sentinel recall
[ ] ₹ prevented
[ ] false-positive cost
[ ] holdout methodology honest

[ ] graph evidence preserved in API
[ ] Claude failure handled
[ ] deterministic detection survives Claude failure
[ ] LIVE/OFFLINE reflects actual connectivity
[ ] dataset replay labeled honestly

[ ] hash chain works
[ ] human action recorded
[ ] audit verification works

[ ] graph tests pass
[ ] scorer tests pass
[ ] narrator tests pass
[ ] failure tests pass
[ ] frontend builds
[ ] backend starts
[ ] end-to-end browser flow works

[ ] README accurate
[ ] demo script accurate
[ ] pitch deck accurate
```

---

# 47. FINAL INSTRUCTION — DO NOT KEEP MODIFYING AFTER SUCCESS

Once all acceptance criteria pass:

**STOP.**

Do not:

* redesign
* refactor
* add features
* introduce new dependencies
* change the architecture
* change the scoring methodology
* change the dataset to improve metrics
* tune the holdout
* add another AI agent
* add another LLM call

The project is considered complete when the current implementation is:

```text
REAL
DETERMINISTIC
EXPLAINABLE
HUMAN-CONTROLLED
AUDITABLE
TESTED
END-TO-END CONNECTED
```

The final product must demonstrate:

```text
NETWORK DETECTION
        +
DETERMINISTIC RISK
        +
AI EXPLANATION
        +
HUMAN DECISION
        +
AUDIT TRAIL
```

and never:

```text
AI
 ↓
AUTO-BLOCK
```

## FINAL COMMANDMENT

### PRESERVE WHAT WORKS.

### FIX WHAT IS BROKEN.

### REMOVE WHAT IS FAKE.

### CONNECT WHAT IS DISCONNECTED.

### VERIFY EVERYTHING.

### DO NOT REBUILD.

### DO NOT REDESIGN.

### DO NOT ADD SCOPE.
