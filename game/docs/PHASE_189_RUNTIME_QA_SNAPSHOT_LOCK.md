# Phase 199 — Runtime QA Snapshot Lock

Build: `PHASE-224-QA-SHORTCUT-INDEX-LOCK`

## Scope
- Adds `game/modules/runtime_qa.js`.
- Captures poker/runtime event bus state into `window.SVR_RUNTIME_QA`.
- Adds tester overlay toggled by keyboard `Q`.
- Emits `svr_runtime_qa_snapshot` for internal telemetry.
- Public Matrix page untouched.

## Locked rules preserved
- No unapproved Reiki/founder/wellness branding.
- Dealer body disabled; invisible deal/card logic preserved.
- Direct `/game` files must be committed because deploy excludes ZIP files.
- Package must remain under 25 MB.
