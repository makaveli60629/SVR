# Phase 84 — Boot Safe Lobby Recovery

Game-side only. Site untouched.

Fixes:
- Replaced stale Phase 39 build label with PHASE-84-BOOT-SAFE-LOBBY-RECOVERY.
- Added boot-safe emergency lobby fallback if the world module throws during startup.
- Disabled heavy optional FBX/store/dealer runtime loads that can stall or black-screen Quest/browser startup.
- Removed unapproved Reiki/SVR PLACEHOLDER runtime assets and text; uses AWAITING APPROVAL placeholders only.
- Preserved lobby baseline, watch, controller fallback, teleport, Moon/Mars, and scene buttons.
- Kept package under 25 MB.
