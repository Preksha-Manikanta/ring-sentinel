# RING SENTINEL — FINAL EVALUATION & SCORING REPAIR MASTER PROMPT

You are working on the uploaded **Ring Sentinel** project.

The project is a network-level payment-abuse detection and investigation system. The existing architecture, frontend, backend, deterministic engine, Claude narration layer, human action gate, audit log, synthetic dataset, and evaluation framework are already substantially implemented.

## YOUR PRIMARY OBJECTIVE

Fix the **evaluation/scoring problem** in the existing project.

The current evaluation produces approximately:

```text
BASELINE      RING SENTINEL
Precision       5.1%          0.0%
Recall        100.0%          0.0%
INR Prevented INR 247,888     INR 0
FP Cost       INR 75,600      INR 0

Ring Sentinel TP/FP/FN:
0 / 1 / 5
```

The reason is that the deterministic engine identifies the untouched holdout ring (`ring_03`) as approximately:

```text
case_011
accounts: 5
score: 54.1
level: medium
```

while the current flag threshold is:

```text
55.0
```

Therefore the holdout ring is not flagged.

This MUST be fixed through a **methodologically valid improvement of the detection system**, NOT by cheating, hardcoding the holdout result, or simply changing the threshold after looking at the holdout.

---

# NON-NEGOTIABLE RULES

## 1. DO NOT REBUILD THE PROJECT

First inspect the uploaded project completely.

Preserve:

* existing React frontend
* existing visual design
* existing routes
* existing components
* existing FastAPI architecture
* existing NetworkX graph architecture
* existing deterministic risk scorer
* existing policy layer
* existing Claude narrator
* existing human action gate
* existing audit log
* existing dataset structure
* existing evaluation framework
* existing tests

Do NOT redesign the UI.

Do NOT replace the architecture with a new application.

Do NOT introduce unnecessary dependencies.

Do NOT create a second competing implementation.

Modify only what is necessary.

---

# 2. THE HOLDOUT MUST REMAIN A TRUE HOLDOUT

The dataset must remain approximately:

```text
500 accounts
2000 orders
6 seeded abuse rings
```

The existing deterministic seed/split must remain reproducible.

The designated holdout ring must remain untouched during model/scoring tuning.

CRITICAL:

You may inspect the holdout only AFTER the scoring methodology has been frozen.

You MUST NOT:

* tune directly against `ring_03`
* change weights because `ring_03` scored 54.1
* lower the threshold specifically to 54.1
* add a special case for `ring_03`
* add account IDs from the holdout into rules
* use holdout labels to optimize parameters
* regenerate the dataset repeatedly until the holdout is easier
* change the holdout ring after seeing its result
* hardcode expected evaluation numbers

The final evaluation must genuinely test an untouched ring.

---

# 3. TUNE USING ONLY THE NON-HOLDOUT DATA

Treat the other 80% of seeded abuse rings as the development/training set.

Use them to determine whether the current deterministic scoring methodology is actually separating:

```text
abuse rings
vs
legitimate shared-attribute clusters
```

The tuning process must be deterministic and reproducible.

The final scoring configuration must be frozen before holdout evaluation.

If necessary, create a clearly documented deterministic tuning procedure.

For example:

```text
Development rings:
ring_01
ring_02
ring_04
ring_05
ring_06

Holdout:
ring_03
```

Do not use the holdout labels while selecting:

* weights
* thresholds
* feature combinations
* score normalization
* severity boundaries

---

# 4. AUDIT THE CURRENT RISK SCORING SYSTEM

Inspect:

```text
engine/risk_scorer.py
engine/config.py
engine/graph_builder.py
engine/pipeline.py
engine/policy.py
eval/baseline.py
eval/metrics.py
eval/run_eval.py
data/generate_dataset.py
```

Understand exactly why the seeded abuse rings receive their current scores.

Do not blindly increase all scores.

Identify which signals are actually discriminative.

The scoring system should remain:

* deterministic
* explainable
* auditable
* reproducible
* attributable to named signals

The same input MUST always produce the same score.

---

# 5. IMPROVE SIGNAL QUALITY, NOT JUST THE THRESHOLD

Inspect the existing dataset and available attributes.

Use only signals that are genuinely available in the generated transaction/account data.

Potential signals to investigate include:

### Network signals

* number of accounts in connected component
* number of shared attributes
* strong shared-attribute count
* cross-attribute linkage
* device reuse
* IP reuse
* payment fingerprint reuse
* UPI reuse
* phone reuse
* address reuse
* multiple independent attributes linking the same accounts
* density of shared relationships
* number of distinct shared identifiers
* unusual overlap across otherwise separate identities

### Transactional signals

* transaction velocity
* burst activity
* transaction concentration
* repeated payment patterns
* unusual order frequency
* suspicious promo/coupon concentration
* refund concentration
* cancellation concentration
* value concentration
* temporal clustering
* account creation burst if available

### Cross-signal behavior

Give stronger weight to combinations such as:

```text
same device + same IP
same device + same payment fingerprint
same address + same payment fingerprint
same phone + same UPI
multiple independent shared attributes
```

A ring connected through several independent attributes should be substantially more suspicious than five legitimate accounts merely sharing an address.

Do NOT invent signals that are not supported by the dataset.

---

# 6. AVOID THE "SHARED ATTRIBUTE ONLY" PROBLEM

Legitimate entities may naturally share:

* addresses
* devices
* IPs
* phones
* networks

Therefore:

```text
one shared attribute
```

should generally be weak evidence.

But:

```text
multiple independent shared attributes
+
dense account linkage
+
suspicious transaction behavior
```

should produce materially stronger evidence.

The scorer should distinguish:

### Legitimate cluster

Example:

```text
5 accounts
same address
normal transaction behavior
low cross-attribute linkage
```

from:

### Suspicious ring

Example:

```text
5 accounts
same device
same IP
shared payment fingerprint
burst transactions
high promo/refund concentration
```

The exact signals must come from the actual dataset.

---

# 7. USE A STRUCTURED SCORE

If appropriate, refactor the scorer into clearly named components such as:

```text
network_score
attribute_link_score
behavior_score
velocity_score
cross_signal_bonus
```

Then combine them deterministically.

For example conceptually:

```text
final_score =
    network_score
    + attribute_link_score
    + behavior_score
    + velocity_score
    + cross_signal_bonus
```

This is only an architectural example.

Choose the actual formulation based on the existing project and dataset.

Every score contribution must be explainable.

For every flagged case, an analyst should be able to answer:

> "Why did this case receive this score?"

---

# 8. NORMALIZE WHERE NECESSARY

Be careful with raw counts.

A 10-account cluster naturally has more relationships than a 4-account cluster.

Do not allow cluster size alone to dominate the score.

Where appropriate use normalized quantities such as:

```text
shared attributes per account
relationship density
fraction of accounts sharing suspicious identifiers
transactions per account
suspicious transaction ratio
```

The goal is:

```text
strong evidence > large size alone
```

---

# 9. KEEP SCORE AND POLICY SEPARATE

Risk scoring MUST NOT directly decide a human action.

Maintain:

```text
risk_scorer.py
```

for deterministic risk calculation.

Maintain:

```text
policy.py
```

for deterministic mapping of severity to suggested workflow action.

The architecture should remain:

```text
Signals
   ↓
Deterministic Risk Score
   ↓
Risk Level
   ↓
Deterministic Policy Suggestion
   ↓
Human Review
   ↓
Human Action
```

Allowed human actions remain:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

There must be NO:

```text
AUTO_BLOCK
AUTO_BAN
AUTO_SUSPEND
AUTO_DELETE
```

---

# 10. CLAUDE MUST REMAIN AN EXPLANATION LAYER

Claude must NOT:

* calculate risk
* choose risk scores
* override deterministic scores
* determine final actions
* approve automatic enforcement

Claude may only provide:

* identity-resolution reasoning
* natural-language case summary
* key findings
* uncertainty
* analyst-friendly explanation

The deterministic engine remains authoritative.

The Claude schema must NOT contain a model-generated `recommended_action`.

If the existing code still has a class named something like:

```text
RecommendedAction
```

but it is actually being used for human action validation, rename it to something semantically correct such as:

```text
HumanAction
```

if doing so is safe and does not break the architecture.

---

# 11. FIX THE EVALUATION METHODOLOGY

Inspect the current evaluation carefully.

It must separately calculate:

```text
TP
FP
FN
precision
recall
```

for:

```text
naive baseline
Ring Sentinel
```

The evaluation must operate against actual seeded labels.

Do NOT fabricate metrics.

Do NOT hardcode expected results.

Do NOT manually set:

```text
precision = ...
recall = ...
INR prevented = ...
```

Everything must be calculated from the generated dataset and engine output.

---

# 12. VERIFY THE BASELINE IS FAIR

Audit the naive baseline.

It should represent a genuinely simple baseline such as:

```text
flag clusters based on a simple shared-identifier/duplicate heuristic
```

It must NOT accidentally receive information that Ring Sentinel does not have.

Likewise, Ring Sentinel must not receive holdout labels during inference.

Both methods must be evaluated on the same evaluation population.

Document the baseline clearly.

---

# 13. EVALUATION SHOULD SHOW MORE THAN ACCURACY

Do NOT optimize for generic "accuracy".

This is an abuse-detection problem with class imbalance.

The evaluation should prominently show:

```text
Precision
Recall
TP
FP
FN
```

and where meaningful:

```text
simulated / pre-payout INR prevented
false-positive investigation cost
```

Optionally also calculate:

```text
F1
flagged cases
flagged accounts
```

But do not clutter the UI.

The important judge-facing metrics are:

```text
Precision
Recall
₹ Prevented
False-positive cost
```

---

# 14. INR PREVENTED MUST BE CALCULATED HONESTLY

The project can report:

```text
simulated / pre-payout prevented value
```

but MUST NOT claim actual money was prevented.

Use the actual transaction/order values from the synthetic evaluation dataset.

Clearly label it:

```text
Simulated / pre-payout prevented value
```

Do not call synthetic evaluation results:

```text
real money saved
actual fraud prevented
production losses prevented
```

---

# 15. FALSE-POSITIVE COST MUST BE REPRODUCIBLE

If the project uses something like:

```text
1.5 hours × ₹1800/hour
```

keep the calculation explicit and configurable.

Do not manually enter the final cost.

The calculation should be derived from:

```text
number of wrongly flagged legitimate clusters
× investigation hours
× investigator hourly cost
```

Expose the assumptions in documentation or evaluation output.

---

# 16. FREEZE THE SCORING CONFIGURATION

Once development-only tuning is complete:

1. Save the final deterministic scoring weights.
2. Save the final threshold.
3. Do not modify them after observing the holdout result.
4. Run the holdout evaluation.
5. Report exactly what happens.

The process should be:

```text
GENERATE DATASET
        ↓
FIXED SPLIT
        ↓
DEVELOPMENT RINGS ONLY
        ↓
TUNE SCORING
        ↓
FREEZE CONFIG
        ↓
RUN HOLDOUT
        ↓
REPORT RESULTS
```

NOT:

```text
look at holdout
↓
change threshold
↓
run again
↓
repeat until good
```

---

# 17. IMPORTANT: DO NOT CHASE A PERFECT SCORE

Do NOT artificially force:

```text
98% accuracy
100% precision
100% recall
```

A realistic detector may have false positives and false negatives.

Judges will trust:

> "We optimized the detector on development rings and evaluated once on an untouched ring."

far more than suspiciously perfect numbers.

If the holdout result is imperfect after legitimate tuning, report it honestly.

However, the system should make a serious effort to improve the current:

```text
0% holdout recall
```

through better signal engineering.

---

# 18. ADD REGRESSION TESTS

Add tests for:

### Determinism

Same input → identical score.

### Signal attribution

Score contributions explain the final score.

### Cross-attribute linkage

Multiple independent shared identifiers increase risk appropriately.

### Legitimate cluster

A normal shared-address/family/office cluster should not automatically become critical.

### Human action gate

Only:

```text
WATCH
HOLD_PAYOUT
ESCALATE_HUMAN
```

are accepted.

### Claude isolation

Claude cannot override the engine score or action.

### Evaluation

The evaluation uses the frozen configuration.

### Holdout reproducibility

Running evaluation twice with the same dataset/configuration produces identical metrics.

### No hardcoding

Evaluation metrics must come from actual engine outputs.

---

# 19. CHECK DATASET GENERATION

Inspect:

```text
data/generate_dataset.py
```

Ensure:

```text
500 accounts
2000 orders
6 abuse rings
```

remain reproducible.

The dataset should contain meaningful behavioral differences between:

```text
abuse rings
legitimate clusters
```

If the synthetic generator is too weak to make the intended detector meaningful, improve the generator carefully.

But:

## DO NOT change the dataset merely to make the current holdout easier.

If you modify the generator, document exactly why the data-generating process was improved and regenerate the complete evaluation dataset once using a fixed seed.

Do not cherry-pick a favorable holdout.

---

# 20. GRAPH MUST REMAIN EXPLAINABLE

Preserve:

```text
sharedAttributes
```

on graph edges.

The UI should be able to show:

```text
Account A
   │
   ├── shared device_id
   ├── shared IP
   └── shared payment fingerprint
   │
Account B
```

Do not replace the graph with an opaque ML embedding.

The judge should be able to visually understand:

> "These accounts are connected because these specific identifiers overlap."

---

# 21. DO NOT INTRODUCE A BLACK-BOX ML MODEL

For this repair, do NOT replace the deterministic engine with:

* neural networks
* random forests
* XGBoost
* opaque embeddings
* LLM-based classification

unless an existing project requirement explicitly requires it.

The core detector should remain:

```text
deterministic + explainable + reproducible
```

The value proposition is network intelligence and explainable investigation, not another black-box classifier.

---

# 22. API `/metrics` MUST USE REAL EVALUATION RESULTS

Inspect:

```text
api/routes.py
api/models.py
```

The `/metrics` endpoint must expose the actual calculated evaluation metrics.

Do NOT duplicate numbers manually inside the API.

The UI's:

```text
EvaluationPanel
```

must display values returned by the backend.

There must be one authoritative evaluation implementation.

---

# 23. DO NOT USE RUNTIME MOCK DATA

Search the frontend for:

```text
mock
dummy
fake
sample
placeholder
hardcoded
```

Remove only runtime values that are pretending to be real backend results.

Static UI copy is acceptable.

All displayed:

* cases
* scores
* graph relationships
* transactions
* evaluation metrics
* event stream information

must come from the actual backend/data pipeline.

Do not silently fall back to fake data.

---

# 24. BE HONEST ABOUT "REAL-TIME"

Inspect the WebSocket/event stream.

If the system is replaying the synthetic dataset, do NOT call it genuine production real-time ingestion.

Use terminology such as:

```text
LIVE REPLAY
DATASET REPLAY
SIMULATED STREAM
```

or a similarly clear label.

If the system is actually connected to a real streaming source, then use LIVE.

Do not fake timestamps or imply production transactions are arriving if they are only being replayed.

The demo should still feel dynamic, but it must remain truthful.

---

# 25. RUN THE COMPLETE VALIDATION

After modifications, run:

```bash
python data/generate_dataset.py
pytest -q
python eval/run_eval.py
```

Then start the backend and frontend and verify:

```text
/dashboard loads
/event stream works
/graph works
/investigation works
/metrics works
/human action works
/audit log works
```

Verify all API endpoints.

Verify WebSocket behavior.

Verify Claude failure does not break deterministic detection.

---

# 26. COMPARE BEFORE VS AFTER

Before finalizing, record:

```text
BEFORE
Ring Sentinel precision:
Ring Sentinel recall:
TP:
FP:
FN:
₹ prevented:
FP cost:
```

Then:

```text
AFTER
Ring Sentinel precision:
Ring Sentinel recall:
TP:
FP:
FN:
₹ prevented:
FP cost:
```

Do not hide the before numbers.

The goal is to demonstrate that the architecture was improved through legitimate scoring methodology.

---

# 27. FINAL ACCEPTANCE CRITERIA

The project is considered fixed only if all of the following are true:

### Engineering

* [ ] Existing architecture preserved
* [ ] Existing frontend preserved
* [ ] No unnecessary rebuild
* [ ] No runtime mock data
* [ ] Deterministic scoring
* [ ] Explainable score contributions
* [ ] Network graph preserved
* [ ] Shared attributes preserved

### Evaluation

* [ ] Fixed reproducible dataset
* [ ] Fixed holdout split
* [ ] Holdout not used for tuning
* [ ] Scoring tuned only on development data
* [ ] Threshold frozen before holdout evaluation
* [ ] No hardcoded evaluation numbers
* [ ] Baseline evaluated fairly
* [ ] Precision calculated
* [ ] Recall calculated
* [ ] TP/FP/FN calculated
* [ ] Simulated ₹ prevented calculated
* [ ] False-positive cost calculated
* [ ] Results reproducible

### Safety / governance

* [ ] No automatic blocking
* [ ] No automatic banning
* [ ] Human action required
* [ ] Allowed actions only:

  * WATCH
  * HOLD_PAYOUT
  * ESCALATE_HUMAN
* [ ] Claude cannot override engine score
* [ ] Claude cannot choose final action
* [ ] Audit log records human actions

### Demo honesty

* [ ] Synthetic data clearly identified
* [ ] Simulated ₹ prevented clearly identified
* [ ] Dataset replay clearly identified
* [ ] No fake production claims
* [ ] No fabricated metrics

---

# 28. README / DEMO UPDATE

After the technical fix, update only the documentation necessary to accurately explain:

### Detection

> Ring Sentinel combines relationship-network signals with transaction behavior to identify coordinated payment-abuse clusters.

### Explainability

> Every risk score is deterministic and traceable to explicit network and behavioral signals.

### AI role

> Claude converts deterministic engine findings into an analyst-friendly case narrative; it does not calculate risk or make enforcement decisions.

### Governance

> High-risk cases require human review before payout holds or escalation.

### Evaluation

Explain:

```text
development rings
→ scoring configuration frozen
→ untouched holdout ring
→ final evaluation
```

Do not claim production validation.

---

# 29. JUDGE-FACING RESULT

The final system should tell a compelling but truthful story:

```text
Traditional duplicate detection:
"These accounts share something."

Ring Sentinel:
"These accounts form a coordinated network,
these independent identifiers connect them,
their transaction behavior is unusual,
this is the deterministic risk score,
these are the exact reasons,
and here is the evidence an investigator can review."
```

The differentiation is:

```text
ENTITY LINKING
+
NETWORK ANALYSIS
+
BEHAVIORAL SIGNALS
+
EXPLAINABLE RISK
+
HUMAN-IN-THE-LOOP GOVERNANCE
+
AUDITABILITY
```

---

# 30. FINAL OUTPUT FROM YOU

When finished, report:

## A. Root cause

Explain exactly why the holdout previously scored 54.1 and was missed.

## B. What changed

List every scoring/evaluation change.

## C. Development methodology

Explain which data was used for tuning and which ring remained untouched.

## D. Final frozen configuration

Show the final scoring components and threshold.

## E. Final evaluation

Show:

```text
                 BASELINE    RING SENTINEL
Precision
Recall
TP
FP
FN
₹ Prevented
FP Cost
```

## F. Tests

Show:

```text
pytest:
X passed
```

## G. Demo verification

Confirm:

```text
Frontend:
Backend:
WebSocket:
Graph:
Investigation:
Metrics:
Human action:
Audit:
```

## H. Files changed

Provide a concise list of modified files and why.

---

# MOST IMPORTANT INSTRUCTION

Do not optimize this project for a pretty number.

Optimize it for a **credible, reproducible, technically defensible detection system**.

The holdout result must be earned through the detector's methodology.

If you discover that the current synthetic data does not contain enough discriminative information to support a strong result, say so explicitly rather than fabricating performance.

Do not hardcode the holdout.

Do not special-case `ring_03`.

Do not lower the threshold simply because the holdout is 54.1.

Do not fabricate metrics.

Do not rebuild the frontend.

Do not add unnecessary features.

**Fix the scoring methodology, freeze it, evaluate the untouched holdout, run the full test suite, and return the exact before/after evidence.**
