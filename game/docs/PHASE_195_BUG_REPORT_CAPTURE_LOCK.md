# Phase 199 — Bug Report Capture Lock

Build: `PHASE-236-VR-INPUT-DIAGNOSTIC-LOCK`

## Added
- In-game bug report capture panel.
- `G` toggles the bug report panel.
- Stores tester reports locally for export.
- Download/copy report tools for playtest handoff.
- Captures runtime state keys from QA, session export, smoke test, deploy verifier, playtest wizard, and poker events.
- Emits `svr_bug_report_update`.

## Protected
- Public Matrix launch page untouched.
- Dealer body remains disabled.
- Invisible deal/card logic preserved.
- No secrets or SQL strings in frontend runtime.
