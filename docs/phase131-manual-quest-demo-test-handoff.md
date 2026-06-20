# Phase 131 Manual Quest Demo Test Handoff

## Scope

Game-side only. No site files changed. No poker engine rewrite. No watch or movement rewrite.

## Test URL

https://svrpoker.com/game/?v=phase131-manual-quest-test

## Browser QA

```js
window.SVR_RUN_PHASE131_MANUAL_QUEST_TEST_QA()
window.SVR_RUN_PHASE130_PRODUCTION_DEMO_QA()
```

## Manual test checklist

1. Load the test URL.
2. Start the lobby if the start panel remains visible.
3. Confirm one poker table only.
4. Confirm poker action hitboxes are visible.
5. Test Fold, Check, Call, Raise, All-In, and Next.
6. Confirm dealer prompt, pot display, active halo, and bot thinking visuals respond.
7. Confirm presence pills remain visible.
8. Confirm route preview panels remain visible.
9. Confirm portal routes do not interfere with poker selection.
10. Confirm watch and teleport visuals remain present.
11. Confirm Moon and Mars remain visible.
12. Confirm second floor remains visible.
13. Confirm Quest performance is acceptable.

## Locked stack

Phase 116 routes, Phase 120 performance, Phase 121 QA, Phase 122 feedback, Phase 123 table display, Phase 124 hotkeys, Phase 125 hitboxes, Phase 126 live QA, Phase 127 round flow, Phase 128 presence preview, Phase 129 route previews, Phase 130 final readiness, and Phase 131 manual handoff.

## Next step

After manual Quest pass, create a fresh game package zip and release note. If manual Quest fails, fix failed checks before adding new features.
