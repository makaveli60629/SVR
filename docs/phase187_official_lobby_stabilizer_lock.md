# Phase 187 Official Lobby Stabilizer Lock

## Purpose

Keep the official lobby presentation stable and stop older phase labels from reappearing.

## Fixed files

- game/phase141_label_fix.js
- game/phase152_post_boot_verify.js
- game/phase187_official_lobby_stabilizer.js
- game/index.html
- game/phase176_boot.js
- game/version.json

## Summary

- Phase 141 is now a compatibility shim.
- Phase 152 now reports Phase 187.
- Phase 187 stabilizer loads before main.js.
- The stabilizer keeps the official Phase 185 look active.
- Older exploratory visual roots are hidden.
- Build label is locked to Phase 187.

## Preserved systems

- Phase 185 official Roman lobby look.
- Phase 177 filter.
- Phase 178 bounds.
- Phase 180/181 table selector.
- Quest locomotion.
- Controller fallback.
- Android controls.
- Watch.
- Store hubs.
- Moon and Mars.

## Test URL

/game/?v=phase187-official-lobby-stabilizer

## Runtime checks

window.SVR_PHASE187_STABILIZER
window.SVR_PHASE187_VERIFY
window.SVR_PHASE185_OFFICIAL_LOOK
window.SVR_PHASE186_DEPLOY_SYNC

## Commits

- 79047023b20a0ae92d5c92b6a27bf51f4c6344fd
- d6e220e4d23bcba8fa26e08dde743fc9f164fa92
- 56efe7b5dfe9013716c025908c5fd095c68be6a6
- 2ce7c718e941c610d5f7f984961f4ca78a9164e5
- 4fcf16fb47f22752708ed1df60f19bbb459e889d
- 9b472f677a64968e19cb5a861d65061f85e8d166
