# Phase 101 — VR Runtime Correction Lock

## Reason for phase

A pasted handoff/patch attempted to replace the current Three.js/WebXR runtime with an A-Frame `index.html`, A-Frame watch component, and isolated hub construction inside the watch module. That direction conflicts with the locked SVR runtime and would reintroduce old errors.

## Errors corrected

- Rejected the full A-Frame replacement path. The active game remains the current Three.js/WebXR runtime.
- Preserved the locked site/game separation. Site was not touched.
- Preserved the single storefront portal rule.
- Hid duplicate internal Reiki and Scorpion floor rings so storefronts do not stack extra portal pads in the lobby.
- Removed the visible lobby Space Room floor portal; Space remains reachable from watch/Holo routing.
- Kept Scorpion storefront/showroom as display/portal only and preserved the private Scorpion gameplay room for real gameplay.
- Repaired watch Holo behavior with a native Three.js wrist hologram panel instead of an A-Frame component.
- Improved Quest/WebXR controller locomotion by accepting either controller and either common axis layout.
- Relaxed pinch/fist thresholds to restore fist/chinch teleport reliability.
- Pulled Moon and Mars closer/larger/lower so they stay visible from the lobby.
- Enlarged and aligned the Espresso with Cream building ad directly behind the Reiki storefront area.

## Build label

`PHASE-101-VR-RUNTIME-CORRECTION-LOCK`

## Locked rules carried forward

- One visible lobby portal per storefront/hub.
- Full private rooms must remain outside the main lobby.
- Scorpion lobby/front area is a display/portal only; real gameplay is in the private Scorpion room.
- Reiki sponsor/founder branding remains approval-placeholder only.
- Moon and Mars must remain visible in the lobby.
- Watch must expose a working Holo button/panel and scene routing.
- Hand tracking and hidden Quest/Oculus controller fallback must both remain supported.
- Future code must not replace the current Three.js/WebXR runtime with A-Frame unless the whole project is intentionally rebased.
