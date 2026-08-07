# Phase 399 — Android Learning, Chips, Sponsor, and Multiplayer-Ready Manifest

Build: `PHASE-399-ANDROID-LEARNING-CHIPS-SPONSOR-MULTIPLAYER-READY-LOCK`

## Scope

Android browser gameplay only. Quest remains on the protected Phase 396 seated build. Phase 398 betting math remains authoritative. RC2 APK remains version name `0.1.0-rc2`, version code `2`, manual-update only, with no forced reinstall.

## Showdown learning

- Evaluator now returns the exact best five cards in addition to hand category and score.
- Showdown breakdown displays each winner's hand and the local player's hand when different.
- Tied/split pots display every tied winner.
- Cards used in the exact best-five hand are highlighted.
- Board-only ties are supported correctly.
- Texas Hold'em hand guide lists Royal Flush through High Card.
- Smart Hand Coach shows the local player's current made hand and highlights the cards currently forming the best five.
- Coach is deterministic/rule-based in this browser phase; it does not alter decisions or outcomes.

## Player chip rack

- Decorative chip stockpile is attached to the local player's stack area.
- Denominations: $50, $100, $500, $1,000, $5,000.
- Larger denominations reduce visual crowding.
- Chips are display-only and do not replace the numerical stack/betting engine.

## Promotional tournament ticket pot

- Bot-mode hands have an 8% local test chance to become a Tournament Ticket Pot.
- The ticket is a non-cash promotional tournament-entry token.
- A notification requires an explicit OK acknowledgement.
- A special ticket chip animates toward the pot after acknowledgement.
- The winner earns one ticket.
- If the pot is tied, each tied winner earns one ticket so the game does not make an arbitrary hidden selection.
- Local player ticket count is persisted in localStorage.
- A demo redemption flow can reserve a local tournament entry. This is not a live tournament registration backend.
- In future authoritative multiplayer, the server should designate ticket hands so all clients share the same promotion state.

## Reiki sponsorship branding

- Reiki branding is integrated into the felt/background rather than added as a blocking display.
- Existing featured sponsor plaque remains and is restyled as a felt/table partner element.
- Sponsor room configuration is exposed so multiplayer rooms can choose a room skin deterministically from the room id.
- Current test room defaults to Reiki branding.

## Multiplayer matchmaking readiness

Existing repo audit confirmed there is no production matchmaking/signaling endpoint configured. Prior Phase 289/290 work defined a disabled secure WebSocket presence client and Phase 312 contains a manual WebRTC offer/answer prototype.

Phase 399 adds an Android matchmaking/voice-ready client:

- Reads `window.SVR_ANDROID_MATCHMAKING_WS_URL` or `?matchWs=wss://...`.
- Requires a secure `wss://` endpoint.
- Searches for a player for 8 seconds.
- Falls back to the normal bot table when no server/player is available.
- Does not label multiplayer live until the signaling server explicitly reports authoritative game synchronization ready.
- Exposes peer game-message transport for future authoritative poker-state sync.

### Required server behavior for live multiplayer

A backend must provide at minimum:

- secure WebSocket endpoint;
- authenticated or collision-safe player ids;
- find/cancel match messages;
- room assignment;
- authoritative hand/deck state or shared server-generated hand state;
- seat/action synchronization;
- reconnect and timeout handling;
- WebRTC SDP/ICE signaling for voice;
- promotion/tournament-ticket synchronization;
- anti-cheat/card privacy controls.

Until this exists, production Android intentionally reports bot fallback instead of claiming multiplayer.

## Voice readiness

- WebRTC peer transport client is present.
- Microphone request uses echo cancellation, noise suppression, and automatic gain control.
- Push-to-talk control is added.
- Remote audio has a proximity-volume control hook.
- STUN is configured for peer discovery.
- A TURN service is recommended for production reliability across restrictive NAT/firewall environments.
- Live voice remains false until a real peer connection is established through the signaling backend.

## Protected systems

- Phase 398 exact-call and dynamic minimum-raise behavior remains unchanged.
- Phase 396 burn tray, community-card sizing, moving dealer button, center logo, pot placement, sponsor zones, and table layout remain unchanged.
- Quest runtime source is not modified.
- Native APK is not rebuilt.

## Physical Android acceptance checklist

1. Join table and confirm prior Phase 398 betting still behaves correctly.
2. Confirm chip rack appears beside the local stack and updates as stack changes.
3. Toggle Hand Coach and verify current best-five cards highlight.
4. Open HANDS and verify all Hold'em hand rankings are readable.
5. Reach showdown and confirm winner hand, local hand, ties, and exact winning-card highlights.
6. Play until a Tournament Ticket Pot appears; press OK and confirm ticket animation reaches the pot.
7. Win a ticket pot and verify TKT count increases; open ticket bank and reserve a demo entry.
8. Confirm Reiki branding is integrated into the felt without blocking SVR logo, pot, cards, dealer button, or player seats.
9. Confirm match status reports bot fallback when no `wss://` server is configured.
10. Press MIC and confirm browser microphone permission/noise-suppression readiness; no live voice should be claimed without a peer.
