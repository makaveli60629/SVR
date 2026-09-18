# Quest gameplay readiness pass

This branch adds `game/modules/quest_onboarding.js`, a player-facing onboarding and recovery layer for the Quest route.

## Integration

Load it once after the game DOM exists and before the runtime starts:

```html
<script type="module" src="./modules/quest_onboarding.js?v=onboarding1"></script>
```

It does not create a second renderer, table, dealer, or lighting system. It provides:

- Four-step first-session guidance
- Skip/Done controls with local persistence
- Player-friendly loading and gameplay notifications
- Recovery messaging for failed startup and unhandled errors
- A debug override using `?onboarding=1`

## Quest acceptance checklist

1. Open `/game/quest.html` in Meta Quest Browser.
2. Confirm the guide appears once and can be skipped.
3. Enter VR and verify the table is visible from the spawn point.
4. Test controller teleport and hand pinch fallback.
5. Move to the table and use QUICK SIT.
6. Verify cards, pot, active turn, and action controls.
7. Play a complete hand and start the next hand.
8. Refresh once with cache enabled and once in a private tab.

The code cannot be visually accepted in a cloud browser; physical Quest testing remains required.
