# SVR Poker Master Manifest

Status: authoritative project source memory  
Current implementation phase: Phase 447  
Repository: `makaveli60629/SVR`

## Product standard

SVR Poker is a cross-device, six-seat poker platform for Meta Quest, Android, iPhone, and browser clients. Every client presents the same rules and sends the same normalized commands. The server is authoritative for cards, RNG, legal actions, wagers, pots, stacks, turn order, timers, settlement, and reconnect snapshots.

A professional action must be eligible, deliberately selected, acknowledged immediately, accepted or rejected by authority, and reconciled to an ordered snapshot. Clients may predict presentation but never outcomes.

## Permanent protections

- Do not modify root `index.html`, `site/**`, `site.zip`, marketing copy, sponsorship pages, or public navigation during gameplay/lab phases.
- Keep `game` and `site` delivery scopes separate.
- Use feature modules and lab routes; preserve rollback predecessors.
- Do not activate forced APK updates for ordinary gameplay phases.
- Never expose hole cards, secrets, admin diagnostics, or server RNG to unauthorized clients.
- Never auto-promote a lab build to the production game route without acceptance evidence.
- Every phase requires syntax checks, deterministic tests, changed-path review, rollback instructions, and device evidence.

## Locked Quest table authority

- Exactly one approved Lab table and one Eric are rendered.
- Duplicate tabletops, legacy dealer roots, face-mounted dark overlays, and uncontrolled blinking props are removed or detached.
- Eric uses the approved asset and scale, remains grounded, and is aligned to the dealer position.
- Player begins seated at a comfortable table eye line.
- Table-zone teleport, hand teleport, and grip teleport remain disabled.
- Future lobby travel may use deliberate destination pads only: outside the table exclusion zone, hold-to-confirm, cooldown, comfort fade, and never a hand-grab teleport gesture.

## Cross-device input contract

All adapters emit the same command envelope:

`{ protocolVersion, tableId, sessionId, clientActionId, expectedSequence, action, amount, sentAt }`

Quest hands/controllers, Android touch/gyroscope, iPhone touch-raycasting, desktop mouse/keyboard, and accessibility controls must not contain poker authority. They only translate intent.

## Professional gameplay priorities

1. Deterministic poker actions and authoritative reconciliation.
2. Quest seated comfort, readable cards, stable hands/controllers, and 72–90 FPS target.
3. Android and iPhone control parity with no overlapping controls.
4. Disconnect/reconnect snapshots with monotonic sequence numbers and idempotent action IDs.
5. Spatial audio, captions, mute/block/report controls, and tournament presentation.
6. Asset budgets, baked lighting, instancing, merged static geometry, atlases, and adaptive effects.

## Lobby architecture

The approved direction is an octagonal casino atrium with four feature recesses, emissive structural trims, a central giveaway pedestal, volumetric-looking portal arches, and eye-level spatial UI. Build it modularly. Static architecture should be merged or instanced, lighting baked where possible, and real-time lights reserved for hands, chips, avatars, and small focal effects.

## Phase map

- Phase 446: Quest Lab table/Eric duplicate cleanup, face-overlay cleanup, teleport lock, seated placement.
- Phase 447: canonical action lifecycle, command validation, idempotency, sequence reconciliation, protected test harness.
- Phase 448: Quest hand/controller polish and comfort metrics.
- Phase 449: Android/iPhone parity and responsive interaction.
- Phase 450: authoritative six-seat WebSocket room and reconnect recovery.
- Phase 451: spatial audio, social safety, holographic tournament presentation.
- Phase 452: performance certification and release candidate.

## Definition of done

A phase is done only when its behavior is deterministic, device-readable, independently testable, protected from public-page changes, reversible, and supported by acceptance evidence. “Looks correct” alone is not sufficient.
