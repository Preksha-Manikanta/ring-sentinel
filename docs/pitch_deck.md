# Ring Sentinel — Pitch / Q&A (answer verbatim)

## Thesis
Merchants catch fraud one account at a time; real abuse is a *network* of accounts
that look unrelated. Ring Sentinel finds the network, explains it in an audit-grade
case file, and keeps a human on the trigger. The graph and scorer are deterministic
and auditable — **the LLM never decides, it only explains. Nothing auto-blocks.**

## Pre-empted questions

**Isn't this just Bumblebee?**
> Bumblebee vets merchants at onboarding. This watches an already-onboarded
> merchant's own customer base for coordinated abuse. Different data, different
> lifecycle stage.

**Why does this need AI — isn't it a graph query?**
> The graph is deterministic on purpose. AI's job is fuzzy identity resolution and
> writing an audit-grade explanation a non-technical analyst can act on in seconds.

**What's your false-positive cost?**
> Use the actual computed value from `python eval/run_eval.py` on the holdout set
> (wrongly-flagged legitimate clusters × 1.5h review × ₹1800/h loaded cost). Never
> say "98% accuracy" without supporting evidence.

**What happens when the AI is wrong?**
> A human reviews a case that didn't need review. Worst case is wasted analyst time
> — never wrongful account action, because nothing is auto-blocked.

**Could this be dangerous in production?**
> Only if the action enum ever included auto-block. Yours doesn't, by design.

## Bumblebee differentiation
```
Bumblebee      = merchant onboarding / vetting
Ring Sentinel  = post-onboarding customer-network abuse investigation
```
The products are not identical and do not overlap in lifecycle stage.

## Safety by construction
- `engine/` contains zero LLM calls (verified by test).
- The Pydantic action enum only admits WATCH / HOLD_PAYOUT / ESCALATE_HUMAN;
  BLOCK/SUSPEND/BAN raise validation errors at both the schema and API boundary.
- Every human action is written to a hash-chained audit log; tampering is detectable.
