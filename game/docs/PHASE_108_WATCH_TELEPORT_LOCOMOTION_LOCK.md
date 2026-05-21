# Phase 108 — Watch Teleport Locomotion Lock

## Purpose
Fix watch/hologram usability after Phase 107 feedback.

## Locked corrections

- Watch hologram now starts OFF by default.
- Physical HOLO button toggles compact hologram ON/OFF.
- Compact hologram is smaller/lower so the watch is not oversized or obstructive.
- Watch includes explicit controls:
  - HOLO ON/OFF
  - TP ON/OFF
  - MOVE ON/OFF
- Teleport and locomotion are separated:
  - TP ON arms hand/controller teleport.
  - MOVE ON enables Quest stick locomotion.
  - MOVE OFF disables stick locomotion and leaves teleport available.
- Fist teleport behavior:
  - turn TP ON from watch
  - close fist near face to arm/aim
  - glowing cyan hand + glowing teleport arc/target
  - release fist to jump
- Controller movement remains optional and hidden-controller friendly.
- Current Three.js/WebXR runtime preserved.
- Site untouched.

## Safety notes
Do not replace this runtime with A-Frame snippets. The current game is Three.js/WebXR module based.
