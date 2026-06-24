# Phase 168 — Playable Poker Demo Simulation Lock

## Scope
Game-side only. No lobby redesign. No website/site file changes.

## Dirty audit result
The table foundation is now suitable for a playable demo layer:
- Phase 164/166 remove the fake table and keep invisible anchors.
- Phase 167 adds felt/pass-line/logo as a top-surface overlay.
- Phase 168 replaces the table top overlay with a tighter fitted surface and adds playable demo visuals.

## Added in Phase 168
- Refined green felt fitted to the FBX table surface.
- Leather hand-rest edge/lip aligned to the FBX table edge.
- Pass line and SVR logo preserved on the felt.
- 5 bot pill avatars placed around the table.
- 1 open player seat at the south/front side.
- Floating bot hands in front of each bot pill.
- Visible player cards, bot cards, community cards, chip stacks, pot stack, and dealer button.
- Bot logic loop: bots can fold, check, call, and raise.
- Player action rail: Fold, Check, Call, Raise, All In, Next.

## Controls
Desktop keys:
- F = fold
- C = check
- V = call
- R = raise
- A = all in
- N or H = next hand

Runtime function:
```js
SVR_DEMO_POKER_ACTION('call')
```

Audit function:
```js
SVR_RUN_PHASE168_DEMO_AUDIT()
```

## Locked table rules
- Real FBX table remains the table body.
- No procedural/fake table body is restored.
- No chairs/stools restored.
- Leather hand rest is a surface/edge enhancement, not a replacement table body.
- Chips/cards/pot sit on the table surface.

## Test URL
`/game/?v=phase168-playable-demo`

## QA checklist
- Confirm green felt fits inside table edge.
- Confirm leather hand rest is visible on table edge.
- Confirm SVR logo is centered on the felt.
- Confirm pass line is visible.
- Confirm 5 bots appear as pills with floating hands.
- Confirm player has one open seat.
- Confirm cards and chips sit on the table.
- Confirm bots take actions over time.
- Confirm keyboard/action rail can advance the hand.
