# PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK

## Scope

Android gameplay refinement requested from the installed APK-hosted web game.

## Delivered

- Close table-edge seating based on actual camera world position.
- SIT and RECENTER correction without adding another controller.
- Active-player turn indicator.
- Current player bet, amount to call, and last-action indicator.
- Six-player current-bet/action strip.
- Showdown winner and settled-pot display.
- Winning hand name, winner cards, and community-board display.
- Immediate ANTE UP / NEXT HAND prompt.
- Static validation workflow.

## Authority chain

1. Phase 336 — poker rules and settlement.
2. Phase 347 — Android controller and seated state.
3. Phase 356 — Android freeze recovery and low-power protection.
4. Phase 357 — final seating, turn, showdown, and next-hand presentation.

## Product truth

This phase improves the local play-money game against five bots. It does not make poker server-authoritative and does not publish a new native APK.

## APK policy

- Version name: `0.1.0-rc1`
- Version code: `1`
- Release ready: `false`
- Forced update: `false`
- Automatic prompt: `false`
- Manual update only: `true`

## Test route

`https://svrpoker.com/game/android.html?channel=stable&v=phase357`
