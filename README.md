# Ring Sentinel

Network-level payment-abuse detection and investigation. Deterministic detection,
AI-assisted explanation, and a **mandatory human gate**. Nothing auto-blocks.

- **Problem** — merchants catch fraud one account at a time; coordinated abuse is a
  *network* of accounts that individually look fine.
- **Solution** — build a relationship graph over shared identifiers, score candidate
  clusters deterministically, let Claude *explain* (never decide), and require a human
  click for any action — all recorded in a hash-chained audit log.

## Architecture

```
Synthetic dataset → NetworkX graph → deterministic risk engine
                                          ├── holdout evaluation (20%)
                                          └── Claude narrator (explanation only)
                                                     ↓
                                             FastAPI backend
                                                     ↓
                                         existing React analyst UI
                                                     ↓
                              human: WATCH / HOLD_PAYOUT / ESCALATE_HUMAN
                                                     ↓
                                        hash-chained audit log
```
See `docs/architecture_diagram.svg`. Critical boundaries: **LLM ≠ detector,
LLM ≠ risk scorer, LLM ≠ decision maker**, and **no auto-block**.

## Layout
| Path | Role |
|---|---|
| `data/` | deterministic synthetic dataset generator + schema + 20% holdout |
| `engine/` | NetworkX graph builder, deterministic scorer, tunable config — **zero LLM** |
| `llm/` | Claude narrator, prompts, Pydantic action enum (rejects BLOCK) — the only place Claude is called |
| `audit/` | append-only, hash-chained JSONL audit log |
| `eval/` | naive baseline vs Ring Sentinel on the untouched holdout |
| `api/` | FastAPI serving both spec endpoints and the endpoints the frontend already uses |
| `src/` | existing React + Vite analyst console (unchanged in design) |
| `tests/` | graph, scorer, action-enum, and Claude-failure tests |

## Dataset & holdout methodology
`data/generate_dataset.py` deterministically emits 500 accounts, 2000 orders, 6–8
seeded rings (4–12 accounts, ≥2 shared hidden attributes), plus legitimate
family/office look-alikes that share only one weak identifier. 20% of rings are held
out in `data/holdout_labels.json`. **Engine weights/thresholds are tuned only on the
other 80%; all reported metrics are computed only on the holdout.** The engine never
reads the ground-truth labels.

## Graph construction & risk scoring
Accounts are nodes; edges connect accounts sharing device / IP / address / card / UPI
/ phone, and each edge preserves *which* attributes were shared. Connected components
are **candidate** clusters — not conclusions. `engine/risk_scorer.py` produces a
deterministic, fully-attributed score from clearly named components: network shape
(`cluster_size`), **attribute linkage** (`attribute_linkage`), transaction behavior
(`velocity`, `promo_abuse`, `refund_concentration`), creation-burst timing, and a
`cross_signal` bonus. Weights live in `engine/config.py`. Same input → same score.

The core discriminator is **attribute linkage**: coordinated rings are held together
by *multiple independent* shared identifiers, while legitimate family/office/organic
clusters share exactly **one**. The score rewards the number of distinct shared
identifiers (with an extra bonus for strong payment/device fingerprints) and adds the
`cross_signal` bonus when multi-attribute linkage co-occurs with abusive behavior. A
single shared identifier stays weak evidence (`weak_shared_only`), and cluster size is
capped so size alone can never flag a cluster. This is a signal-quality property, not
a threshold tweak — the flag cutoff remains `high_threshold = 55.0`.

### Development tuning → freeze → holdout
Weights are tuned using **only the development rings (the non-holdout 80%)**.
`python eval/tune.py` reports the score separation between development rings and
legitimate clusters and **never reads the holdout rings**. Once separation is strong,
the config in `engine/config.py` is frozen (immutable `@dataclass(frozen=True)`)
*before* `eval/run_eval.py` is ever run against the untouched holdout. The holdout is
never used to pick weights, no ring id is special-cased, and the cutoff is never
lowered to match a specific holdout score.

## LLM role & failure handling
Claude does two things only: fuzzy identity resolution and writing the analyst
dossier from the *already-computed* evidence. It never sets the score and never
chooses an action outside the enum. If the key is missing or Claude times
out/errors/returns malformed output, narration degrades to
**"AI narration unavailable. Showing deterministic evidence and risk score."** — the
graph, score and evidence still render.

## Human gate & audit trail
The only analyst actions are `WATCH`, `HOLD_PAYOUT`, `ESCALATE_HUMAN`, enforced by a
Pydantic enum at the schema level *and* rejected at the API boundary. Each click
writes a hash-chained record (`timestamp, case_id, event_type, action, evidence,
previous_hash, current_hash`); altering any earlier record breaks
`audit.verify_chain`.

## Metrics
`python eval/run_eval.py` prints precision, recall, ₹ prevented (simulated,
pre-payout, within caught rings), and false-positive cost for baseline vs Ring
Sentinel on the holdout. Numbers are computed, never hard-coded.

**Evaluation unit (precision/recall):** account-level over the holdout scope
(holdout-ring accounts as positives + all legitimate accounts as negatives). A
**true positive** is a holdout-ring account that Ring Sentinel surfaces inside a
flagged cluster; a **false positive** is a legitimate account surfaced; a **false
negative** is a holdout-ring account missed. `precision = TP/(TP+FP)`,
`recall = TP/(TP+FN)` — computed in `eval/metrics.py`, asserted in
`tests/test_scoring_methodology.py`.

**False-positive cost** is a separate *operational* metric measured at the
cluster level: `wrongly-flagged legitimate clusters × 1.5h × ₹1800/h`. A single
legitimate account swept into an otherwise-correct cluster counts as an
account-level FP but adds **no** FP cost, because no analyst hour is spent on a
wholly-false cluster — the two numbers answer different questions and are both
reported honestly.

## How to run

### Quickstart (local demo)
```bash
./start_demo.sh   # dataset → FastAPI (0.0.0.0:8000) → frontend, all in one
```
One command for the whole local pipeline; Ctrl-C stops everything.

### Manual steps
```bash
# 1. dataset
python data/generate_dataset.py

# 2. backend — bind 0.0.0.0 so the browser can reach it, then keep it running
python -m pip install -r requirements.txt
cp .env.example .env            # optionally add ANTHROPIC_API_KEY
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload   # http://localhost:8000

# 3. frontend (separate terminal). .env already sets VITE_API_BASE_URL for MODE A.
pnpm install && pnpm dev        # http://localhost:8443

# 4. tuning (development rings only), evaluation (untouched holdout) & tests
python eval/tune.py        # dev-ring separation; never touches the holdout
python eval/run_eval.py    # baseline vs Ring Sentinel on the untouched holdout
pytest
```

## Connectivity — two modes

The frontend reaches the backend **only** through explicitly configured
endpoints (`VITE_API_BASE_URL`, optional `VITE_WS_URL`). There is no implicit
`localhost` or same-origin fallback: with nothing configured the dashboard shows
**Backend not configured** rather than pretending a stream exists. The WebSocket
protocol is derived from the REST base (`http→ws`, `https→wss`) so an `https`
page never dials an insecure `ws://` socket.

**MODE A — Local demo** (browser and backend on the same machine). Copy the
template (`cp .env.local.example .env.local`; `.env.local` is git-ignored):
```
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000/events
```

**MODE B — Hosted demo** (backend deployed at a separate, publicly reachable,
CORS-enabled origin — do **not** point judges at your laptop's localhost):
```
VITE_API_BASE_URL=https://YOUR_BACKEND_HOST
VITE_WS_URL=wss://YOUR_BACKEND_HOST/events   # optional; derived if omitted
```
For MODE B, set `RING_SENTINEL_CORS` on the backend to include the frontend
origin, and ensure any reverse proxy forwards WebSocket `Upgrade` headers.

The app auto-connects on load and **Retry** performs a real re-dial. In dev mode
the browser console logs `[ring-sentinel ws]` diagnostics (dial URL, open, close
code/reason). If the backend isn't reachable, the UI shows **OFFLINE** with a
Retry button and no data — by design it never fabricates transactions.

## Limitations
- Dataset is synthetic (the evaluation substrate), not live production traffic.
- No auth and no real payment integration — explicitly out of scope for the build.
- Single Claude call per cluster; no multi-agent orchestration.

## Bumblebee differentiation
Bumblebee = merchant onboarding/vetting. Ring Sentinel = post-onboarding
customer-network abuse investigation. Different data, different lifecycle stage. See
`docs/pitch_deck.md`.
