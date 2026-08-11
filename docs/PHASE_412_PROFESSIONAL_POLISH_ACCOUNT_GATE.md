# Phase 412 — Professional Polish + Tournament Account Gate

## Scope
Phase 412 begins the professional mobile polish pass without changing the protected Phase 403 poker engine, Phase 398 betting rules, Quest Phase 396 gameplay, the RC2 APK policy, or the public page structure.

## Tournament access
- Practice remains available to Guest 1.
- Tournament entry requires a player identity.
- The tournament portal defaults to LOGIN / CREATE ACCOUNT TO ENTER.
- The tournament gameplay route is guarded too, so a direct URL cannot bypass the requirement.
- Before the approved AWS player API is live, a named local test profile is accepted for fake-money tournament testing.
- Once the approved API is configured and healthy, only a production API/Cognito account passes the tournament gate.
- No purchase is required for tournament identity creation.

## Professional polish foundation
- Consistent touch feedback on action buttons.
- Minimum mobile touch target sizing.
- Focus-visible keyboard/accessibility treatment.
- Reduced-motion support.
- YOUR DECISION / OPPONENT THINKING / HAND COMPLETE status cue.
- Online/offline/local-test connectivity pill.
- Winner banner settle animation and light haptic feedback where supported.
- Phase 412 cache epoch and service-worker refresh.

## Protected systems
- Phase 403 poker engine and side pots unchanged.
- Phase 402 physical seat order unchanged.
- Phase 398 raise/call rules unchanged.
- Phase 404 ALL IN safety unchanged.
- Phase 411 100-player local tournament rotation and bot independence remain underneath the new gate.
- Quest remains Phase 396.
- APK remains 0.1.0-rc2, version code 2, manual-only, with no forced update and no native rebuild.
- Root public `index.html` is not modified.

## Next professional polish targets
1. Hand-history/replay panel with concise action timeline.
2. Tournament lobby roster and table assignment presentation.
3. Disconnect/reconnect resume behavior for real multiplayer backend.
4. Player profile badges, avatar portraits, mute/report controls and accessibility labels.
5. Sound mix pass: deal, chips, action confirmation, showdown and tournament advancement.
6. Micro-animation budget and low-end mobile performance profile.
7. Cross-device visual regression matrix for Android Chrome/Samsung Internet and iPhone Safari.
8. Secure shared tournament registration after AWS/Cognito and authoritative multiplayer backend are configured.
