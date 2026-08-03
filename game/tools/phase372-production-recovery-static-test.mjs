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
const deploy = read('.github/workflows/deploy.yml');
const accountConfig = JSON.parse(read('site/config/player-api.json'));
const aws = read('infrastructure/aws/phase372-player-account-foundation.yml');

need(android, 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK', 'android-phase372-build');
need(android, "import'./modules/phase372_live_entry_recovery_lock.js?v=phase372'", 'android-early-recovery-import');
need(android, 'phase369_android_join_table_freeze_recovery_lock.js?v=phase372', 'android-phase369-recovery');
need(android, 'phase368_card_dealer_animation_lock.js?v=phase372', 'android-deferred-dealer');
need(android, "document.body.classList.add('boot-released')", 'android-loading-screen-release');

need(quest, 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK', 'quest-phase372-build');
need(quest, "import'./modules/phase372_live_entry_recovery_lock.js?v=phase372'", 'quest-early-recovery-import');
need(quest, 'phase361_quest_lobby_play_seat_watch_npc_lock.js?v=phase364', 'quest-lobby-authority');
need(quest, 'phase368_card_dealer_animation_lock.js?v=phase372', 'quest-deferred-dealer');
need(quest, "document.body.classList.add('boot-released')", 'quest-loading-screen-release');

need(recovery, "export const BUILD = 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK'", 'recovery-build');
need(recovery, "'JOIN TABLE'", 'visible-android-join');
need(recovery, "'START VR LOBBY'", 'visible-quest-start');
need(recovery, 'async function waitForTable(timeoutMs = 45000)', 'bounded-table-wait');
need(recovery, "['SVR_PHASE369_JOIN_TABLE', 'SVR_PHASE363_JOIN_TABLE']", 'authoritative-join-fallback');
need(recovery, 'table.visible = true', 'table-visible');
need(recovery, 'window.SVR_PHASE372_QA', 'phase372-qa');
forbid(recovery, 'new THREE.WebGLRenderer', 'no-second-renderer');

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
need(deploy, 'test -f build/game/modules/phase372_live_entry_recovery_lock.js', 'deploy-phase372-module');
need(deploy, 'databaseProvider', 'deploy-health-aws');
forbid(deploy, 'actions/deploy-pages', 'no-competing-pages-action');

if (exists('.github/workflows/pages.yml')) errors.push('conflicting-workflow:pages.yml');
if (exists('backend/phase370/sql/002_phase370_admin_test_role_assignment.sql')) errors.push('obsolete-azure-role-script-present');
if (!exists('game/assets/models/table.glb')) errors.push('asset-missing:table.glb');
if (!exists('game/assets/table.fbx')) errors.push('asset-missing:table.fbx');

const result = {
  build: 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK',
  provider: accountConfig.provider,
  database: accountConfig.database,
  identity: accountConfig.identity,
  androidVisibleEntry: recovery.includes('JOIN TABLE'),
  questVisibleEntry: recovery.includes('START VR LOBBY'),
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
