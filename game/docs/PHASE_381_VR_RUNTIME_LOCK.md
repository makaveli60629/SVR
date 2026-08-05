# SVR Poker Phase 381 — VR Seat, Eric Rig, Audio and Overlay Lock

## Scope

This phase preserves the locked Phase 380 public Matrix page, site portal, original lobby, uploaded poker table, Android stable table and APK policy. It changes only the full 3D game runtime and its deployment/version contracts.

## Root causes corrected

1. The Quest NPC sanitizer hid every object whose name contained `Eric`, while the visible dealer animation was a separate procedural skeleton. Eric's mesh and dealer motion were therefore never one character.
2. Seated movement and teleport suppression lived mainly in Quest-only modules. A universal guard was needed so every 3D platform treats a seated player as position-locked until Leave Table.
3. Camera-attached debug/comfort planes could remain near the headset and look like a faint screen.
4. Current source no longer included the earlier card/chip audio payload. A lightweight replacement was needed without increasing the package size.

## Corrections

- Loads `game/assets/models/eric/eric.fbx` as the approved visible dealer.
- Maps the optimized uploaded `Cards.fbx` dealer motion onto Eric's actual armature.
- Applies a subtle hands/arms shuffle while idle and full motion on new-hand/community events.
- Hides the replaced procedural dealer skeleton and removes the old Eric quarantine import from the active entry point.
- Locks locomotion, snap turn, all teleport modes, hand rays and rig movement methods while seated.
- Holds the seated rig at its captured table anchor until Leave Table.
- Restores movement and teleport flags only after leaving.
- Hides named camera/head overlays and near-head transparent debug planes while protecting watches, hands, cards, table, buttons and dealer assets.
- Adds procedural ambience, shuffle, deal, chip and winner sounds with user-gesture WebAudio unlocking and `M` / watch-compatible toggle aliases.
- Keeps Android stable at Phase 380 and APK RC2 without a forced app update.

## Acceptance still requiring a headset

Static checks can verify wiring, versioning and protected contracts. Physical Quest acceptance is still required for final confirmation of Eric's bone mapping, seated eye height, overlay removal, controller comfort and sound balance.
