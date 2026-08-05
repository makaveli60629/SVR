import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(`missing:${label}`); };
const forbid = (source, token, label = token) => { if (source.includes(token)) errors.push(`forbidden:${label}`); };

const androidRedirect = read('game/android.html');
const androidLobby = read('game/android-lobby.html');
const androidStable = read('game/android-stable.html');
const quest = read('game/index.html');
const recovery = read('game/modules/phase372_live_entry_recovery_lock.js');
const questRecovery = read('game/modules/phase373_quest_seated_teleport_table_spawn_npc_lock.js');
const questFinalizer = read('game/modules/phase373_quest_table_seat_finalizer_lock.js');
const originalTable = read('game/modules/phase380_original_table_authority_lock.js');
const tableWatchdog = read('game/modules/phase381_table_lobby_watchdog_lock.js');
const deploy = read('.github/workflows/deploy.yml');
const accountConfig = JSON.parse(read('site/config/player-api.json'));
const gameManifest = JSON.parse(read('game/manifest.json'));
const aws = read('infrastructure/aws/phase372-player-account-foundation.yml');

need(androidRedirect, 'android-lobby.html?v=phase381', 'android-phase381-lobby-redirect');
need(androidRedirect, 'PHASE-354-ANDROID-FULL-GAME-RELEASE-ACCEPTANCE-LOCK', 'phase354-certification-marker');
need(androidLobby, 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK', 'phase381-active-marker');
need(androidLobby, 'window.SVR_REQUIRE_TABLE_JOIN = true', 'join-required');
need(androidLobby, 'window.SVR_TABLE_STARTING_STACK = 15000', 'starting-stack');
need(androidLobby, "import './modules/phase372_live_entry_recovery_lock.js?v=phase381'", 'phase372-early-entry');
need(androidLobby, "import './modules/phase364_device_xr_geometry_spawn_lock.js?v=phase381'", 'phase364-base-load');
need(androidLobby, "import './modules/phase380_original_table_authority_lock.js?v=phase381'", 'original-table-load');
need(androidLobby, "import './modules/phase381_table_lobby_watchdog_lock.js?v=phase381'", 'table-watchdog-load');
need(androidLobby, "bootPlatform({ forcedPlatform:'android' })", 'android-platform-boot');
need(androidLobby, 'phase369_android_join_table_freeze_recovery_lock.js', 'phase369-recovery-through-platform-manifest');
need(androidLobby, 'phase369_android_join_readiness_transaction_lock.js', 'phase369-readiness-through-platform-manifest');
need(androidLobby, 'phase369_android_join_intent_bridge_lock.js', 'phase369-intent-through-platform-manifest');
need(androidLobby, 'phase368_card_dealer_animation_lock.js?v=phase381', 'dealer-deferred');
need(androidLobby, "requestIdleCallback(run,{timeout:7000})", 'idle-dealer-load');
need(androidLobby, 'src="/logo.png"', 'android-logo');
need(androidLobby, "SVR_PHASE363_LEAVE_TABLE?.('phase381-lobby-start')", 'lobby-before-seat');
need(androidLobby, 'unlockSound()', 'android-sound-unlock');
need(androidStable, 'PHASE-381-ANDROID-SOUND-COMPACT-LOGO-CARDS-LOCK', 'low-power-successor');
need(androidStable, 'JOIN NOW', 'low-power-join');

const phase372Index = androidLobby.indexOf('phase372_live_entry_recovery_lock.js');
const platformBootIndex = androidLobby.indexOf('bootPlatform({ forcedPlatform');
if (!(phase372Index >= 0 && platformBootIndex > phase372Index)) errors.push('order:phase372-before-platform-stack');

need(quest, 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK', 'quest-phase381-build');
need(quest, "import './modules/phase372_live_entry_recovery_lock.js?v=phase381'", 'quest-visible-entry-recovery');
need(quest, 'phase361_quest_lobby_play_seat_watch_npc_lock.js?v=phase381', 'quest-lobby-authority');
need(quest, 'phase373_quest_seated_teleport_table_spawn_npc_lock.js?v=phase381', 'quest-phase373-recovery');
need(quest, 'phase373_quest_table_seat_finalizer_lock.js?v=phase381', 'quest-finalizer-import');
need(quest, 'phase368_card_dealer_animation_lock.js?v=phase381', 'quest-deferred-dealer');
need(quest, "window.SVR_PHASE373_STABLE_LOBBY?.('phase381-core-ready')", 'quest-one-stable-spawn');
need(quest, "window.SVR_PHASE373_FINALIZE_TABLE?.('phase381-core-ready')", 'quest-table-finalizer');
need(quest, 'SVR_PHASE381_TABLE_WATCHDOG_TICK', 'quest-table-watchdog-use');
need(quest, "document.body.classList.add('boot-released')", 'quest-loading-screen-release');

need(recovery, "export const BUILD = 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK'", 'recovery-build');
need(recovery, "'JOIN TABLE'", 'visible-android-join');
need(recovery, "'START VR LOBBY'", 'visible-quest-start');
need(recovery, 'async function waitForTable(timeoutMs = 45000)', 'bounded-table-wait');
need(recovery, "['SVR_PHASE369_JOIN_TABLE', 'SVR_PHASE363_JOIN_TABLE']", 'authoritative-join-fallback');
need(recovery, 'table.visible = true', 'table-visible');
need(recovery, 'window.SVR_PHASE372_QA', 'phase372-qa');
forbid(recovery, 'new THREE.WebGLRenderer', 'no-second-renderer');

need(questRecovery, "new URL('../assets/models/table.glb', import.meta.url).href", 'quest-real-glb-fallback');
need(questRecovery, 'state.blockedRigMoves += 1', 'quest-seated-teleport-block');
need(questRecovery, "['squeezestart', 'squeezeend']", 'quest-grip-teleport-listener-block');
need(questRecovery, 'chooseUprightRotation', 'quest-npc-upright');
need(questRecovery, 'textureNpc(root)', 'quest-npc-texture');
need(questRecovery, 'window.SVR_PHASE373_QA = qa', 'phase373-qa');
forbid(questRecovery, 'new THREE.WebGLRenderer', 'quest-no-second-renderer');

need(questFinalizer, "export const BUILD = 'PHASE-373-QUEST-TABLE-SEAT-FINALIZER-LOCK'", 'quest-finalizer-build');
need(questFinalizer, 'wrapPublicPlacementApis()', 'quest-finalizer-wraps-public-placement');
need(questFinalizer, 'scheduleTableFinalization', 'quest-finalizer-scheduled-grounding');
need(questFinalizer, 'window.SVR_PHASE373_FINALIZER_QA = qa', 'quest-finalizer-qa');
forbid(questFinalizer, 'new THREE.WebGLRenderer', 'quest-finalizer-no-renderer');

need(originalTable, 'PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK', 'original-table-build');
need(originalTable, "params.get('platform') === 'android'", 'original-table-android-activation');
need(originalTable, 'if (!table.parent && worldRoot()?.isObject3D) worldRoot().add(table)', 'original-table-reattach');
need(tableWatchdog, 'PHASE-381-ANDROID-QUEST-LOBBY-TABLE-WATCHDOG-LOCK', 'table-watchdog-build');
need(tableWatchdog, "setInterval(() => tick('interval'), 1800)", 'continuous-table-watchdog');
need(tableWatchdog, 'SVR_PHASE381_TABLE_WATCHDOG_QA', 'table-watchdog-qa');

if (accountConfig.provider !== 'aws') errors.push('account-provider:not-aws');
if (accountConfig.database !== 'dynamodb') errors.push('account-database:not-dynamodb');
if (accountConfig.identity !== 'cognito') errors.push('account-identity:not-cognito');
if (accountConfig.apiBase !== '') errors.push('account-config:public-api-must-remain-placeholder-until-approved');
need(aws, 'AWS::Cognito::UserPool', 'aws-cognito-user-pool');
need(aws, 'AWS::DynamoDB::Table', 'aws-dynamodb');
need(aws, 'GroupName: admin', 'aws-admin-group');
need(aws, 'DeletionProtectionEnabled: true', 'aws-deletion-protection');

if (gameManifest.phase !== 381) errors.push('game-manifest:not-phase381');
if (gameManifest.android_canonical_entry !== './android-lobby.html?v=phase381') errors.push('game-manifest:android-lobby-not-canonical');
if (gameManifest.table_watchdog !== 'PHASE-381-ANDROID-QUEST-LOBBY-TABLE-WATCHDOG-LOCK') errors.push('game-manifest:watchdog-missing');
if (gameManifest.force_update || gameManifest.show_update_prompt || !gameManifest.manual_update_only) errors.push('game-manifest:update-policy');

need(deploy, 'name: SVR Production Auto Deploy', 'deploy-name');
need(deploy, 'branches: [main]', 'deploy-main-trigger');
need(deploy, 'cp -a source/game publish/game', 'deploy-full-game');
need(deploy, 'cp -a source/site publish/site', 'deploy-full-site');
need(deploy, 'cp source/support-chat-bot.js publish/support-chat-bot.js', 'deploy-ai-support');
need(deploy, 'test -s source/game/assets/models/table.glb', 'deploy-table-glb');
need(deploy, 'test -s source/game/assets/table.fbx', 'deploy-table-fbx');
need(deploy, 'test -s source/downloads/svr-poker-android-rc2.apk', 'deploy-apk');
need(deploy, 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK', 'deploy-phase381-health');
need(deploy, '"androidRoute": "/game/android-lobby.html?v=phase381"', 'deploy-phase381-android-route');
need(deploy, '"questRoute": "/game/index.html?platform=quest&v=phase381"', 'deploy-phase381-quest-route');
need(deploy, '"fullWebsiteHomepage": true', 'deploy-full-homepage-proof');
need(deploy, '"questTableWatchdog": true', 'deploy-table-watchdog-proof');
forbid(deploy, 'actions/deploy-pages', 'no-competing-pages-action');

if (exists('.github/workflows/pages.yml')) errors.push('conflicting-workflow:pages.yml');
if (exists('backend/phase370/sql/002_phase370_admin_test_role_assignment.sql')) errors.push('obsolete-azure-role-script-present');
if (!exists('game/assets/models/table.glb')) errors.push('asset-missing:table.glb');
if (!exists('game/assets/table.fbx')) errors.push('asset-missing:table.fbx');

const result = {
  build: 'PHASE-372-AWS-RECOVERY-PROTECTED-BY-PHASE-381',
  successor: 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK',
  provider: accountConfig.provider,
  database: accountConfig.database,
  identity: accountConfig.identity,
  androidLobbyFirst: true,
  androidVisibleEntry: recovery.includes('JOIN TABLE'),
  androidSound: androidLobby.includes('unlockSound()'),
  questVisibleEntry: recovery.includes('START VR LOBBY'),
  questSeatedTeleportLock: questRecovery.includes('blockedRigMoves'),
  questRealTableFallback: questRecovery.includes('table.glb'),
  questTableFinalizer: questFinalizer.includes('PHASE-373-QUEST-TABLE-SEAT-FINALIZER-LOCK'),
  continuousTableWatchdog: true,
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
