# Phase 405 — Platform / Mobile / Social Test

Build: `PHASE-405-PLATFORM-MOBILE-SOCIAL-LOCK`

## Scope

Phase 405 is a web-runtime update focused on Android, iPhone/iPad and public/Quest browser alignment. It does not replace the protected poker engine.

## Protected authorities

- Poker engine: Phase 403
- Side pots / chip conservation: Phase 403
- Visual seat order: Phase 402 (`YOU → Nova → Claudia → Eric → Maya → Darius → YOU`)
- Raise/call legality: Phase 398
- ALL IN double-tap and paced runout: Phase 404
- iPhone Safari safe-area/audio adapter: Phase 400
- Quest gameplay: Phase 396
- APK: `0.1.0-rc2`, version code `2`, manual-only, no forced update or rebuild

## Public page protection

`index.html` is intentionally not structurally rewritten in this phase. Phase 405 is applied by `site-public-hooks.js` and `platform-device.js`.

The public mobile game button receives a small `GAMING TEST READY` secondary label for Android or iPhone/iPad. Quest keeps `Enter VR` with no mobile test label. The green phase badge remains visible for testing.

## Device / browser alignment

`platform-device.js` detects and publishes:

- Meta Quest / Oculus Browser
- Android
- iPhone/iPad including iPad desktop-UA mode
- browser family
- touch capability
- portrait/landscape
- Visual Viewport dimensions and scale
- standalone/PWA mode
- WebXR immersive-VR support where the browser exposes it

Quest continues to use the Phase 396 route. `launch-quest.css` accepts both the legacy `quest-browser` class and the Phase 405 `svr-platform-quest` class.

## Shared Android / iPhone table

Android and iPhone/iPad now point at `game/android-stable-phase405.html`.

On iPhone/iPad, the protected Phase 400 Safari adapter still supplies safe-area, touch, audio and microphone compatibility. The Phase 403 poker engine remains the poker authority on both phone platforms.

## One burn pile

The Phase 405 stable shell contains one `.burn-zone`. The nearby deck is explicitly labeled `DECK`. The Phase 405 mobile UI also removes any duplicate `.burn-zone` if a predecessor presentation layer accidentally creates one.

## Poker hands during play

The mobile table adds a `POKER HANDS` button with all 10 Texas Hold'em hand rankings. The sheet may open during play; the player's action clock continues.

Quest hand-guide popup is deferred to a later Quest-focused phase.

## Profiles / portraits

Tapping the local profile avatar or another table face opens a small profile sheet with a HIDE button.

`site/js/phase405-profile-portrait.js` adds a 256×256 local portrait picker to the existing profile page. The image is stored on the device as a compressed JPEG data URL. Cloud/account portrait upload is not live yet.

## Guest seats

Without a signed demo profile, the local player is labeled `Guest 1`.

`Guest 2` is represented as an open peer-ready position while no live match exists. A bot remains authoritative in the seat until a real synchronized peer is received from the multiplayer client. Phase 405 does not fake a remote player.

## Voice / VOX

The existing Phase 399 WebRTC client remains the peer voice authority. Phase 405 adds:

- VOICE panel
- Push to Talk mode
- VOX mode
- Mute
- VOX sensitivity
- local microphone activity meter

VOX can drive the existing push-to-talk control. Actual peer audio still requires a real WebRTC peer connection.

## Multiplayer status

The current client is matchmaking/WebRTC-ready, but production remains:

- production match server configured: false
- authoritative shared game server: false
- live multiplayer: false
- live peer voice: false

A secure `wss://` signaling and authoritative game-state service is still required before Guest 2 can reliably replace a bot across separate devices.

## Five-hour tournament prototype

`phase405_tournament_scheduler.js` uses an exact 18,000,000 ms slot interval (5 hours).

The browser records completed local player results. If a slot is missed with no player result, a local bot-test result is generated when the tournament/results page is next opened so the daily board has a prototype history.

Important: the static web page cannot execute while all browsers are closed. This is a catch-up simulation, not a server-side scheduled tournament. A backend scheduler is required for truly unattended live tournaments.

All tournament chips/prizes remain fake play money.

## Tournament presentation

Phase 405 adds lightweight transition graphics:

- POT WON
- ADVANCING — Moving to the next tournament table
- YOU WON THE TOURNAMENT
- TOURNAMENT COMPLETE

## Rollback

The Phase 404 stable shell remains in the repository. To roll back the mobile route, point Android wrappers to `android-stable-phase404.html` and restore the Phase 404 release/cache metadata. The Phase 403 engine itself is unchanged by Phase 405.

## Physical testing

CI/source validation does not equal device testing. Phase 405 still needs physical Android, iPhone/iPad and Meta Quest browser checks after deployment.