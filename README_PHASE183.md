# Phase 183 Backend Starter — Fold Eligibility + Muck Lock

Build: `PHASE-187-DECISION-AID-POT-ODDS-LOCK`

Adds Azure SQL starter storage for folded/mucked player eligibility events.

## New endpoints

- `POST /api/game/fold-eligibility`
- `GET /api/game/fold-eligibility?limit=30`

## New migration

- `sql/010_phase183_fold_eligibility.sql`

Protected: no SQL passwords, Stripe secrets, API keys, or admin passwords are included.
