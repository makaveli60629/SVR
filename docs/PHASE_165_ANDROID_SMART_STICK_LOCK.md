# Phase 165 — Android Smart Stick Lock

## Scope
Android-only alignment and control pass for `/game/`.

## Locked Target
- Android smart browser only.
- Does not change Quest/WebXR hand controls.
- Does not change Quest controller teleport/locomotion.
- Does not change desktop keyboard/mouse controls.

## Changes
1. Added `game/modules/android_smart_controls.js`.
   - Android user-agent gate.
   - Left touch stick = movement.
   - Right touch stick = look/camera.
   - Center button = recenter view.
   - Table button = dispatches table/join action.
   - Overlay is hidden for non-Android and during WebXR sessions.

2. Updated `game/main.js`.
   - New build label: `UPDATE-3.0-PHASE-165-ANDROID-SMART-STICK-LOCK`.
   - Imports Android smart control module.
   - Disables desktop pointer controls on Android smart mode.
   - Keeps desktop controls for non-Android.
   - Keeps Quest/WebXR controls untouched.
   - Runs Android stick update only when not in WebXR and not in preview/autocam.

3. Updated `game/index.html`.
   - Mobile viewport locked for Android browser.
   - Boot card aligned for phone screens.
   - Loading text updated to Phase 165.
   - Cache-bust query updated to `phase165-android-smart-stick-lock`.

## Verification Checklist
- Open `https://svrpoker.com/game/` on Android Chrome/Samsung Internet.
- Loading card fits the screen without clipping.
- Left stick moves forward/back/strafe.
- Right stick looks around.
- Scene buttons sit above the Android sticks.
- Quest browser entering VR still uses Quest controls and does not show Android overlay.
- Desktop still uses keyboard/mouse and does not show Android overlay.

## Commit Summary
- `9af7e6d76877248e88b47c05c58bebd89955229b` — Added Android smart controls module.
- `37f487aa7b25759521024307e1317469fd835cda` — Locked Android controls in game runtime.
- `a83dbf84b5f74e4387e1bf9b502b3120bc54cda7` — Aligned Android game loading layout and phase label.
