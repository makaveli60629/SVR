# Phase 199 — Playtest Wizard Lock

Build: `PHASE-233-OPTIONAL-MODULE-LOADER-LOCK`

## Scope
- Adds guided playtest wizard overlay.
- Keeps public Matrix launch page untouched.
- Keeps dealer body disabled while preserving invisible deal/card logic.
- Preserves QA/export/deploy verifier/release-candidate modules.

## Keyboard
- `W` = Playtest wizard
- `V` = Deploy verifier
- `T` = Smoke test
- `U` = Release candidate checklist
- `Q` = Runtime QA
- `X` = Download session export
- `Y` = Copy session export
- `F/C/R/A/H` = Poker action tests

## Validation
- JS syntax passes.
- Game package remains below 25 MB.
- Unapproved sponsor/founder/wellness branding remains removed.
