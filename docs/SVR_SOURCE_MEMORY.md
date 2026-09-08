# SVR Poker Source Memory

This file is the short handoff future maintainers and AI coding sessions should read before changing SVR Poker.

## Current truth

- Repository: `makaveli60629/SVR`
- Default branch: `main`
- Current workstream: professional gameplay, private-lab first
- Latest locked Quest correction: Phase 446
- Active next phase: Phase 447
- Public marketing page: frozen for this workstream
- Canonical detailed policy: `docs/SVR_MASTER_MANIFEST.md`

## User-visible intent

The owner wants a polished, believable poker experience before expanding the environment: one correct table, one Eric, no floating duplicate surface, no dark square in the headset view, no uncontrolled teleport, and a comfortable seated spawn facing the table. Android remains a critical stability target; iPhone requires a reliable touch fallback.

## Source rules

1. Inspect this file and the master manifest before implementation.
2. Inspect `.github/workflows/deploy.yml`, `game/version.json`, and deployed health metadata.
3. Work on a branch and keep changes additive.
4. Do not touch root `index.html`, `site/**`, `site.zip`, or public marketing assets in gameplay-only phases.
5. Preserve prior phase modules for rollback; establish exactly one active authority.
6. Record phase, routes, tests, protected paths, and rollback in the PR.
7. Merge only after required checks pass. Production promotion remains a separate gate from lab deployment.

## Non-negotiable gameplay authority

Clients never decide deck order, hole cards, community cards, legal actions, pot totals, balances, winners, tournament advancement, or final timers. Commands carry unique action IDs and expected sequence numbers. Replays and reconnects must be idempotent.

## Next execution checkpoint

Phase 447 must prove the command envelope and action lifecycle using deterministic tests before it is wired into visible gameplay.
