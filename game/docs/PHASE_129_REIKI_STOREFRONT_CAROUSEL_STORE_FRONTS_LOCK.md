# Phase 129 — Reiki Storefront Carousel + Other Storefronts Lock

## Scope

Game-side only. Website, public site, backend, and Azure files are untouched.

## Baseline restored

This branch is based on the newer Phase 128 game baseline:

`UPDATE-3.0-PHASE-128-HIGHER-BIGGER-EARTH-MOON-MARS-ORBIT-LOCK`

That restores the high Earth/Moon/Mars orbit cluster, Quest performance cleanup, fitted hand/glove overlay, and prior Reiki presentation modules that were lost when the old Phase 84 backup was applied.

## Reiki fixes

- Keeps the polished Trueitive/Reiki presentation storefront active for demo review.
- Adds visible red `WAITING FOR APPROVAL` wording on the Reiki/founder presentation surface.
- Moves the glass/wall presentation structure farther back so the red carpet opens up.
- Keeps the carousel compact instead of scattering overlapping popup screens.
- Keeps the center hologram/video surface inside the carousel stack.
- Keeps the Reiki audio/video gated by user gesture and proximity.
- Keeps private Reiki/meditation route separate from the lobby.

## Other storefronts added

Added lightweight storefront portal visuals for:

- PGA Expansion
- SVR Store
- Vibes Theater
- Scorpion Room

These are visual/route storefronts only. They do not redesign the lobby or merge the private rooms into the lobby.

## Locked rules

- Do not touch `/site` or public website files.
- Do not remove the Phase 128 sky/planet work.
- Do not reapply the old Phase 84 backup over this branch.
- Storefronts remain portal surfaces; private rooms stay separate.
- Every presentation surface should remain removable if approval status changes.
