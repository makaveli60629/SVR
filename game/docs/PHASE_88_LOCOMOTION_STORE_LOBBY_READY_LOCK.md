# Phase 88 — Locomotion Store Lobby Ready Lock

## Scope
Game-side only. Website/site files are untouched.

## Main fixes
- Re-locked Quest/Oculus controller locomotion.
- Right stick up/down moves forward/back relative to headset facing.
- Right stick left/right performs 45-degree snap turns.
- Controller teleport now uses hold-to-aim / release-to-teleport from A, grip, or trigger.
- Removed risky controller toggle behavior that could leave teleport stuck or pointed the wrong way.
- Kept hand tracking teleport route intact.
- Lobby music remains off until manually toggled with `M` or the wrist watch.
- Reiki hologram portal stays paused and only enables when routed from the Reiki area.
- Added a clean SVR Store portal surface in the lobby pointing to `https://svrpoker.com/site/store.html`.
- Cleaned unapproved Reiki sponsor/founder runtime references and removed unapproved media payloads.

## Controls

### Quest/Oculus
- Right stick up/down: move forward/back.
- Right stick left/right: 45-degree snap turn.
- Hold A / grip / trigger: aim teleport.
- Release A / grip / trigger: teleport.

### Desktop
- `M`: lobby music on/off.
- `O`: open store portal.
- `9`: Reiki video portal, only when inside the Reiki area.
- `0`: jump to store portal.

## Store lock
The game lobby portal opens the website store externally so the live lobby stays lightweight and stable.

## Reiki lock
No unapproved founder, sponsor, business website, or outside Reiki branding is active in the runtime. Reiki uses SVR branding and AWAITING APPROVAL placeholders.

## Package rules
- Keep game zip under 25 MB.
- Preserve lobby baseline.
- Preserve site lock.
