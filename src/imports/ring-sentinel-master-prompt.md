# MASTER PROMPT — Ring Sentinel Build

You are building **Ring Sentinel** for the **AI Risk Manager** track of the **Razorpay Buildathon**, inside a **12-hour build window**. Follow this blueprint in order. It is the plan, not the code — you write the code, but every decision below is locked and must be followed pin to pin. Do not deviate, do not add scope, do not "improve" the architecture mid-build.

---

## 1. Winning Thesis (internalize this before writing a line of code)

You are not building a fraud chatbot. You are building a **case-file generator with a human trigger-puller**. The entire pitch rests on three sentences:

1. Merchants catch fraud one account at a time; real abuse is a *network* of accounts that look unrelated.
2. The graph and scorer are deterministic and auditable — the LLM never decides, it only explains.
3. Nothing auto-blocks. A human always clicks. That's what makes it "defense-only" and Bumblebee-adjacent, not Bumblebee-duplicate.

Judges on this track are risk/ML-literate. They will probe for auto-action risk, cherry-picked metrics, and "is this just Bumblebee." Pre-empt all three, unprompted, in the first two minutes of the demo.

---

## 2. Full File Structure (build exactly this layout)

```
ring-sentinel/
├── README.md                     # architecture + how-to-run + metrics summary
├── requirements.txt
├── .env.example                  # ANTHROPIC_API_KEY placeholder only
├── .gitignore
│
├── data/
│   ├── generate_dataset.py       # synthetic accounts+orders+rings generator
│   ├── schema.md                 # column definitions, ring embedding logic
│   ├── accounts.csv              # generated, not hand-written
│   ├── orders.csv                # generated, not hand-written
│   └── holdout_labels.json       # true_ring_id for the 20% held-out set (test-only)
│
├── engine/                       # DETERMINISTIC — no LLM calls anywhere in this folder
│   ├── __init__.py
│   ├── graph_builder.py          # builds edges: device/IP/address/card/UPI/phone
│   ├── risk_scorer.py            # weighted edge score + velocity + promo/refund ratio
│   └── config.py                 # edge weights, thresholds — tune here, not in code
│
├── llm/                          # the ONLY place Claude gets called
│   ├── __init__.py
│   ├── narrator.py               # calls Claude, enforces fixed output schema
│   ├── prompts.py                # system prompt: fuzzy identity + dossier writing
│   └── schemas.py                # pydantic model: action ∈ {WATCH, HOLD_PAYOUT, ESCALATE_HUMAN}
│
├── audit/
│   ├── __init__.py
│   └── audit_log.py              # append-only, hash-chained JSONL writer/reader
│
├── api/
│   ├── __init__.py
│   ├── main.py                   # FastAPI app entrypoint
│   ├── routes.py                 # /clusters, /case/{id}, /approve, /metrics
│   └── models.py                 # request/response pydantic models
│
├── eval/
│   ├── __init__.py
│   ├── baseline.py                # naive exact-match duplicate detector (the comparison point)
│   ├── metrics.py                 # precision/recall/₹-prevented/false-positive-cost
│   └── run_eval.py                 # runs both systems on holdout, prints the side-by-side table
│
├── dashboard/
│   ├── index.html                 # single page: graph + case file + approve/hold buttons
│   ├── graph.js                   # vis-network or D3 render of clusters
│   ├── case_file.js               # renders LLM dossier + evidence list
│   └── style.css
│
├── logs/
│   └── audit.jsonl                # generated at runtime
│
├── docs/
│   ├── architecture_diagram.png   # graph → scorer → LLM → human gate, one image
│   ├── demo_script.md             # your 5-minute beat sheet, word for word
│   └── pitch_deck.md              # 5-6 slides worth of talking points (optional, prose is fine)
│
└── tests/
    ├── test_graph_builder.py      # does it actually cluster the seeded rings?
    ├── test_risk_scorer.py        # does score order match expected ring severity?
    ├── test_narrator.py           # does it ALWAYS return one of the 3 fixed actions, never BLOCK?
    └── test_failure_handling.py   # LLM call killed mid-request → does raw graph still render?
```

---

## 3. Hour-by-Hour Execution Plan (mapped to files — do not reorder)

| Hour | Do this | Files touched |
|---|---|---|
| 0–1 | Design + generate synthetic data: 500 accounts, 2000 orders, 6–8 seeded rings (4–12 accounts each, 2+ shared hidden attributes), plus legitimate look-alike traps (real families/offices, single-attribute overlap only). Hold out 20% of rings untouched. | `data/generate_dataset.py`, `data/schema.md` |
| 1–3 | Build the graph: nodes = accounts, edges = shared device/IP/address/card/UPI/phone. Connected components = candidate cells. Then the deterministic scorer. | `engine/graph_builder.py`, `engine/risk_scorer.py`, `engine/config.py` |
| 3–5 | LLM narration layer: one Claude call per cluster, two jobs only — fuzzy identity resolution, and writing the dossier. Enforce the 3-action enum in the schema itself, not just the prompt. | `llm/narrator.py`, `llm/prompts.py`, `llm/schemas.py` |
| 5–7 | Eval harness: run naive baseline vs your system on the untouched holdout set. This table is your entire differentiation proof. | `eval/baseline.py`, `eval/metrics.py`, `eval/run_eval.py` |
| 7–9 | Minimal dashboard: one graph view, one case-file panel, approve/hold buttons that write to the audit log. No auth, no polish beyond legible. | `dashboard/*`, `api/*` |
| 9–10 | Audit log wiring (hash-chained JSONL) + deliberately kill one LLM call mid-demo path and confirm graceful degrade (raw score still shows). | `audit/audit_log.py`, `tests/test_failure_handling.py` |
| 10–11 | Freeze the metrics table. Write README with the architecture diagram. Write the demo script word for word — don't wing the 5 minutes. | `README.md`, `docs/*` |
| 11–12 | Record the 5-minute screen capture. Submit. | — |

**Cut list — do not touch these under time pressure:** auth, real payment integration, UI animation, any multi-agent framework, any second LLM call per cluster.

---

## 4. What Each Metric Must Say

- **Precision / Recall** — computed only on the held-out 20% of rings, never the tuning set. State this out loud; it's the difference between a real number and a cherry-picked one.
- **₹ prevented** — sum of promo/refund/chargeback value inside caught rings, pre-payout.
- **False-positive cost** — hours × loaded analyst cost for a wrongly flagged legitimate cluster (the shared-family/office case exists in your data specifically to generate this number).
- **The one chart that matters** — naive duplicate-match baseline vs Ring Sentinel, same holdout set, precision/recall side by side. If this chart isn't in the first two minutes of the demo, you've buried the lede.

---

## 5. Demo Script Skeleton (write `docs/demo_script.md` in exactly this shape)

1. **Normal case** — ring forms visibly on the graph, dossier writes itself, analyst clicks HOLD.
2. **Edge case** — legitimate shared-device family correctly *not* flagged.
3. **Failure case** — LLM narration killed on stage, system still renders raw graph + score instead of going silent.
4. **Metrics** — baseline vs yours, full 500-account run, on screen.
5. **Audit trail** — show one hash-chained log entry, point at the human click it recorded.
6. **Close** — one sentence on why this is Razorpay-shippable, not a hackathon toy.

---

## 6. Pre-empt These Questions (put the answer in `docs/pitch_deck.md` verbatim — do not improvise on stage)

- *"Isn't this just Bumblebee?"* — Bumblebee vets merchants at onboarding. This watches an already-onboarded merchant's own customer base for coordinated abuse. Different data, different lifecycle stage.
- *"Why does this need AI — isn't this a graph query?"* — The graph is deterministic on purpose. AI's job is fuzzy identity resolution and writing an audit-grade explanation a non-technical analyst can act on in seconds.
- *"What's your false-positive cost?"* — Give the real number from the holdout set. Never say "98% accuracy" with nothing behind it.
- *"What happens when the AI is wrong?"* — A human reviews a case that didn't need review. Worst case is wasted analyst time — never wrongful account action, because nothing is auto-blocked.
- *"Could this be dangerous in production?"* — Only if the action enum ever included auto-block. Yours doesn't, by design. Say this before they ask.

---

## 7. Tech Stack (locked — do not relitigate mid-build)

Python/FastAPI + networkx + pandas for the engine · Claude API for narration only · SQLite + hash-chained JSONL for the audit log · vis-network or plain D3 for the graph view · GitHub repo · screen-recorded demo.

---

## Execution Instructions

Work through Sections 3 hour-block by hour-block, in order, producing the files listed for each block before moving to the next. At each hour-block:
- Build only what that block specifies — do not pull work forward from later blocks.
- Respect the cut list in Section 3 absolutely.
- The `engine/` folder must never contain an LLM call. The `llm/` folder is the only place Claude is invoked, and only for fuzzy identity resolution and dossier writing — never for the WATCH/HOLD_PAYOUT/ESCALATE_HUMAN decision itself, which must be enforced at the schema level (Section 2, `llm/schemas.py`).
- Metrics (Section 4) must be computed only on the untouched 20% holdout set — never the tuning set.
- Deliver `docs/demo_script.md` and `docs/pitch_deck.md` matching Sections 5 and 6 exactly, ready to be read on stage without improvisation.
