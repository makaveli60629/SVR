# Phase 368 — Card Dealer Animation Lock

## Objective

Add the uploaded `Cards.fbx` as the visible card dealer without replacing the current poker, table, Android, Quest, Camera 3, avatar, or deployment authorities.

## Source audit

- Source: `Cards.fbx`
- Binary FBX version: 7700
- Original bytes: 2,511,648
- SHA-256: `58bc92ee6c5b4d2ca6470451d1fd96aedfa62d065d651945eb981b6a1c964303`
- Rig: Mixamo humanoid
- Animation duration: 9 seconds
- Includes upper-body, hand, spine, head, hip and leg motion
- Includes two skinned meshes and embedded materials, but no external textures

## Runtime optimization

The browser build does not ship the raw 2.5 MB FBX. Phase 368 extracts the uploaded FBX's animated Mixamo motion into a 6 FPS, quantized motion profile and drives a lightweight procedural SVR dealer mannequin. The renderer interpolates between frames, preserving the uploaded dealer motion while reducing runtime transfer and avoiding another heavy FBX parse on Quest and Android.

The optimized profile retains 14 primary tracks, including both hands, forearms, shoulders, spine, neck, head and hips. Source checksum and byte count are embedded in the motion module and checked by CI.

## Dealer behavior

- Deferred until the authoritative table and scene exist.
- Stands behind the north side of the current table and faces the felt.
- Adds a small deck prop at the dealer edge.
- Plays the uploaded motion when a new hand starts.
- Replays when the flop, turn, or river is dealt.
- Exposes a manual QA hook:

```js
window.SVR_PHASE368_PLAY_CARD_DEALER('manual-test')
```

## Protected systems

Phase 368 does not replace:

- Phase 336 poker rules, turns, evaluation, pots, and payout
- Current table authority
- Phase 347/350 Android controller authority
- Phase 364 Quest and geometry safeguards
- Phase 365/367 Android seated and physical-device behavior
- Camera 3 route
- Website or site files

## Runtime QA

```js
window.SVR_PHASE368_CARD_DEALER_STATE
window.SVR_PHASE368_LOAD_CARD_DEALER()
window.SVR_PHASE368_ALIGN_CARD_DEALER()
window.SVR_PHASE368_PLAY_CARD_DEALER('manual-test')
```

Acceptance requires:

1. Source checksum, size, FBX version and animation duration remain locked.
2. Motion payload decodes to the expected frame/bone counts.
3. Dealer appears behind the authoritative table.
4. Dealer responds to `svr:poker-state` without becoming a poker authority.
5. Desktop/Quest, Android, and Camera 3 routes all load the same module.
6. Existing Phase 367 Android and prior protected tests remain green.
