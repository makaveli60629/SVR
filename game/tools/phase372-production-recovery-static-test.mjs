import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(`missing:${label}`); };
const forbid = (source, token, label = token) => { if (source.includes(token)) errors.push(`forbidden:${label}`); };

const android = read('game/android.html');
const quest = read('game/index.html');
const recovery = read('game/modules/phase372_live_entry_recovery_lock.js');
const physicalRelease = read('game/modules/phase374_physical_release_truth_lock.js');
const originalTable = read('game/modules/phase374_original_table_authority_lock.js');
const questRecovery = read('game/modules/phase373_quest_seated_teleport_table_spawn_npc_lock.js');
const questFinalizer = read('game/modules/phase373_quest_table_seat_finalizer_lock.js');
const deploy = read('.github/workflows/deploy.yml');
const currentRelease = JSON.parse(read('game/phase374-release.json'));
const accountConfig = JSON.parse(read('site/config/player-api.json'));
const aws = read('infrastructure/aws/phase372-player-account-foundation.yml');

need(android, 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK', 'android-phase374-build');
need(android, 'data-android-authority="PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK"', 'android-phase372-authority');
need(android, "import'./modules/phase372_live_entry_recovery_lock.js?v=phase374'", 'android-early-recovery-import');
need(android, 'phase369_android_join_table_freeze_recovery_lock.js?v=phase374', 'android-phase369-recovery');
need(android, 'phase368_card_dealer_animation_lock.js?v=phase374', 'android-deferred-dealer');
need(android, "document.body.classList.add('boot-released')", 'android-loading-screen-release');
need(android, "phase374_original_table_authority_lock.js?v=phase374", 'android-original-table');

need(quest, 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK', 'quest-phase374-build');
need(quest, 'data-quest-authority="PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK"', 'quest-phase373-authority');
need(quest, "import'./modules/phase372_live_entry_recovery_lock.js?v=phase374'", 'quest-visible-entry-recovery');
need(quest, 'phase361_quest_lobby_play_seat_watch_npc_lock.js?v=phase374', 'quest-lobby-authority');
need(quest, 'phase373_quest_seated_teleport_table_spawn_npc_lock.js?v=phase374', 'quest-phase373-recovery');
need(quest, 'phase373_quest_table_seat_finalizer_lock.js?v=phase374', 'quest-finalizer-import');
need(quest, 'phase368_card_dealer_animation_lock.js?v=phase374', 'quest-deferred-dealer');
need(quest, "window.SVR_PHASE373_STABLE_LOBBY?.('quest-phase374-core-ready')", 'quest-one-stable-spawn');
need(quest, "window.SVR_PHASE374_ORIGINAL_TABLE_REASSERT?.('quest-after-stable-lobby')", 'quest-original-table-after-lobby');
need(quest, "window.SVR_PHASE373_FINALIZE_TABLE?.('quest-phase374-after-lobby')", 'quest-table-finalized-after-lobby');
const stableLobbyIndex = quest.indexOf("window.SVR_PHASE373_STABLE_LOBBY?.('quest-phase374-core-ready')");
const originalTableIndex = quest.indexOf("window.SVR_PHASE374_ORIGINAL_TABLE_REASSERT?.('quest-after-stable-lobby')");
const finalizerIndex = quest.indexOf("window.SVR_PHASE373_FINALIZE_TABLE?.('quest-phase374-after-lobby')");
if (!(stableLobbyIndex >= 0 && originalTableIndex > stableLobbyIndex && finalizerIndex > originalTableIndex)) errors.push('order:quest-stable-lobby-original-table-finalizer');
need(quest, "document.body.classList.add('boot-released')", 'quest-loading-screen-release');

need(recovery, "export const BUILD = 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK'", 'recovery-build');
need(recovery, "'JOIN TABLE'", 'visible-android-join');
need(recovery, "'START VR LOBBY'", 'visible-quest-start');
need(recovery, 'async function waitForTable(timeoutMs = 45000)', 'bounded-table-wait');
need(recovery, "['SVR_PHASE369_JOIN_TABLE', 'SVR_PHASE363_JOIN_TABLE']", 'authoritative-join-fallback');
need(recovery, 'table.visible = true', 'table-visible');
need(recovery, 'window.SVR_PHASE372_QA', 'phase372-qa');
need(recovery, "import('./phase374_physical_release_truth_lock.js?v=phase374')", 'phase374-verifier-loader');
forbid(recovery, 'new THREE.WebGLRenderer', 'no-second-renderer');

need(physicalRelease, 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK', 'physical-release-build');
need(physicalRelease, 'window.SVR_PHASE374_RECOVER', 'physical-release-recovery');
need(physicalRelease, 'window.SVR_PHASE374_CLEAR_OLD_CACHE', 'physical-release-cache-reset');
need(originalTable, 'PHASE-374-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK', 'original-table-build');
need(originalTable, "new URL('../assets/models/table.glb', import.meta.url).href", 'original-table-glb');
need(originalTable, "new URL('../assets/table.fbx', import.meta.url).href", 'original-table-fbx');
need(originalTable, 'removeCompetingTables()', 'remove-generated-tables');

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

if (accountConfig.provider !== 'aws') errors.push('account-provider:not-aws');
if (accountConfig.database !== 'dynamodb') errors.push('account-database:not-dynamodb');
if (accountConfig.identity !== 'cognito') errors.push('account-identity:not-cognito');
if (accountConfig.apiBase !== '') errors.push('account-config:public-api-must-remain-placeholder-until-approved');
need(aws, 'AWS::Cognito::UserPool', 'aws-cognito-user-pool');
need(aws, 'AWS::DynamoDB::Table', 'aws-dynamodb');
need(aws, 'GroupName: admin', 'aws-admin-group');
need(aws, 'DeletionProtectionEnabled: true', 'aws-deletion-protection');

need(deploy, 'name: SVR Production Auto Deploy', 'deploy-name');
need(deploy, 'branches: [main]', 'deploy-main-trigger');
need(deploy, 'git push --force origin gh-pages', 'deploy-gh-pages-publish');
need(deploy, 'test -f build/game/assets/models/table.glb', 'deploy-table-glb');
need(deploy, 'test -f build/game/assets/table.fbx', 'deploy-table-fbx');
need(deploy, 'test -f build/game/assets/models/eric/eric.fbx', 'deploy-eric-fbx');
need(deploy, 'test -f build/game/modules/phase372_live_entry_recovery_lock.js', 'deploy-phase372-module');
need(deploy, 'test -f build/game/modules/phase373_quest_seated_teleport_table_spawn_npc_lock.js', 'deploy-phase373-module');
need(deploy, 'test -f build/game/modules/phase373_quest_table_seat_finalizer_lock.js', 'deploy-phase373-finalizer-module');
need(deploy, 'test -f build/game/modules/phase374_original_table_authority_lock.js', 'deploy-phase374-table-module');
need(deploy, '"questRoute": "/game/index.html?platform=quest&v=phase374"', 'deploy-phase374-quest-route');
need(deploy, '"androidRoute": "/game/android.html?channel=stable&v=phase374"', 'deploy-phase374-android-route');
need(deploy, 'databaseProvider', 'deploy-health-aws');
forbid(deploy, 'actions/deploy-pages', 'no-competing-pages-action');

if (exists('.github/workflows/pages.yml')) errors.push('conflicting-workflow:pages.yml');
if (exists('backend/phase370/sql/002_phase370_admin_test_role_assignment.sql')) errors.push('obsolete-azure-role-script-present');
if (!exists('game/assets/models/table.glb')) errors.push('asset-missing:table.glb');
if (!exists('game/assets/table.fbx')) errors.push('asset-missing:table.fbx');
if (!exists('game/assets/models/eric/eric.fbx')) errors.push('asset-missing:eric.fbx');

if (currentRelease.phase !== 374 || currentRelease.build !== 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK') errors.push('current-release:not-phase374');
if (currentRelease.androidEntry !== '/game/android.html?channel=stable&v=phase374') errors.push('current-release:android-route');
if (currentRelease.questEntry !== '/game/index.html?platform=quest&v=phase374') errors.push('current-release:quest-route');

const result = {
  build: currentRelease.build,
  androidBuild: 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK',
  questBuild: 'PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK',
  provider: accountConfig.provider,
  database: accountConfig.database,
  identity: accountConfig.identity,
  androidVisibleEntry: recovery.includes('JOIN TABLE'),
  questVisibleEntry: recovery.includes('START VR LOBBY'),
  questSeatedTeleportLock: questRecovery.includes('blockedRigMoves'),
  originalTableAuthority: originalTable.includes('PHASE-374-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK'),
  questTableFinalizer: questFinalizer.includes('PHASE-373-QUEST-TABLE-SEAT-FINALIZER-LOCK'),
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
