# SVR Poker — Update 1.5 Audit Lock

## Audit date
2026-06-06

## Current correction
The active work target is **Update 1.5 Stability Build**. Numeric phase labels such as Phase 84 are no longer the controlling version label for this work track.

## Source reconciliation
The uploaded Update 1.5 framework establishes the intended current target as `UPDATE 1.5 STABILITY BUILD` with safe Python zip extraction in the GitHub Actions pipeline.

The uploaded storefront audit PDF describes a later forward-looking Phase 100 / 3.0 plan. That document is useful for future roadmap planning, but it is not the current active build target.

The repo manifest previously stated `PHASE-103-STABILITY-AUDIT-LOCK`. That has now been corrected in `docs/GAME_MANIFEST.md` so Update 1.5 is the controlling target.

## Locked current goals
- Game-side only.
- Do not touch the public website/site track.
- Preserve current lobby baseline.
- Maintain private-room routing.
- Fix Quest controller locomotion so forward/back follows the camera/head direction.
- Leave Android configuration alone.
- Leave desktop configuration alone.
- Show Quest controller models as controllers.
- Grip/squeeze shows teleport ray and SVR logo marker.
- Trigger commits teleport when aimed.
- A button toggles action laser.
- Trigger while action laser is active activates UI/raycastable buttons.
- Moon and Mars must be textured, higher, larger, rotating/orbiting, and free of duplicate geometry-only versions.
- Mars should orbit the Moon.
- Add denser stars and lightweight constellation clusters.
- Keep Reiki approval-safe with no unapproved sponsor/founder branding.

## Conflict notes
The uploaded Update 1.5 token says `VR HAND-TRACKING ONLY / NO CONTROLLERS`. That conflicts with the active Quest controller requirement. For this repo, the corrected control rule is:

**Meta hand tracking first, with Quest controller fallback preserved and actively fixed.**

The uploaded Phase 100 / 3.0 audit includes AI concierge, Webex, and AWS expansion. Those are future roadmap items and should not be inserted into the active Update 1.5 game fix until the core Quest controller and sky/planet issues are stable.

## Deployment status
The GitHub workflow currently uses the safe Python zip extraction concept. The next full game package must align visible build labels, update metadata, and zip contents to:

`UPDATE-1.5-STABILITY-BUILD`

## Do not regress
- Do not rename Update 1.5 back to Phase 84.
- Do not replace the current runtime with the simplified A-Frame sample from the pasted manifest.
- Do not remove controller support.
- Do not edit the website in this game track.
- Do not merge private scenes into the lobby.
