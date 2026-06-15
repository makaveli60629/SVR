# Phase 240 — Grand Palace Reference Lobby Lock

## Scope

Game-side only. Site files were not edited.

This phase adds a removable geometry overlay on top of the current locked lobby to move the VR lobby closer to the supplied reference image: a luxury palace/casino lobby with visible Moon/Mars, a central Play Game selector, storefront portals, sponsor boards, jumbotrons, daily bonus kiosk, and a two-tier balcony structure.

## Added files

- `game/phase240_grand_palace_reference_lobby_lock.js`

## Updated files

- `game/index.html`
- `game/docs/BUILD_VERSION.json`

## Geometry added

- Curved rear palace wall / colonnade
- Repeated rear arch glow bays
- Two-tier balcony rail spans
- Central floating `PLAY GAME` table selector
- Three table cards: Hold'em low stakes, Hold'em mid stakes, Omaha
- Wellness Hub storefront face
- PGA Hub storefront face
- Scorpion Room portal face
- Legends pedestal/stage panel
- Daily Bonus kiosk
- Sponsor board
- Left/right Tier 1 jumbotron slots
- Left/right Tier 2 banner slider slots
- Portal pads for Play, Wellness, PGA, Store, and Scorpion
- Higher visible Moon and Mars reference sky layer
- Entry runner / center floor ring / crest ring

## Preserved locks

- Existing lobby baseline preserved
- Website/site untouched
- Current movement runtime preserved
- Quest controller fallback preserved
- Watch runtime preserved
- Store web portal behavior preserved
- Private scene routing preserved
- Poker table and seat routing preserved

## Runtime marker

The browser exposes:

```js
window.SVR_PHASE240_REFERENCE_LOBBY_LOCK
```

Expected build label:

```text
PHASE-240-GRAND-PALACE-REFERENCE-LOBBY-LOCK
```

## Test URL

```text
https://svrpoker.com/game/?v=phase240-grand-palace-reference
```

Use a hard refresh after GitHub Pages finishes deployment.
