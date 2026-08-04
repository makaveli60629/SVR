import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(`${label}: missing ${token}`); };
const forbid = (source, token, label = token) => { if (source.includes(token)) errors.push(`${label}: forbidden ${token}`); };

const manifest = read('game/modules/phase340_platform_manifest.js');
const loader = read('game/modules/phase340_platform_core_loader.js');
const index = read('game/index.html');
const phase361 = read('game/modules/phase361_quest_lobby_play_seat_watch_npc_lock.js');
const shader = read('game/modules/phase358_quest_incremental_shader_compile_lock.js');
const boot = read('game/modules/phase358_quest_runtime_boot_lock.js');
const table = read('game/modules/phase358_quest_uploaded_table_authority_lock.js');
const pokerBoot = read('game/modules/phase358_quest_poker_boot_order_lock.js');
const pot = read('game/modules/phase358_quest_pot_display_authority_lock.js');
const acceptance = read('game/modules/phase358_quest_full_game_acceptance_smoothness_lock.js');
const continuity = read('game/modules/phase359_dual_platform_gameplay_continuity_lock.js');
const shuffle = read('game/modules/phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const questRelease = JSON.parse(read('game/quest-release.json'));
const androidRelease = JSON.parse(read('game/android-release.json'));
const webManifest = JSON.parse(read('game/manifest.json'));

if (!/BUILD = 'PHASE-(?:358|3[6-9]\d)-/.test(manifest)) errors.push('Platform successor build missing');
if (!/VERSION = 'phase(?:358|3[6-9]\d)'/.test(manifest)) errors.push('Platform successor version missing');
need(manifest, "params.get('platform') === 'quest'", 'Explicit Quest route');
for (const module of [
  'phase358_quest_incremental_shader_compile_lock.js',
  'phase358_quest_runtime_boot_lock.js',
  'phase358_quest_uploaded_table_authority_lock.js',
  'phase358_quest_poker_boot_order_lock.js',
  'phase331_quest_meta_hands_table_interaction_lock.js',
  'phase334_table_layout_gesture_poker_lock.js',
  'phase335_oculus_acceptance_gameplay_stability_lock.js',
  'phase358_quest_pot_display_authority_lock.js',
  'phase358_quest_full_game_acceptance_smoothness_lock.js'
]) need(manifest, module, 'Quest manifest');
if (!/phase(?:358|3[6-9]\d)-quest-critical-load-order/.test(manifest)) errors.push('Quest critical validation missing');
if (!/phase(?:358|3[6-9]\d)-quest-deferred-load-order/.test(manifest)) errors.push('Quest deferred validation missing');
need(manifest, 'const ANDROID_DEFERRED = []', 'Android deferred lock');

const questRuntimeArrays = [
  manifest.split('const QUEST_FOUNDATION = [')[1]?.split('];')[0] || '',
  manifest.split('const QUEST_INPUT = [')[1]?.split('];')[0] || '',
  manifest.split('const QUEST_SETTLEMENT = [')[1]?.split('];')[0] || '',
  manifest.split('const QUEST_ACCEPTANCE = [')[1]?.split('];')[0] || ''
].join('\n');
for (const forbidden of [
  'phase356_android_real_device_freeze_recovery_lock.js',
  'phase347_android_single_controller_seated_gameplay_apk_release_lock.js',
  'phase350_android_controller_dom_deduplication_lock.js',
  'p86_seated_lock.js',
  'p87_scorpion_seat_authority.js'
]) forbid(questRuntimeArrays, forbidden, 'Quest runtime exclusion');

need(loader, "if (state.platform === 'quest')", 'Quest incremental branch');
need(loader, "method: 'quest-incremental-frame-compilation'", 'Quest compile policy');
need(loader, "release('phase358-quest-critical-ready')", 'Quest release reason');
need(loader, "window.addEventListener('svr:phase358-acceptance'", 'Acceptance-gated deferred load');

need(index, 'phase358_quest_full_game_acceptance_smoothness_lock.js', 'Protected Quest acceptance module');
if (!/data-release="PHASE-(?:358|3[6-9]\d)-/.test(index)) errors.push('Quest successor release missing');
if (!/phase340_platform_core_loader\.js\?v=phase(?:358|3[6-9]\d)/.test(index)) errors.push('Quest cache version missing');
need(index, 'phase359_dual_platform_gameplay_continuity_lock.js', 'Quest continuity successor');
need(index, 'phase360_fresh_shuffle_leave_reset_continuous_table_lock.js', 'Quest shuffle successor');
need(index, 'phase361_quest_lobby_play_seat_watch_npc_lock.js', 'Quest lobby-seat successor');

for (const token of ['PLAY GAME', 'LEAVE TABLE', 'applyLobbySpawn', 'applySeatAnchor', 'PHASE361_QUEST_FALLBACK_FOREARM_WATCH', 'SVR_PHASE360_JOIN_TABLE', 'SVR_PHASE360_LEAVE_TABLE']) need(phase361, token, 'Phase 361 session contract');
for (const token of ['WebGLRenderer?.prototype', 'phase358QuestDeferredCompileAsync', "window.addEventListener('svr:platform-ready'"]) need(shader, token, 'Quest shader contract');
for (const token of ['PHASE358_QUEST_TABLE_FALLBACK', 'PHASE358_QUEST_RAISED_TRANSLUCENT_POT_DISPLAY', 'renderer.setPixelRatio(Math.min', 'renderer.xr.enabled = true', 'removeAndroidControls']) need(boot, token, 'Quest boot contract');
for (const token of ['../assets/table.fbx', 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED', 'PHASE358_QUEST_UPLOADED_ASSET_CONTAINER', 'removeCompetingTables']) need(table, token, 'Uploaded table contract');
if (!fs.existsSync('game/assets/table.fbx') || fs.statSync('game/assets/table.fbx').size < 1024) errors.push('Uploaded table asset missing or empty');

const presentationIndex = pokerBoot.indexOf("import('./phase341_canonical_table_geometry_card_motion_lock.js')");
const engineIndex = pokerBoot.indexOf("import('./p85_poker_truth_lock.js')");
const rulesIndex = pokerBoot.indexOf("import('./phase336_authoritative_poker_rules_pot_settlement_lock.js')");
if (presentationIndex < 0 || engineIndex <= presentationIndex || rulesIndex <= engineIndex) errors.push('Quest poker-first import order invalid');

need(pot, 'PHASE333_PHASE358_QUEST_POT_DISPLAY_AUTHORITY', 'Pot authority marker');
for (const token of ['action as authoritativeAction', 'resetTable', 'startHand', 'turnKey !== lastSubmittedTurnKey', "['preflop', 'flop', 'turn', 'river', 'showdown']", 'totalStacks === 6000', 'physicalQuestSessionTested']) need(acceptance, token, 'Phase 358 full-hand contract');
forbid(acceptance, 'window.SVR_POKER_ACTION(action)', 'Wrapped action acceptance bug');
need(continuity, 'PHASE359_QUEST_WINNER_CARDS_AMOUNT_PANEL', 'Quest winner panel');
need(shuffle, 'crypto.getRandomValues', 'Secure Quest shuffle');
need(shuffle, 'physicalHeadsetAcceptancePending: true', 'Physical headset truth');

if (questRelease.browserAcceptance?.baseGameplayCertification !== 'PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK') errors.push('Protected Phase 358 certification missing');
if (questRelease.physicalQuestAcceptance?.pending !== true || questRelease.physicalQuestAcceptance?.requiresHeadset !== true) errors.push('Physical Quest acceptance truth missing');
if (questRelease.productTruth?.serverAuthoritativePoker !== false) errors.push('Server-authoritative poker overclaim');
if (androidRelease.apkVersionName !== '0.1.0-rc1' || androidRelease.apkVersionCode !== 1 || androidRelease.manualUpdateOnly !== true) errors.push('Android APK policy regressed');
if (webManifest.apk_version_name !== '0.1.0-rc1' || webManifest.apk_version_code !== 1 || webManifest.manual_update_only !== true) errors.push('Web APK policy regressed');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  protectedQuestGameplay: 'PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK',
  successorBuild: webManifest.build,
  physicalHeadsetPending: true,
  androidApk: `${androidRelease.apkVersionName}/${androidRelease.apkVersionCode}`
}, null, 2));
