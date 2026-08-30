# Phase 423 — Dealer Lab V2 + Mobile Polish Lock

## Scope

This phase modifies the private Dealer Lab and the shared Android/iPhone game surface only. It does **not** alter the public SVR landing page.

## Dealer Lab V2

Build: `DEALER-LAB-V2-UI-TABLE-ERIC-VISIBILITY`

### Eric visibility root cause fixed

The V1 Dealer Lab requested asset names that are not present in the deployed tree. V2 uses the real committed assets:

- `game/assets/models/eric/eric.fbx`
- `game/assets/models/eric/rp_eric_rigged_001_dif.jpg`
- `game/assets/models/eric/rp_eric_rigged_001_norm.jpg`
- `game/assets/models/eric/rp_eric_rigged_001_gloss.jpg`
- `game/assets/models/anims/eric_idle.fbx`

Texture loading is now tolerant: an optional map failure cannot block the FBX itself from appearing.

### Lab interface

- compact top quick bar;
- collapsible bottom tuning drawer;
- Hide / Show controls;
- Preview mode;
- Focus Eric camera;
- Reset Eric to a known visible pose;
- temporary bright debug material;
- pasted preset JSON application;
- runtime diagnostics.

### Table preset authority

The current user-approved *test* starting values are:

- `tableY: 1.10 m`
- `feltDrop: 0.036 m`
- `innerMargin: 0.060 m`
- `collisionDrop: 0.030 m`
- `cardLift: 0.002 m`

They remain lab-only until visual approval.

### Table presentation

V2 adds a professional synthetic-felt surface, padded rail treatment, trim material and clearer separation between the visible felt, collision surface and card landing plane. The original `table.glb` remains the source table model.

## Shared Android + iPhone spacing

Android and iPhone both use the shared mobile table runtime. Phase 423 adds a final spacing layer that:

- caps the top three opponent boxes to leave real horizontal gutters;
- moves side opponents slightly lower to prevent collisions with the top row;
- preserves the centered seat transform;
- reduces active-seat pulse growth so highlighting cannot cause boxes to collide;
- applies portrait and short-landscape adjustments.

This is visual/layout-only; poker authority and turn order are untouched.

## Voice / VOX truth

The microphone and VOX implementation is real client code:

- browser microphone capture uses `getUserMedia`;
- echo cancellation, noise suppression and auto-gain are requested;
- VOX uses a Web Audio analyser and sensitivity threshold;
- VOX controls the existing push-to-talk WebRTC microphone track.

However, live player-to-player voice requires an actual matchmaking/signaling WebSocket endpoint and a connected WebRTC peer. Without that service, the mic/VOX UI may initialize locally but there is no remote player to receive audio. Do not label peer voice as live until a signaling endpoint is configured and a two-device test passes.

## Player account / database truth

The current public account contract targets AWS Cognito + DynamoDB, but the account API base URL is not provisioned/configured in repository state. Therefore:

- remote cloud login/register is not yet authoritative;
- local test player mode remains valid for development;
- the yellow `DATABASE ENDPOINT PENDING` status is intentional and truthful;
- it must not be changed to green until API Gateway/Lambda health and the complete account flow pass externally.

The repository cannot by itself prove or create the missing cloud endpoint without authorized AWS access.

## Next goals

1. Visually approve Eric + table in Dealer Lab V2 and freeze Dealer Module 1.0 preset.
2. Finish real-device Android/iPhone spacing QA from screenshots.
3. Provision and verify the AWS player account endpoint, then enable remote login/register.
4. Provision a secure matchmaking/signaling service and run a two-device WebRTC/VOX test.
5. Only after those external services pass, promote database/account/voice status to live.
