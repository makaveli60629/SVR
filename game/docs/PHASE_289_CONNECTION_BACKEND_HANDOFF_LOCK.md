# Phase 289 Connection Backend Handoff Lock

Build: `PHASE-289-CONNECTION-BACKEND-HANDOFF-LOCK`

## Summary

Phase 289 locks the handoff requirements for the live cross-device connection layer.

## Goal

Allow an Android browser player and a Quest browser player to see each other move in the same lobby using the pill marker layer created in Phase 287.

## Required backend

- secure WebSocket endpoint
- room id / lobby id
- player join and leave messages
- local pose broadcast
- remote pose receive
- reconnect handling
- heartbeat / timeout cleanup
- server-side room cap
- no payment or private account data in the movement feed

## Client message shape

```json
{
  "type": "pose",
  "roomId": "svr-main-lobby",
  "playerId": "client-generated-id",
  "client": "quest-or-android-or-desktop",
  "pose": { "x": 0, "y": 1.6, "z": 0, "yaw": 0 },
  "ts": 0
}
```

## Server message shape

```json
{
  "type": "state",
  "roomId": "svr-main-lobby",
  "players": []
}
```

## Protected work

- Phase 286 Quest input priority remains preserved.
- Phase 287 pill markers remain preserved.
- Phase 288 local status stub remains preserved.
- Site untouched.

## Next implementation phase

`PHASE-290-WEBSOCKET-PRESENCE-CLIENT-LOCK`

That phase should add the client connector but keep it disabled until a server URL is available.
