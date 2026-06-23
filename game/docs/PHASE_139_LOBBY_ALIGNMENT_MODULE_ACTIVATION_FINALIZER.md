# Phase 139 — Lobby Alignment + Module Activation Finalizer

## Scope

Game-side only. `/site` and public website files were not changed.

This phase is an authority cleanup layer loaded after Phase 138. It is designed to keep the live Oculus lobby clean even when older modules attempt to redraw their QA or deal-order panels.

## Fix targets

- Remove or suppress visible `LIVE LEFT → RIGHT DEAL SEQUENCE` panels.
- Remove or suppress visible `LEFT-RIGHT DEAL LOCK` / deal-monitor panels.
- Remove or suppress Update 3.1 QA/export/final-prep/version panels.
- Prevent older phase badges from reclaiming the visible build label.
- Keep Phase 139 as the final runtime authority.
- Hide duplicate Phase 136/137/138 stair, ramp, fence, and walkway objects.
- Add one clean red stair route with connected landing and upper deck.
- Keep room/storefront routing active.
- Keep lobby as a portal hub, not a full private-room merge.

## Runtime files changed

```text
game/index.html
game/phase139_lobby_alignment_module_activation_finalizer.js
deploy-health.json
game/docs/PHASE_139_LOBBY_ALIGNMENT_MODULE_ACTIVATION_FINALIZER.md
```

## Runtime routes activated

```js
window.SVR_PHASE139_ROOM_ROUTES = {
  lobby,
  table,
  reiki,
  pgaDrive,
  pgaChipPutt,
  store,
  lounge,
  scorpion
};
```

Also exposed:

```js
window.SVR_ROOM_ROUTES
window.SVR_GO_ROOM(key)
window.SVR_STORE_PORTAL_URL = "https://svrpoker.com/site/store.html"
```

## QA command

Run in browser console:

```js
window.SVR_RUN_PHASE139_LOBBY_AUDIT()
```

Expected:

- `phaseBadge` is `PHASE 139 • CLEAN LOBBY LOCK`
- `oldDealPanelsVisible` is `0`
- `phase139StairSteps` is `18`
- `allModulesActive` is `true`
- `siteTouched` is `false`

## Preserve rules

- Current lobby baseline preserved.
- Website untouched.
- Poker table remains primary.
- Private scene routes remain separate.
- No unapproved sponsor/founder branding added.
- No heavy assets added.
