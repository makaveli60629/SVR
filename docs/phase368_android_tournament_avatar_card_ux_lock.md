# Phase 368 — Android Tournament, Avatar Texture, Card and UX Lock

## Build

`PHASE-368-ANDROID-TOURNAMENT-AVATAR-CARD-UX-LOCK`

## Owner defects addressed

- Android must expose exactly one `JOIN TABLE / LEAVE TABLE` control.
- `SIT`, `SEAT`, `PLAY GAME` and duplicate join controls are suppressed.
- MOVE and LOOK remain available in lobby mode and disappear after joining.
- Seated mode preserves gyro/touch look without allowing player movement.
- Community and hole cards use clearer mobile sizing and realistic card-face layout.
- Rank `T` is displayed as `10`.
- The profile showroom preserves imported FBX/GLB texture maps instead of tinting every material.
- The profile view suppresses generated square jacket/shirt geometry and shows the bare imported avatar by default.
- Spectator mode shows bot names, stacks and local bot cards above the lightweight opponents; the cards disappear after joining.
- Local practice tournament presentation shows a crown when one funded player remains and starts a fresh 15,000-chip table after the champion interval.
- A busted human is prompted to leave rather than being allowed to submit more actions.
- Voice action announcements use browser speech synthesis for check, call, raise, bet, fold and all-in.

## Protected authorities

- Phase 336: poker rules, deck, streets, evaluation, pots and settlement.
- Phase 347: one Android controller.
- Phase 350: controller DOM deduplication.
- Phase 351/366: profile showroom and live-camera recovery.
- Phase 353: VR dressing room.
- Phase 364: table dimensions, floor and seat geometry.
- Phase 365: Android table alignment, branding, avatars, gyro and seated HUD.
- Phase 367: physical viewport, safe-area and touch calibration.
- APK remains `0.1.0-rc1`, code `1`, manual-update-only.

## Product truth

This release remains local play-money Hold’em against five bots. The spectator labels expose local bot cards only before the human joins. It does not provide server-authoritative multiplayer, real-money gambling, persistent cloud bankrolls or production voice chat.

The owner-supplied shuffle/chip recordings were not found in the current GitHub tree. Phase 368 keeps the existing synthesized poker audio and adds speech action announcements without introducing requests to missing media files.

## Test route

`https://svrpoker.com/game/android.html?channel=stable&v=phase368`

## Runtime QA

```js
window.SVR_PHASE368_JOIN_CARD_QA()
window.SVR_PHASE368_SPECTATOR_TOURNAMENT_QA()
window.SVR_PHASE368_SYNC()
window.SVR_PHASE368_SET_VOICE_ACTIONS(true)
window.SVR_PHASE368_RESTART_TOURNAMENT()
window.SVR_PHASE368_PROFILE_TEXTURE_QA()
```
