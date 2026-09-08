# Phase 448 — Quest Comfort and Input Lab

## Scope

Phase 448 begins the Quest professional-play layer without wiring changes into the visible production route. It adds deterministic hand/controller intent normalization, duplicate-input suppression, performance sampling, and measurable seated-comfort gates.

## Locked protections

- Root `index.html`, `site/**`, archives, marketing pages, and public navigation are unchanged.
- Phase 446 remains the rendered table/Eric/seat authority.
- Table, hand, and grip teleport remain disabled.
- No cards, pot, balance, legal-action, RNG, or winner authority moves to the client.
- The module lives under `game/labs/pro-playtest/` until physical Quest acceptance.

## Acceptance gates

- Valid left/right hand and controller input is normalized consistently.
- Duplicate selection inside 180 ms is rejected.
- Confirmation requires deliberate pressure.
- Seated eye height is 1.35–1.75 m.
- Seat drift is no more than 0.08 m.
- No face obstruction is closer than 0.45 m.
- 72 Hz frame budget is 13.89 ms; the sampled p95 must stay within budget.
- Teleport state is explicitly false.

## Next integration

After physical Quest validation, connect the lab adapter to the Phase 447 command envelope. The adapter may translate intent only; server-authoritative poker state remains unchanged.

## Rollback

Remove the Phase 448 lab module, audit, and workflow, then restore the two source-memory files to Phase 447. No visible game route depends on this phase.
