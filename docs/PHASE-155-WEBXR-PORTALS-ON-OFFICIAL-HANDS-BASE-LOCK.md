# PHASE-155-WEBXR-PORTALS-ON-OFFICIAL-HANDS-BASE-LOCK

## Purpose

Phase 155 starts restoring lobby portal structure on top of the working Phase 154 base: official brand logo, aligned hands/fist, no safe lock, Moon/Mars/sky, WebXR dolly movement, and no music.

## Files changed

- `game/index.html`
- `game/modules/phase155_webxr_portals_official_base.js`
- `docs/PHASE-155-WEBXR-PORTALS-ON-OFFICIAL-HANDS-BASE-LOCK.md`
- `update/version.json`

## Preserved

- Official root `logo.png` brand rule.
- No safe lock / no center magnet.
- Aligned hand/wrist fist aim.
- Purple fire and visible official-logo halo.
- 45-degree snap-turn.
- Forward/back movement by dolly heading.
- Moon/Mars/sky.
- No music.
- No watch yet.
- No world/root movement.
- No XR reference-space mutation.

## Added portals

Visual portal pads were added for:

- Reiki
- PGA
- Scorpion
- Store
- Lounge
- Seat

## Routing rule

This phase is visual/select-ready only. It records selected portal data in:

```text
window.SVR_PHASE155_LAST_PORTAL
```

Actual private-scene navigation should be wired in Phase 156 after confirming performance and locomotion remain stable.

## Test URL

```text
https://svrpoker.com/game/?v=phase155-portals-official-base
```

## Test order

1. Confirm Phase 155 loads.
2. Confirm movement and 45-degree snap-turn still work.
3. Confirm hands/fist still work.
4. Aim at portal pad with trigger or fist.
5. Release to teleport near/select the portal.
6. Confirm HUD/debug shows portal name.

## Next phase

Phase 156 should wire private scene routes one at a time.
