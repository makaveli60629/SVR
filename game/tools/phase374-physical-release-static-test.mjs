import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const json = (path) => JSON.parse(read(path));
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(`missing:${label}`); };
const forbid = (source, token, label = token) => { if (source.includes(token)) errors.push(`forbidden:${label}`); };

const launcher = read('index.html');
const android = read('game/android.html');
const quest = read('game/index.html');
const verifier = read('game/modules/phase374_physical_release_truth_lock.js');
const table = read('game/modules/phase374_original_table_authority_lock.js');
const ui = read('game/modules/phase374_android_tournament_card_ui_lock.js');
const install = read('app-install.js');
const update = read('app-update-checker.js');
const sw = read('sw.js');
const pwa = read('pwa-sw.js');
const manifest = json('game/manifest.json');
const rootManifest = json('manifest.webmanifest');
const release = json('game/phase374-release.json');
const appVersion = json('update/app-version.json');
const testPlayer = json('site/config/phase374-test-player.json');
const testPlayerJs = read('site/js/phase374-test-player-avatar.js');
const login = read('site/login.html');
const deploy = read('.github/workflows/deploy.yml');
const provision = read('.github/workflows/phase374-provision-test-player.yml');

need(launcher, 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK', 'launcher-build');
need(launcher, '/game/android.html?channel=stable&amp;v=phase374', 'launcher-android-route');
need(launcher, '/game/index.html?platform=quest&amp;v=phase374', 'launcher-quest-route');
need(launcher, 'CLEAR OLD DEVICE CACHE', 'launcher-cache-reset');
forbid(launcher, 'phase102-current-stack', 'stale-phase102-link');
forbid(launcher, 'PHASE-104-PUBLIC-NO-APP-BUTTON-LOCK', 'stale-phase104-launcher');

need(android, 'data-build="PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK"', 'android-phase374-build');
need(android, 'phase374_original_table_authority_lock.js?v=phase374', 'android-original-table');
need(android, 'phase374_android_tournament_card_ui_lock.js?v=phase374', 'android-tournament-ui');
need(android, "window.SVR_TABLE_STARTING_STACK=15000", 'android-stack');
need(android, "webEntry:'/game/android.html?channel=stable&v=phase374'", 'android-apk-web-entry');
need(android, 'window.SVR_PHASE374_ORIGINAL_TABLE_REASSERT', 'android-table-reassert');
need(android, 'window.SVR_PHASE374_SET_TOURNAMENT_BRAND', 'android-brand-api');

need(quest, 'data-build="PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK"', 'quest-phase374-build');
need(quest, 'phase374_original_table_authority_lock.js?v=phase374', 'quest-original-table');
need(quest, 'phase373_quest_seated_teleport_table_spawn_npc_lock.js?v=phase374', 'quest-seated-teleport-lock');
need(quest, 'phase373_quest_table_seat_finalizer_lock.js?v=phase374', 'quest-finalizer');
need(quest, "window.SVR_PHASE374_ORIGINAL_TABLE_REASSERT?.('quest-after-stable-lobby')", 'quest-table-reassert-after-spawn');

need(verifier, 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK', 'verifier-build');
need(verifier, 'CLEAR OLD CACHE', 'verifier-cache-control');
need(verifier, 'window.SVR_PHASE374_RECOVER', 'verifier-recovery-api');
need(verifier, 'window.SVR_PHASE374_CLEAR_OLD_CACHE', 'verifier-cache-api');
need(verifier, 'window.SVR_PHASE373_POSTFLIGHT_RESTORE_TELEPORT', 'verifier-standing-teleport-restore');

need(table, 'PHASE-374-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK', 'table-build');
need(table, "../assets/models/table.glb", 'table-glb-primary');
need(table, "../assets/table.fbx", 'table-fbx-fallback');
need(table, 'length: 2.734', 'table-length');
need(table, 'height: 0.801', 'table-height');
need(table, 'depth: 1.46', 'table-depth');
need(table, 'PHASE374_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY', 'table-authority-name');
need(table, 'PHASE326_ANDROID_TABLE_FALLBACK', 'low-poly-removal');
need(table, 'PHASE358_QUEST_TABLE_FALLBACK', 'quest-fallback-removal');
forbid(table, 'setInterval(', 'no-continuous-table-alignment');

need(ui, 'PHASE-374-ANDROID-TOURNAMENT-CARD-UI-LOCK', 'ui-build');
need(ui, '#svr374TournamentLogo', 'tournament-logo');
need(ui, "if (rank === 'T')", 'ten-rank-conversion');
need(ui, 'svr374-card-corner top', 'upper-card-corner');
need(ui, 'svr374-card-corner bottom', 'lower-card-corner');
need(ui, 'svr374-card-center', 'center-suit');
need(ui, 'body.svr374-seated #svr347Move', 'seated-move-hidden');
need(ui, 'body.svr374-seated #svr347Look', 'seated-look-hidden');
need(ui, 'window.SVR_PHASE374_SET_TOURNAMENT_BRAND', 'replaceable-brand-api');

need(install, 'PHASE-374-PHYSICAL-APP-LAUNCHER-LOCK', 'install-build');
need(install, '/game/android.html?channel=stable&v=phase374', 'install-android-route');
need(install, '/game/index.html?platform=quest&v=phase374', 'install-quest-route');
need(update, 'PHASE-374-OPTIONAL-APK-UPDATE-LOCK', 'update-build');
need(update, '/game/phase374-release.json', 'update-release-authority');
need(sw, 'svr-poker-phase374-physical-release-truth-v1', 'service-worker-cache');
need(sw, "cache: 'no-store'", 'network-first-current-release');
need(pwa, "importScripts('/sw.js?v=phase374')", 'single-worker-authority');
forbid(sw, 'phase359-dual-platform', 'stale-service-worker-cache');
forbid(pwa, 'phase155-lobby-barrier', 'stale-pwa-cache');

if (manifest.phase !== 374 || manifest.build !== 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK') errors.push('manifest-current-phase');
if (manifest.start_url !== './android.html?channel=stable&v=phase374') errors.push('manifest-android-start');
if (manifest.quest_route !== './index.html?platform=quest&v=phase374') errors.push('manifest-quest-route');
if (!manifest.one_table_authority_both_platforms || manifest.generated_low_poly_table_is_visible_authority) errors.push('manifest-original-table-policy');
if (!manifest.quest_seated_teleport_blocked || !manifest.android_sticks_hidden_while_seated) errors.push('manifest-seated-lock-policy');
if (manifest.android_card_rank_t_display !== '10' || !manifest.android_tournament_logo_slot) errors.push('manifest-card-brand-policy');
if (rootManifest.start_url !== '/game/android.html?channel=stable&v=phase374&source=pwa') errors.push('root-manifest-start-url');
if (release.phase !== 374 || release.androidEntry !== '/game/android.html?channel=stable&v=phase374' || release.questEntry !== '/game/index.html?platform=quest&v=phase374') errors.push('phase374-release-routes');
if (appVersion.phase !== 374 || appVersion.forceUpdate || appVersion.showUpdatePrompt || !appVersion.manualUpdateOnly) errors.push('app-version-policy');

if (testPlayer.role !== 'player' || !testPlayer.testAccount || testPlayer.cloudAccount) errors.push('test-player-role-truth');
if (testPlayer.avatarUrl !== '/game/assets/models/eric/eric.fbx' || testPlayer.avatarName !== 'Eric') errors.push('test-player-avatar');
need(testPlayerJs, 'createPhase374TestPlayer', 'test-player-create-api');
need(testPlayerJs, "role: 'player'", 'test-player-role-lock');
need(testPlayerJs, "cloudAccount: false", 'test-player-local-truth');
need(login, 'CREATE / RESET TEST PLAYER', 'test-player-button');
need(login, 'phase374-test-player-avatar.js?v=phase374', 'test-player-login-import');

need(deploy, 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK', 'deploy-health-build');
need(deploy, 'build/game/assets/models/table.glb', 'deploy-glb');
need(deploy, 'build/game/assets/table.fbx', 'deploy-fbx');
need(deploy, 'build/game/assets/models/eric/eric.fbx', 'deploy-eric');
need(provision, 'SVR_COGNITO_USER_POOL_ID', 'cognito-pool-secret');
need(provision, 'SVR_TEST_ACCOUNT_PASSWORD', 'test-password-secret');
need(provision, 'admin-set-user-password', 'cognito-password-provision');
need(provision, 'role', 'player-role-profile');
forbid(provision, 'Password123', 'committed-test-password');

const result = {
  build: 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK',
  originalTableMeters: [2.734, 0.801, 1.46],
  android: {
    oneJoin: true,
    sticksHiddenWhileSeated: true,
    tournamentLogo: '/logo.png',
    cardTenDisplay: '10',
    cardCorners: 2,
    centerSuit: true
  },
  quest: {
    originalTable: true,
    seatedTeleportBlocked: true,
    stableSpawnAndFinalizer: true
  },
  testPlayer: {
    localReady: true,
    awsProvisioningConditional: true,
    avatar: 'Eric',
    role: 'player'
  },
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
