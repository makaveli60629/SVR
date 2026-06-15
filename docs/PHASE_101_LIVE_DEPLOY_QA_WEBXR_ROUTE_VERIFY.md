# Phase 101 - Live Deploy QA, WebXR Route Verification, Quest Demo Lock

## Phase purpose

Phase 101 validates that the Phase 100 auto-deploy path is live, stable, and usable for Quest/WebXR and Webex demonstration.

This phase is QA and verification only unless a blocker is found.

## Locked rule

Do not rebuild the website. Do not replace the Phase 94 lobby baseline. Do not modify Android movement unless compatibility requires it. Do not add Unity-only logic. Do not change sponsor content approval status during this QA pass.

## Primary validation routes

After GitHub Pages completes deployment, validate these routes:

```text
/
/game/
/reiki/
/android/
/downloads/
/deploy-health.json
/game/deploy-health.json
/phase100-deploy.json
/update/game.zip
```

## Live deploy checklist

- [ ] GitHub Pages workflow completes.
- [ ] Root route loads.
- [ ] `/game/` route loads.
- [ ] `/reiki/` route loads.
- [ ] `/android/` route loads.
- [ ] `/downloads/` route loads.
- [ ] `/deploy-health.json` loads.
- [ ] `/game/deploy-health.json` loads.
- [ ] `/phase100-deploy.json` loads.
- [ ] `/update/game.zip` is reachable.
- [ ] Health file commit matches latest deploy commit.

## Quest / WebXR verification

- [ ] Quest browser can enter WebXR.
- [ ] Lobby opens without boot lock.
- [ ] Spawn faces the correct direction.
- [ ] Teleport ray points forward.
- [ ] Teleport does not aim behind the player.
- [ ] Forward movement follows camera/head direction.
- [ ] Snap-turn still works.
- [ ] Hands remain primary.
- [ ] Controller fallback still works.

## Lobby verification

- [ ] Lobby panels are readable.
- [ ] No overlapping text bundles.
- [ ] Red carpet path remains open.
- [ ] Glass is attached to the building wall and not blocking the carpet.
- [ ] Sponsor modules remain separated.
- [ ] Poker UI does not overlap sponsor UI.
- [ ] FPS is stable enough for Quest.

## Reiki verification

- [ ] Reiki hologram activates near the hub.
- [ ] First screen shows video/founder presentation placeholder or approved content.
- [ ] One screen appears at a time.
- [ ] Next button advances correctly.
- [ ] Back button works.
- [ ] Close button works.
- [ ] Meditation Room teleport button exists.
- [ ] Reiki audio is distance-aware.

## PGA verification

- [ ] PGA Training Hub signage is readable.
- [ ] Juan Espejo / PGA module remains clean.
- [ ] Driving Range portal exists.
- [ ] PGA hub does not overlap Reiki hub.

## Webex presentation verification

- [ ] Desktop demo route is readable on screen share.
- [ ] Camera path does not clip into walls or glass.
- [ ] Quest debug panels are hidden in presentation mode.
- [ ] Lobby music is reduced during presentation.
- [ ] Hologram audio can be controlled manually.
- [ ] Sponsor modules look premium and separated.

## Sky / atmosphere verification

- [ ] Moon is visible high in the sky.
- [ ] Mars is visible higher/back behind Moon.
- [ ] No duplicate Moon is visible.
- [ ] Stars and constellations are visible but not too bright.
- [ ] Bright dust near spawn is reduced.

## Blocker rules

If a blocker is found, create the next patch phase as:

```text
Phase 101A - Deploy Blocker Patch
```

Only patch the failing route or broken WebXR behavior. Do not start a redesign.

## Commit name

```text
Phase 101 - Live Deploy QA, WebXR Route Verification, Quest Demo Lock
```
