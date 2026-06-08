# Phase 85A — Multiplayer Presence Avatar MVP

## Build label
PHASE-85A-MULTIPLAYER-PRESENCE-AVATAR-MVP

## Scope
Game-side multiplayer presence only. Do not touch the public website, site.zip, backend admin/chat work, payment code, or Azure SQL files in this phase.

## Owner request
Enable a fast two-account lobby test where the admin account and a user account can enter the game and see each other walking around.

## Primary goal
Add multiplayer presence placeholders so two clients in the same room can see each other in the lobby.

## MVP behavior
- Client joins a shared lobby room.
- Each client receives a temporary player id and display name.
- Remote players appear as simple placeholder avatars.
- Placeholder avatar includes:
  - head sphere
  - torso capsule/box
  - left/right hand markers when available
  - name tag above head
- Position and rotation sync on a low-frequency heartbeat.
- Remote movement is interpolated for smoothness.
- No poker table authority yet.
- No chip/card sync yet.
- No voice chat yet.
- No full custom avatar system yet.

## Network strategy
Use a lightweight WebSocket presence server for the MVP.

Client sends:
- room id
- player id
- display name
- position x/y/z
- yaw or quaternion
- optional hand marker transforms
- timestamp

Server broadcasts:
- joined
- left
- pose update
- room snapshot

## Performance lock
- Broadcast max 10 times per second for MVP.
- Remote avatars interpolate locally each frame.
- Do not allocate new Vector3/Quaternion objects in hot loops.
- Use object pooling for pose math.
- Drop updates if player movement is below threshold.
- Keep Phase 84B Android-only joystick lock.
- Keep Phase 84B Moon/Mars and preloader work.

## Visual rules
- Placeholder avatars are intentionally lightweight.
- Avatar material should match SVR neon/casino style without heavy models.
- Admin avatar can use gold/purple accent.
- User avatar can use cyan/purple accent.
- Name tags must be readable but not huge.

## Game safety
- This phase is only for presence testing.
- Do not make multiplayer decide poker winners.
- Do not sync money, real payments, private data, or admin secrets.
- Do not expose SQL credentials or API secrets in browser code.

## Files to add or update
Suggested files:

```text
game/modules/multiplayer_presence.js
game/modules/remote_avatar.js
game/docs/PHASE_85A_MULTIPLAYER_PRESENCE_AVATAR_MVP_MANIFEST.md
backend/presence-server/server.js or websocket-presence-server.js
backend/presence-server/package.json
```

If backend deployment is not ready, client should support safe offline mode:

```text
window.SVR_MULTIPLAYER_STATUS = {
  enabled: false,
  reason: "presence server not configured"
}
```

## Environment variables for server later
Do not commit secrets. Use server environment settings only.

```text
SVR_PRESENCE_PORT=8082
SVR_ALLOWED_ORIGIN=https://svrpoker.com
SVR_PRESENCE_ROOM=lobby
```

## Test plan
1. Open admin account in one browser/device.
2. Open user account in second browser/device.
3. Both join the same lobby room.
4. Admin sees user placeholder avatar.
5. User sees admin placeholder avatar.
6. Walk around lobby.
7. Verify remote avatar movement is smooth enough.
8. Verify no Android joystick on desktop or Quest.
9. Verify Moon/Mars still visible.
10. Verify poker table and Reiki/Trueitive hologram presentation remain intact.

## Pass condition
Two clients can see each other in the lobby as placeholder avatars with name tags and stable position updates.

## Next phase after MVP
Phase 85B — Multiplayer Seat Presence + Table State Prep

That phase can add:
- seat reservation
- player table occupancy
- spectator labels
- admin/user role marker
- poker state authority preparation

## Locked note
This manifest is the repo memory for the multiplayer presence request. It supersedes vague multiplayer planning and narrows the immediate target to a fast, testable two-client avatar presence MVP.
