# Phase 103 — Reiki Mother + Quest + Sky + Storefront Lock

## Purpose
This is the Update 3.0 lockdown recovery build. It prevents rollback drift after Phase 85/101 confusion and restores the correct Reiki mother-module direction.

## Locked Baseline
- Visible build label: `UPDATE-3.0-PHASE-103-REIKI-MOTHER-QUEST-SKY-STOREFRONT-LOCK`
- Game-side only; site untouched.
- Must update both committed `/game` and `/update/game.zip`.

## Critical Restores
- Reiki mother module with hologram/video carousel.
- Reiki private room with carousel.
- Storefront routing and private scene pages.
- No music / no auto audio.
- Quest controller teleport ray forward guard.
- Quest right-stick headset-forward locomotion.
- Moon and Mars higher/larger/textured, Mars orbiting Moon.

## Storefront Mother-Module Pattern
Each hub should use the Reiki-style pattern:

```text
Mother module
  ├─ large storefront frame
  ├─ main sign
  ├─ approval/status card
  ├─ carousel cards
  ├─ portal card(s)
  └─ private scene route
```

## Protected From Rollback
Do not reapply Phase 85 or any package that brings back the old Reiki store. Do not roll back unless `BUILD_VERSION.json`, `index.html`, `update/version.json`, and `update/game.zip` are compared first.

## QA Checklist
1. Confirm visible label shows Phase 103.
2. Confirm no music starts.
3. Confirm Reiki has carousel in lobby and private room.
4. Confirm controller teleport ray appears in front.
5. Confirm right-stick forward follows headset direction.
6. Confirm Moon/Mars are high, larger, textured, and Mars orbits Moon.
7. Confirm private scene buttons route correctly.
