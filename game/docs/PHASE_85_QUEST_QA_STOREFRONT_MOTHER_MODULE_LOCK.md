# Phase 85 — Quest QA + Storefront Mother-Module Lock

## Scope
Game-side only. Website and public site files remain untouched.

## Purpose
This phase locks the next build after Phase 84 by keeping the current lobby baseline, preserving the Quest teleport/locomotion fixes, and formalizing the storefront mother-module pattern for PGA, SVR Store, Reiki, Smoker Lounge, and future sponsor portals.

## Quest locomotion QA lock
- Controller teleport must stay in front of the player/camera.
- Grip, A, or trigger must use hold → aim → release.
- Purple raycast/arc and SVR floor marker must be visible.
- Right stick Y must move forward/back based on headset yaw.
- Right stick X must snap turn 45 degrees.
- No sideways drift after a 45-degree turn.

## Storefront mother-module lock
Every major lobby storefront should follow the same reusable structure:

1. Main building/storefront frame
2. Info card
3. Approval/status card
4. Portal card carousel
5. Private-scene route target

## PGA module update
- PGA area remains the Juan Espejo Golf Academy storefront.
- Maryville label remains present.
- Waiting Approval remains visible.
- Drive Range and Chip + Putt are carousel cards within the golf academy module.
- Private golf rooms stay separate from the lobby.

## Protected
- Do not touch website files.
- Do not redesign the lobby.
- Do not move private scenes into the lobby.
- Keep game package under 25 MB.
- Keep unapproved sponsor/founder material gated behind approval placeholders.

## Test checklist
1. Load `/game/?v=phase85`.
2. Confirm build label says `UPDATE-3.0-PHASE-85-QUEST-QA-STOREFRONT-MOTHER-MODULE-LOCK`.
3. On Quest, hold grip/A/trigger and confirm teleport ray appears in front.
4. Release to teleport only after the marker is visible.
5. Turn 45 degrees, push forward, and confirm movement follows the new headset-facing direction.
6. Confirm PGA Golf Academy shows the carousel cards.
7. Confirm SVR Store, Reiki, Smoker, and Scorpion remain lobby portals/private routes.
