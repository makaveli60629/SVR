# Phase 394 — Android Table Presentation Polish

Build: `PHASE-394-ANDROID-TABLE-PRESENTATION-POLISH-LOCK`

## Scope

Phase 394 is intentionally limited to the Android presentation layer. The approved Phase 393 poker engine, turn timing, betting logic, bot behavior, XP, sounds, haptics, and Quest runtime remain protected.

## Center-table hierarchy

- The SVR logo remains centered and unobstructed.
- The pot display moves below the logo instead of sitting on top of it.
- The pot amount remains clearly readable.
- Community cards are enlarged while staying inside the existing board area.

## Burn-card presentation

- Adds a dedicated `BURN` tray beside the deck.
- Every burn operation is observed from the existing Phase 393 game state.
- A visual card travels from the deck to the burn tray.
- The card flips to the protected SVR card back in the tray.
- The tray displays the current burn count.
- The actual poker engine and burn-card state are not rewritten.

## Sponsor presentation

- Adds one professional featured sponsor plaque above the center logo.
- Default label: `REIKI`.
- The plaque is intentionally separate from the center logo and pot.
- Existing lower sponsor zones remain available.
- Featured sponsor can be changed without rewriting the table through:

```js
window.SVR_ANDROID_FEATURED_SPONSOR = {
  name: 'Sponsor Name',
  eyebrow: 'FEATURED SPONSOR',
  logo: '/path/to/logo.png',
  href: 'https://example.com'
};
```

## Protected Android gameplay

- 6 players / 5 bots
- perimeter opponent seating
- 15-second turn clock
- custom raise slider and presets
- fold/check/call/raise/all-in controls
- continuous hands while funded
- XP and ranks
- sound and supported haptics
- existing hand evaluator

## Protected Quest runtime

Phase 393 Quest calibration remains unchanged, including table scale, floor alignment, recessed felt, seated view, Eric floor anchor, and dealing presentation.

## APK policy

- Version: `0.1.0-rc2`
- Version code: `2`
- Forced update: `false`
- Update prompt: `false`
- Native rebuild: `false`

Phase 394 is a browser-table presentation update only.
