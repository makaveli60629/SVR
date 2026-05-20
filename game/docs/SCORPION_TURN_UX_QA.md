# Scorpion Turn UX QA

## Table checks

- Player turn panel appears.
- `YOUR TURN — 20` is readable.
- Pot amount is readable.
- Player stack is readable.
- Call amount is readable.
- Minimum raise is readable.
- Legal action pills match current state.

## Legal action states

- No bet: Check / Bet / Fold.
- Facing bet: Call / Raise / Fold.
- All-in: Waiting only.
- Hand ended: Next Hand.

## Timeout checks

- At five seconds, warning state is visible.
- Timeout with no bet gives auto-check feedback.
- Timeout facing bet gives auto-fold feedback.

## VR/Quest checks

- Prompt does not cover player cards.
- Watch remains visible.
- Right stick movement remains.
- Snap turn remains.
- Hold-to-aim/release-to-teleport remains.
