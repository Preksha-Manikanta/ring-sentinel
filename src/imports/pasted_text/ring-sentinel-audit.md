# RING SENTINEL — FINAL FORENSIC AUDIT, EVALUATION VALIDATION & SUBMISSION-READY MASTER PROMPT

You are working on the uploaded latest **Ring Sentinel** ZIP.

This is the FINAL engineering pass before hackathon submission.

The project has already undergone a scoring repair and currently reports approximately:

```text
BASELINE          RING SENTINEL

Precision   5.1%          83.3%
Recall      100.0%        100.0%

TP          5             5
FP          93            1
FN          0             0

₹ Prevented
            ₹247,888     ₹247,888

FP Cost
            ₹75,600      ₹0
```

The current test suite reports approximately:

```text
44 tests passed
```

This is a strong result.

Your job is NOT to blindly improve the numbers.

Your job is to determine whether these numbers are **genuinely produced by the system**, whether the evaluation methodology is defensible, and then fix any remaining methodological, technical, UX, or honesty issues.

---

# ABSOLUTE PRIORITY

The final project must be:

```text
REALISTIC
DETERMINISTIC
REPRODUCIBLE
EXPLAINABLE
AUDITABLE
HONEST
DEMO-READY
JUDGE-DEFENSIBLE
```

Do NOT optimize for an impressive-looking number at the expense of methodological validity.

A slightly imperfect honest result is better than a perfect fabricated result.

---

# 1. FIRST: AUDIT BEFORE MODIFYING ANYTHING

Do NOT immediately edit code.

First inspect the complete repository.

Understand:

```text
data/
engine/
eval/
api/
llm/
audit/
tests/
src/
```

Pay particular attention to:

```text
data/generate_dataset.py
engine/config.py
engine/graph_builder.py
engine/risk_scorer.py
engine/pipeline.py
engine/policy.py
eval/baseline.py
eval/metrics.py
eval/run_eval.py
api/routes.py
api/models.py
llm/schemas.py
llm/narrator.py
src/
tests/
README
```

Create a mental dependency map:

```text
Dataset
   ↓
Graph
   ↓
Deterministic Signals
   ↓
Risk Score
   ↓
Risk Level
   ↓
Policy Suggestion
   ↓
Investigation
   ↓
Human Action
   ↓
Audit
```

And separately:

```text
Dataset
   ↓
Evaluation
   ├── Baseline
   └── Ring Sentinel
          ↓
       Metrics
          ↓
       /metrics
          ↓
     EvaluationPanel
```

Do not redesign this architecture.

---

# 2. FORENSICALLY VALIDATE THE 83.3% PRECISION

The most important task is determining whether:

```text
83.3% precision
100% recall
```

is mathematically and methodologically correct.

Do NOT assume it is correct simply because the program prints it.

Recalculate the metrics independently from the underlying predictions and labels.

Verify:

```text
TP = 5
FP = 1
FN = 0
```

Then independently verify:

```text
precision = TP / (TP + FP)
recall    = TP / (TP + FN)
```

For:

```text
TP = 5
FP = 1
FN = 0
```

the expected values are:

```text
precision = 83.333...%
recall = 100%
```

The displayed rounding may be:

```text
83.3%
100.0%
```

This must be calculated dynamically.

Never hardcode those numbers.

---

# 3. VERIFY THE DEFINITION OF A TRUE POSITIVE

This is critical.

Inspect exactly how the evaluation determines:

```text
TP
FP
FN
```

A true positive must mean that the detector actually identified a seeded abuse-ring case according to the evaluation's predefined labeling methodology.

Do NOT allow this logic:

```text
cluster contains ANY suspicious account
→ TP
```

unless that is explicitly justified by the evaluation design.

Investigate whether:

* a detected cluster overlaps a seeded ring
* partial overlap counts
* one account from a ring counts
* the entire ring must be captured
* cases rather than accounts are being evaluated
* account-level and case-level metrics are being mixed

Choose one coherent evaluation unit.

Prefer a clear case/ring-level definition for the hackathon if the detector itself produces cases.

Document it.

---

# 4. VERIFY THE HOLDOUT IS ACTUALLY UNTOUCHED

The current evaluation uses:

```text
ring_03
```

as the holdout.

Verify that:

```text
ring_03
```

was NOT used to:

* select scoring weights
* select score thresholds
* tune feature combinations
* define risk levels
* tune policy boundaries
* modify synthetic behavior
* choose the final model
* cherry-pick dataset seeds

Search the repository for:

```text
ring_03
```

and inspect every occurrence.

It is acceptable for evaluation code to identify `ring_03` as the holdout.

It is NOT acceptable for scoring code to special-case it.

There must be no code such as:

```python
if ring_id == "ring_03":
    score += ...
```

or equivalent indirect logic.

---

# 5. VERIFY DEVELOPMENT-ONLY TUNING

Determine exactly how the scoring configuration was selected.

The correct methodology is:

```text
Development rings
        ↓
Tune deterministic scoring
        ↓
Freeze scoring configuration
        ↓
Evaluate untouched ring_03
```

The process must NOT be:

```text
Tune
↓
Look at ring_03
↓
Change score
↓
Run again
↓
Repeat
```

If the current implementation has a tuning script, inspect it.

If the tuning is manually documented rather than programmatic, make the methodology explicit in README/evaluation documentation.

The final frozen configuration must be traceable.

---

# 6. VERIFY THRESHOLD SELECTION

Inspect the current threshold.

Determine where it came from.

It must not have been selected solely because:

```text
ring_03 score = X
```

The threshold should be justified using development data or an explicit deterministic policy.

For example:

```text
maximize development-set precision subject to minimum recall
```

or another defensible criterion.

The exact criterion is up to you, but it must be:

```text
deterministic
documented
reproducible
holdout-independent
```

Do not lower the threshold simply to preserve 100% holdout recall.

---

# 7. VERIFY THERE IS NO HARD-CODED PERFORMANCE

Search the entire repository for suspicious hardcoded values:

```text
83.3
100.0
247888
75600
5
93
1
0
```

Do not remove legitimate constants merely because they appear.

Instead determine whether they are:

### legitimate configuration

such as:

```text
investigator hourly cost
investigation hours
risk threshold
```

or:

### hardcoded evaluation outputs

such as:

```text
precision = 83.3
```

If evaluation outputs are hardcoded, replace them with actual calculations.

The UI must never contain hardcoded evaluation results.

---

# 8. RE-RUN THE ENTIRE EVALUATION FROM SCRATCH

Delete generated evaluation artifacts if appropriate.

Regenerate the fixed dataset once.

Then run:

```bash
python data/generate_dataset.py
pytest -q
python eval/run_eval.py
```

Capture the complete output.

Run the evaluation AGAIN without modifying anything.

The results must be identical.

Expected property:

```text
Run 1 == Run 2
```

for:

```text
TP
FP
FN
precision
recall
₹ prevented
FP cost
```

If results differ, find and remove nondeterminism.

---

# 9. VERIFY DATASET REPRODUCIBILITY

The dataset must use a fixed deterministic seed.

Verify that repeated generation produces identical:

```text
accounts.csv
orders.csv
ring labels
```

or equivalent dataset artifacts.

Check:

```text
500 accounts
2000 orders
6 seeded rings
```

remain consistent.

Do NOT regenerate repeatedly looking for a favorable outcome.

The dataset seed must be frozen for evaluation.

---

# 10. VERIFY THE BASELINE IS FAIR

Audit the baseline independently.

The baseline should be a genuinely simple detector.

It must:

* use the same underlying evaluation data
* have access to equivalent input information
* not receive Ring Sentinel-specific labels
* not receive the holdout label
* not be artificially weakened

The purpose of the comparison is:

```text
Naive shared-attribute detection
vs
network + behavioral detection
```

not:

```text
bad baseline
vs
carefully tuned system
```

If the baseline is genuinely naive, retain it.

Document exactly what it does.

---

# 11. VERIFY THE EVALUATION POPULATION

Determine exactly which entities are included in:

```text
TP
FP
FN
```

Ensure the baseline and Ring Sentinel are evaluated over the same population.

Check for accidental exclusions such as:

```text
legitimate clusters excluded from Ring Sentinel evaluation
```

or:

```text
non-holdout rings accidentally included/excluded
```

The evaluation must be symmetric.

---

# 12. VERIFY ACCOUNT-LEVEL VS CASE-LEVEL METRICS

The project is a network investigation system.

Therefore decide explicitly whether the primary evaluation unit is:

```text
case/ring
```

or:

```text
account
```

Do NOT mix:

```text
5 rings
```

with:

```text
500 accounts
```

in a single metric calculation.

If the detector generates clusters/cases, prefer:

```text
case-level precision
case-level recall
```

and optionally show:

```text
accounts surfaced
```

as a separate operational metric.

Document this.

---

# 13. VERIFY ₹ PREVENTED

The project currently reports:

```text
₹247,888
```

Verify this number comes from actual orders in the synthetic dataset.

The calculation must be dynamic.

Do NOT hardcode it.

It must represent something like:

```text
value of transactions/orders associated with correctly detected
abuse activity that could theoretically be intercepted pre-payout
```

Only use the definition actually supported by the dataset.

The UI must clearly say:

```text
SIMULATED / PRE-PAYOUT VALUE
```

or equivalent.

NEVER claim:

```text
actual money saved
real fraud prevented
production losses prevented
```

---

# 14. VERIFY FALSE-POSITIVE COST

Verify:

```text
₹0
```

for Ring Sentinel is actually derived from:

```text
FP count × investigation hours × investigator cost
```

rather than hardcoded.

Likewise verify the baseline:

```text
₹75,600
```

is derived dynamically.

Document the assumptions.

For example:

```text
1.5 investigation hours
₹1,800/hour
```

if those are the actual project assumptions.

---

# 15. AUDIT THE SCORER FOR DATA LEAKAGE

Inspect every feature used by:

```text
engine/risk_scorer.py
```

Make sure the scorer does not consume:

```text
ring label
ground-truth abuse label
holdout membership
evaluation result
```

The detector may use observable account/order/network properties.

It must NOT use the answer.

Allowed:

```text
device reuse
IP reuse
payment fingerprint reuse
transaction velocity
refund behavior
promo concentration
network density
cross-attribute linkage
```

Not allowed:

```text
is_fraud
ring_id
ground_truth
holdout_label
expected_case
```

---

# 16. VERIFY EXPLAINABILITY

Every final score must be decomposable into meaningful signals.

For a suspicious case, the system should be able to explain:

```text
Risk Score: 72.4

Network linkage          +XX
Cross-attribute overlap  +XX
Device reuse             +XX
Payment reuse             +XX
Behavioral anomaly       +XX
Velocity                  +XX
```

The exact fields depend on the existing implementation.

Do NOT show fake explanations.

Every explanation must correspond to an actual score contribution.

---

# 17. VERIFY LEGITIMATE CLUSTERS

Inspect the one remaining false positive.

Determine WHY it was flagged.

This is valuable.

Do not simply remove it to achieve:

```text
100% precision
```

Instead determine whether:

```text
it is a genuine edge case
```

or:

```text
it reveals a scoring flaw
```

If it is a legitimate edge case, retain it and use it as evidence that the system is realistic.

If it is clearly caused by an incorrect signal, fix the scoring methodology using development data only and rerun the untouched holdout.

Do NOT tune specifically to eliminate this exact false positive unless the rule is generalizable and selected without using holdout labels.

---

# 18. VERIFY RISK LEVELS

Risk levels should remain deterministic.

For example:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

The exact boundaries should come from the current implementation.

Make sure:

```text
score → level
```

is deterministic.

Do not allow Claude to determine severity.

---

# 19. VERIFY POLICY SEPARATION

Maintain:

```text
risk scorer
    ↓
risk level
    ↓
policy suggestion
```

Policy may suggest:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

But final action must require a human.

No automatic:

```text
BLOCK
BAN
SUSPEND
DELETE
```

---

# 20. VERIFY CLAUDE IS NOT PART OF THE DETECTION SCORE

Search the code to prove that Claude cannot:

* alter risk score
* change risk level
* approve/reject accounts
* trigger automatic action
* override deterministic engine output

Claude may only narrate.

The architecture should remain:

```text
                    ┌───────────────┐
Transactions ──────→│ Deterministic │
Accounts ──────────→│ Engine        │
Graph ─────────────→│               │
                    └───────┬───────┘
                            ↓
                      Risk Evidence
                            ↓
                     Claude Narrator
                            ↓
                    Analyst Explanation
                            ↓
                      Human Decision
```

Claude is NOT authoritative.

---

# 21. VERIFY HUMAN ACTION GATE

Only allow:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

Validate this at the API boundary.

Attempt invalid values and confirm they fail.

The UI must not be the only enforcement layer.

---

# 22. VERIFY AUDIT LOG

Every human action should generate an audit entry containing enough information to reconstruct:

```text
case
action
timestamp
actor/user if available
previous state if applicable
```

If hash chaining is implemented, verify the chain.

Changing one historical record should invalidate subsequent chain verification.

Do not weaken the existing audit design.

---

# 23. VERIFY `/metrics`

The `/metrics` endpoint must return actual current evaluation results.

The frontend must consume:

```text
/metrics
```

rather than maintaining duplicate values.

There must be one source of truth.

Verify:

```text
backend output == UI output
```

for:

```text
precision
recall
TP
FP
FN
₹ prevented
FP cost
```

---

# 24. VERIFY FRONTEND

Preserve the existing UI.

Do NOT redesign it.

Check:

```text
Dashboard
KPI cards
Event Stream
Entity Graph
Investigation Panel
Evaluation Panel
Human Action controls
Audit information
```

Everything displayed dynamically must originate from backend data.

No fake runtime cases.

No fake graph relationships.

No fake metrics.

No fake scores.

---

# 25. FIX THE REAL-TIME CLAIM

Inspect the event stream implementation.

If it replays historical synthetic transactions, label it honestly:

```text
LIVE REPLAY
```

or:

```text
DATASET REPLAY
```

or:

```text
SIMULATED STREAM
```

Do NOT label historical dataset replay as actual production real-time payment traffic.

The demo can still visually behave like a live stream.

Truthfulness is more important than the label.

---

# 26. CHECK EMPTY / ERROR STATES

The UI must gracefully handle:

```text
backend unavailable
Claude unavailable
empty dataset
evaluation unavailable
WebSocket disconnected
```

Do not substitute fake data.

Use clear states such as:

```text
Backend offline
Evaluation unavailable
Narration unavailable
Replay disconnected
```

---

# 27. CLAUDE FAILURE MUST DEGRADE SAFELY

If Claude fails:

```text
deterministic detection continues
risk score remains available
graph remains available
investigation evidence remains available
human actions remain available
```

Only natural-language narration should be unavailable.

This is important because it proves Claude is not a dependency for core detection.

---

# 28. ADD FINAL REGRESSION TESTS

Add tests where useful for:

### Dataset

```text
500 accounts
2000 orders
6 rings
fixed seed
```

### Determinism

Same input → same score.

### Holdout

Holdout identity is fixed.

### No leakage

Ground-truth labels cannot enter the scoring path.

### Metrics

Known TP/FP/FN → expected precision/recall.

### Evaluation reproducibility

Two evaluation runs → identical metrics.

### Human action

Only three allowed actions.

### Claude isolation

Narrator cannot override engine score.

### Graph

Edges retain shared attributes.

### Audit

Human action creates audit record.

Do not create brittle tests that depend on arbitrary implementation details.

---

# 29. PERFORMANCE SANITY CHECK

Run the system against:

```text
500 accounts
2000 orders
```

and verify that response times remain reasonable.

Do not prematurely optimize.

Do not introduce unnecessary infrastructure.

---

# 30. FINAL SECURITY / CODE QUALITY CHECK

Search for:

```text
TODO
FIXME
mock
dummy
fake
hardcoded
placeholder
bypass
skip
```

Inspect each occurrence.

Do not blindly delete legitimate documentation or test fixtures.

Remove anything that could make a judge believe fake data is being used at runtime.

---

# 31. FINAL DOCUMENTATION

Update README only where necessary.

The README should clearly explain:

## Problem

Payment abuse is often coordinated across multiple accounts rather than isolated to a single account.

## Solution

Ring Sentinel builds an entity relationship graph and combines network and behavioral signals to identify suspicious coordinated activity.

## Why it is different

Traditional duplicate checks ask:

> "Did these accounts share something?"

Ring Sentinel asks:

> "Do these accounts form a coordinated network with multiple independent relationships and suspicious behavior?"

## AI role

Claude is an explanation/narration layer, not the risk engine.

## Governance

Human approval is required for consequential actions.

## Evaluation

Clearly describe:

```text
Development rings
        ↓
Scoring configuration
        ↓
Frozen configuration
        ↓
Untouched holdout ring
        ↓
Final evaluation
```

## Dataset

Explicitly say:

```text
Synthetic dataset
500 accounts
2000 orders
6 seeded abuse rings
```

Do not imply production data.

## Financial metric

Explicitly say:

```text
Simulated / pre-payout value
```

---

# 32. DO NOT MAKE UNSUPPORTED CLAIMS

Never write:

```text
production-ready fraud prevention
guaranteed fraud detection
100% accurate
zero false positives
real money saved
real-time production detection
```

unless the evidence actually supports the claim.

Instead use:

```text
100% holdout recall on the fixed synthetic evaluation
83.3% case-level precision
1 false-positive case
₹247,888 simulated/pre-payout value
```

if those remain the verified results.

---

# 33. FINAL COMMANDS

Run:

```bash
python data/generate_dataset.py
pytest -q
python eval/run_eval.py
python eval/run_eval.py
```

Then launch the application and verify the full user flow.

---

# 34. FINAL REPORT FORMAT

When finished, return a concise forensic report.

## 1. VERDICT

Choose exactly one:

```text
PASS
PASS WITH MINOR FIXES
FAIL — METHODOLOGY ISSUE
```

## 2. EVALUATION VALIDITY

State whether:

```text
83.3% precision
100% recall
5 TP
1 FP
0 FN
```

are genuinely calculated.

## 3. HOLDOUT VALIDITY

State:

```text
Holdout ring:
Development rings:
Was holdout used for tuning? YES/NO
Was threshold selected using holdout? YES/NO
Was ground truth leaked? YES/NO
```

## 4. FINAL METRICS

Return:

```text
                    BASELINE      RING SENTINEL

Precision
Recall
TP
FP
FN
₹ Prevented
FP Cost
```

## 5. REPRODUCIBILITY

State whether:

```text
Run 1 == Run 2
```

and show the result.

## 6. TESTS

```text
pytest:
X passed
```

## 7. ROOT CAUSE OF ANY PROBLEM

If anything is invalid, explain exactly why.

## 8. FILES CHANGED

List only files actually modified.

## 9. FINAL DEMO STATUS

Report:

```text
Frontend
Backend
WebSocket / Replay
Graph
Investigation
Evaluation
Claude
Human Action
Audit
```

---

# 35. FINAL ACCEPTANCE CRITERIA

Do not declare success unless:

* [ ] 83.3% precision is dynamically calculated
* [ ] 100% recall is dynamically calculated
* [ ] TP/FP/FN are dynamically calculated
* [ ] ₹ prevented is dynamically calculated
* [ ] FP cost is dynamically calculated
* [ ] holdout is genuinely untouched
* [ ] no ground-truth leakage exists
* [ ] no ring-specific scoring exists
* [ ] threshold is development-derived
* [ ] dataset is reproducible
* [ ] evaluation is reproducible
* [ ] baseline is fair
* [ ] case/account evaluation unit is clearly defined
* [ ] score contributions are explainable
* [ ] Claude cannot alter detection
* [ ] human action is enforced at API level
* [ ] audit logging works
* [ ] no runtime mock data exists
* [ ] replay is honestly labeled
* [ ] `/metrics` is the source of truth
* [ ] frontend displays backend-derived values
* [ ] all tests pass
* [ ] README contains no unsupported claims

---

# FINAL INSTRUCTION

This is NOT a request to make the metrics prettier.

This is a request to make the metrics **trustworthy**.

If the current:

```text
83.3% precision
100% recall
```

is valid, PRESERVE IT.

If it is invalid, FIX THE METHODOLOGY even if the numbers become worse.

If a change can improve the detector legitimately using development data, make that improvement.

If a change would use holdout information to improve the result, DO NOT make it.

Do not fabricate.

Do not hardcode.

Do not cherry-pick.

Do not rebuild.

Do not add unnecessary features.

Do not redesign the frontend.

Do not turn Claude into the detector.

Do not introduce automatic enforcement.

Make Ring Sentinel a **technically defensible, reproducible, explainable, human-governed payment-abuse investigation system** that can withstand a technically knowledgeable judge asking:

> "Show me exactly where these numbers came from."

The final answer to that question must be:

> "Every number is calculated from the deterministic engine and the fixed synthetic evaluation dataset, using a scoring configuration selected without looking at the untouched holdout."
