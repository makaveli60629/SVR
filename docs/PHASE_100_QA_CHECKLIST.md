# Phase 100 - QA Checklist

## Launch / routing

- [ ] Lobby opens without boot lock.
- [ ] Root `index.html` loads from the web root.
- [ ] GitHub Pages deployment completes.
- [ ] `/deploy-health.json` is available.
- [ ] `/game/deploy-health.json` is available.
- [ ] `/phase100-deploy.json` is available.
- [ ] `/update/game.zip` is available.

## Webex presentation mode

- [ ] `WEBEX_PRESENTATION_MODE` flag exists.
- [ ] Showcase camera path works.
- [ ] Camera does not clip through geometry.
- [ ] Screen share view is readable.
- [ ] Quest debug panels are hidden.
- [ ] Performance stats are hidden unless needed.
- [ ] Lobby music is lower during presentation.

## Lobby / geometry

- [ ] Lobby panels are readable.
- [ ] No overlapping text.
- [ ] Red carpet walking path is open.
- [ ] Glass connects to wall instead of blocking the carpet.
- [ ] Storefronts are separated.
- [ ] Sponsor panels do not overlap poker UI.
- [ ] Duplicate / unused geometry is removed.

## Reiki module

- [ ] Reiki hologram activates near the user.
- [ ] First Reiki screen shows video/founder presentation.
- [ ] One screen appears at a time.
- [ ] Next button works.
- [ ] Back button works.
- [ ] Close button works.
- [ ] Meditation Room teleport button works.
- [ ] Reiki audio fades by distance.
- [ ] Reiki audio does not blast across the lobby.

## PGA module

- [ ] PGA hub is readable.
- [ ] Juan Espejo / PGA Training Hub signage is clean.
- [ ] Driving Range portal works.
- [ ] PGA hub does not overlap Reiki hub.

## Quest / WebXR controls

- [ ] Quest teleport ray points forward.
- [ ] Teleport is not behind the player.
- [ ] Forward movement follows camera/head direction.
- [ ] Snap turn works.
- [ ] Android movement still works.
- [ ] Desktop preview still works.

## Sky / atmosphere

- [ ] Moon is visible high in the sky.
- [ ] Mars is visible higher/back behind Moon.
- [ ] No duplicate Moon.
- [ ] Stars/constellations are visible but not too bright.
- [ ] Dusty brightness near spawn is reduced.

## Performance

- [ ] Transparent glass layers reduced.
- [ ] Textures compressed.
- [ ] Heavy shadows reduced.
- [ ] Hologram video is optional or lazy-loaded.
- [ ] FPS is stable enough for Quest/WebXR.
- [ ] `game.zip` size is checked.
