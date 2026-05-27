# PHASE 261 — VR Interaction Repair Lock

## Goal
Repair VR interaction safely after Phase 260 moved optional interaction layers behind a safe loader.

## Fixes
- Adds phase261_interaction_repair.js
- Provides safe kiosk open bridge.
- Provides portal route bridge.
- Provides chip/card select hooks.
- Provides watch select hook.
- Provides desktop ray fallback.
- Keeps optional modules from blocking boot.

## Test
1. Game boots.
2. Build says Phase 261.
3. Press O opens kiosk.
4. F7 reports interactive object count.
5. Store/Reiki/PGA/Scorpion routes still work.
6. Runtime shield does not black-screen the lobby.

## Next Phase
PHASE-262-POKER-RIGHT-DEAL-TABLE-READABILITY-LOCK
