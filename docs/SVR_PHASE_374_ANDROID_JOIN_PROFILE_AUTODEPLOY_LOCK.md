# SVR Poker — Phase 374 Android Join, Profile and Auto-Deploy Lock

## Owner-reported production symptoms

- Android game could freeze or appear unchanged after earlier fixes.
- The real poker table was not consistently visible.
- The required JOIN control was not visible in the installed-app route.
- The player could receive/deal cards before deliberately joining.
- Legacy Seat/Sit controls could reappear.
- The mobile profile showroom controls and status panels covered the avatar.
- The mobile profile navigation used an awkward horizontal scroll strip.
- The detailed Eric avatar asset was removed from the production artifact by the deployment cleanup rule.

## Phase 374 corrections

### Android gameplay

- Adds `game/modules/phase374_android_join_table_app_recovery_lock.js`.
- Enforces one visible `JOIN NOW` authority before play.
- Hides legacy Seat/Sit/Play Game controls before joining.
- Leaves one `LEAVE TABLE` authority after joining.
- Guards hand-start and next-hand APIs while the player is in the lobby.
- Unlocks dealing only after the authoritative join state becomes true.
- Keeps the real table visible and upgrades away from the emergency fallback when the canonical table arrives.
- Creates a lightweight emergency table only if the canonical table never becomes available.
- Applies the existing Android renderer budget and frame-gap recovery to reduce freeze risk.

### Profile/mobile presentation

- Adds `site/css/phase374-profile-mobile-recovery.css`.
- Places the mobile canvas first and moves status/actions below it instead of over the avatar.
- Replaces the horizontal navigation strip with a wrapped two-column mobile menu.
- Keeps the avatar canvas at a readable phone height.
- Adds `site/js/phase374-profile-mobile-recovery.js` to check the Eric asset, retry the full 3D camera once, and stabilize the lightweight fallback message.

### Deployment and app policy

- Production deployment must preserve `game/assets/models/eric/eric.fbx` in addition to the approved table FBX.
- The workflow injects the Phase 374 Android and profile recovery modules into the production HTML files.
- `update/app-version.json` advertises the new stable web runtime.
- APK policy remains locked at `0.1.0-rc1`, version code `1`, manual-update-only, no forced update, and no automatic update prompt.
- This phase updates the web runtime loaded by the installed app; it does not claim a newly signed native APK binary.

## Required live routes

- Android stable: `/game/android.html?channel=stable&v=phase374`
- Profile: `/site/profile.html?v=phase374`
- Quest/Oculus protected route: `/game/index.html?platform=quest&v=phase373`

## Acceptance

1. Android lobby displays the table and exactly one `JOIN NOW` button.
2. No hand begins and no next-hand API advances before joining.
3. Joining seats the player, enables poker controls, and starts the first hand.
4. Seat/Sit controls do not appear as separate actions.
5. The mobile profile avatar is unobstructed by the controls.
6. Profile navigation wraps normally and does not require horizontal scrolling.
7. `deploy-health.json` reports the Phase 374 source commit and Android route.
8. The installed APK can receive the Phase 374 web runtime without a forced reinstall.
