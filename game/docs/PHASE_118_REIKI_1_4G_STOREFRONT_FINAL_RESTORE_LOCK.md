# Phase 118 — Reiki 1.4G Storefront Final Restore Lock

## Build label
UPDATE-3.0-PHASE-118-REIKI-1-4G-STOREFRONT-FINAL-RESTORE-LOCK

## Purpose
Fix the failed Phase 117 apply-label mismatch and restore the screenshot-approved Reiki/Trueitive storefront structure.

## Restored visual target
- Wide teal storefront frame.
- Red carpet entry path.
- Red ropes and stanchion queue.
- Plants placed around the carpet/stage without blocking the front view.
- TRUEITIVE / Reiki presentation signage.
- Center portrait/hologram slot.
- Compact hologram/video carousel controls.
- Private Reiki/video route preserved.

## Fixed from the failed attempt
The previous apply script expected a label that did not match the ZIP index label. This package has a single normalized build label and a matching apply script.

## Locks
- Lobby music remains disabled.
- Public website/site remains untouched.
- Do not restore generic approval-only Reiki placeholder over this presentation storefront unless owner explicitly asks.
- Do not replace this with the full Reiki private room embedded in the lobby.
- Keep game package under 25 MB.
