# Quest gameplay readiness pass

This branch adds a mode-aware player-facing onboarding and recovery layer for the Quest route and polishes the two-stage loading experience.

## Integration

game/index.html loads game/modules/quest_onboarding.js?v=onboarding2.

The onboarding layer does not create a second renderer, scene, table, dealer, movement system, lighting system, or poker authority.

## Production Quest behavior

The current production handoff from game/quest.html opens game/index.html with platform=quest, tableonly=1, autoseat=1, seated=1, and teleport=off.

Therefore the production onboarding must not tell a player to teleport to the table or use QUICK SIT. It instead guides the player through headset tracking, VR entry, the wrist console, and the first poker hand.

Non-table/lobby variants may show movement and join-table guidance only when those controls are active.

## Player-facing behavior

- First-session guidance with Skip/Done controls
- Versioned local persistence
- ?onboarding=1 forces the guide for QA
- ?onboarding=off disables it
- Boot progress produces a clear ready message
- Startup/runtime failures produce recovery text
- No artificial delay is added to either loader

## Quest acceptance checklist

1. Open /game/quest.html in Meta Quest Browser.
2. Confirm the first loader immediately hands off to the poker runtime without a manual button.
3. Confirm the main loader progresses through renderer, table, cards/rules, Eric, lighting, and watch.
4. Confirm the guide appears once and can be skipped.
5. Confirm the production guide never instructs teleport or QUICK SIT.
6. When loading reaches 100%, press VR GAME ON.
7. Verify the table is visible from the seated spawn with no duplicate table, Eric, overlay, or VR button.
8. Verify hands first and controller fallback.
9. Verify wrist-console orientation and readability.
10. Verify cards, pot, active turn, and legal actions.
11. Play a complete hand and start the next hand.
12. Refresh once with cache enabled and once in a private tab.
13. Run again with ?onboarding=1 and once with ?onboarding=off.

Physical Quest visual/performance acceptance remains required. A desktop or cloud preview can validate routing, markup, and static behavior but cannot complete headset acceptance.
