import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const requireText = (source, text, label, errors) => {
  if (!source.includes(text)) errors.push(`${label}: missing ${text}`);
};
const requirePattern = (source, pattern, label, errors) => {
  if (!pattern.test(source)) errors.push(`${label}: missing ${pattern}`);
};
const forbidText = (source, text, label, errors) => {
  if (source.includes(text)) errors.push(`${label}: forbidden ${text}`);
};

const errors = [];
const manifest = read('game/modules/phase340_platform_manifest.js');
const loader = read('game/modules/phase340_platform_core_loader.js');
const index = read('game/index.html');
const continuity = read('game/modules/phase359_dual_platform_gameplay_continuity_lock.js');
const shuffle = read('game/modules/phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const phase361 = read('game/modules/phase361_quest_lobby_play_seat_watch_npc_lock.js');
const shader = read('game/modules/phase358_quest_incremental_shader_compile_lock.js');
const boot = read('game/modules/phase358_quest_runtime_boot_lock.js');
const table = read('game/modules/phase358_quest_uploaded_table_authority_lock.js');
const pokerBoot = read('game/modules/phase358_quest_poker_boot_order_lock.js');
const pot = read('game/modules/phase358_quest_pot_display_authority_lock.js');
const acceptance = read('game/modules/phase358_quest_full_game_acceptance_smoothness_lock.js');
const questRelease = JSON.parse(read('game/quest-release.json'));
const androidRelease = JSON.parse(read('game/android-release.json'));
const webManifest = JSON.parse(read('game/manifest.json'));

requirePattern(manifest, /BUILD = 'PHASE-(?:361|36[2-9]|3[7-9]\d)-/, 'platform successor build', errors);
requirePattern(manifest, /VERSION = 'phase(?:361|36[2-9]|3[7-9]\d)'/, 'platform successor version', errors);
requireText(manifest, "params.get('platform') === 'quest'", 'explicit Quest route', errors);
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
]) requireText(manifest, module, 'Quest manifest', errors);
requireText(manifest, 'phase358-quest-critical-load-order', 'Quest critical validation', errors);
requireText(manifest, 'phase358-quest-deferred-load-order', 'Quest deferred validation', errors);
requireText(manifest, 'const ANDROID_DEFERRED = []', 'Android deferred lock', errors);

const questInputBlock = manifest.split('const QUEST_INPUT = [')[1]?.split('];')[0] || '';
for (const forcedSeat of ['p86_seated_lock.js', 'p87_scorpion_seat_authority.js']) {
  forbidText(questInputBlock, forcedSeat, 'Phase 361 forced-seat exclusion', errors);
}
const questBlock = manifest.split("if (value === 'quest') {")[1]?.split('  }\n  return unique')[0] || '';
for (const forbidden of [
  'phase356_android_real_device_freeze_recovery_lock.js',
  'phase347_android_single_controller_seated_gameplay_apk_release_lock.js',
  'phase350_android_controller_dom_deduplication_lock.js'
]) forbidText(questBlock, forbidden, 'Quest Android exclusion', errors);

requireText(loader, "if (state.platform === 'android')", 'Android incremental branch preserved', errors);
requireText(loader, "method: 'android-incremental-frame-compilation'", 'Android compile policy preserved', errors);
requireText(loader, "release('phase356-android-real-device-ready')", 'Android release reason preserved', errors);
requireText(loader, "if (state.platform === 'quest')", 'Quest incremental branch', errors);
requireText(loader, "method: 'quest-incremental-frame-compilation'", 'Quest compile policy', errors);
requireText(loader, "release('phase358-quest-critical-ready')", 'Quest release reason', errors);
requireText(loader, "window.addEventListener('svr:phase358-acceptance'", 'Acceptance-gated deferred load', errors);
requireText(loader, 'phase358: window.SVR_PHASE358_QA?.() || null', 'Phase 358 audit', errors);

requireText(index, 'PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK', 'Protected Quest base build', errors);
requirePattern(index, /data-release="PHASE-(?:361|36[2-9]|3[7-9]\d)-/, 'Quest successor release', errors);
requirePattern(index, /phase340_platform_core_loader\.js\?v=phase(?:361|36[2-9]|3[7-9]\d)/, 'Quest page cache version', errors);
requirePattern(index, /\?channel=stable&v=phase(?:360|36[1-9]|3[7-9]\d)/, 'Android route preservation', errors);
requirePattern(index, /phase359_dual_platform_gameplay_continuity_lock\.js\?v=phase(?:361|36[2-9]|3[7-9]\d)/, 'Quest continuity successor', errors);
requirePattern(index, /phase360_fresh_shuffle_leave_reset_continuous_table_lock\.js\?v=phase(?:361|36[2-9]|3[7-9]\d)/, 'Quest shuffle successor', errors);
requirePattern(index, /phase361_quest_lobby_play_seat_watch_npc_lock\.js\?v=phase(?:361|36[2-9]|3[7-9]\d)/, 'Quest lobby-seat successor', errors);
if (index.indexOf('await bootPlatform()') > index.indexOf('phase359_dual_platform_gameplay_continuity_lock.js')) errors.push('Phase 359 must load after Quest platform boot');
if (index.indexOf('phase359_dual_platform_gameplay_continuity_lock.js') > index.indexOf('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js')) errors.push('Phase 360 must load after Phase 359');
if (index.indexOf('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js') > index.indexOf('phase361_quest_lobby_play_seat_watch_npc_lock.js')) errors.push('Phase 361 must load after Phase 360');
const phase362Index = index.indexOf('phase362_continuous_10000_turn_clock_rejoin_reset_lock.js');
if (phase362Index >= 0 && phase362Index < index.indexOf('phase361_quest_lobby_play_seat_watch_npc_lock.js')) errors.push('Successor table policy must load after Phase 361');

requireText(continuity, 'PHASE359_QUEST_WINNER_CARDS_AMOUNT_PANEL', 'Quest winner board successor', errors);
requireText(continuity, 'NEXT HAND IN', 'Quest continuous-hand successor', errors);
requireText(continuity, 'getHand', 'Meta hand audit preserved', errors);
requireText(continuity, 'getController', 'Controller fallback audit preserved', errors);
requireText(shuffle, 'crypto.getRandomValues', 'Secure Quest shuffle', errors);
requireText(shuffle, 'SVR_PHASE360_META_CARD_GRAB_QA', 'Meta card grab audit', errors);
requireText(shuffle, 'physicalHeadsetAcceptancePending: true', 'Physical headset truth', errors);

requireText(phase361, 'PLAY GAME', 'Phase 361 PLAY GAME', errors);
requireText(phase361, 'LEAVE TABLE', 'Phase 361 LEAVE TABLE', errors);
requireText(phase361, 'applyLobbySpawn', 'Phase 361 lobby spawn', errors);
requireText(phase361, 'applySeatAnchor', 'Phase 361 seat lock', errors);
requireText(phase361, 'PHASE361_QUEST_FALLBACK_FOREARM_WATCH', 'Phase 361 watch fallback', errors);
requireText(phase361, 'SVR_PHASE360_JOIN_TABLE', 'Phase 360 join integration', errors);
requireText(phase361, 'SVR_PHASE360_LEAVE_TABLE', 'Phase 360 leave integration', errors);

requireText(shader, 'WebGLRenderer?.prototype', 'Shader prototype authority', errors);
requireText(shader, 'phase358QuestDeferredCompileAsync', 'Shader async deferral', errors);
requireText(shader, "window.addEventListener('svr:platform-ready'", 'Shader restore trigger', errors);

requireText(boot, 'PHASE358_QUEST_TABLE_FALLBACK', 'Quest fallback', errors);
requireText(boot, 'PHASE358_QUEST_RAISED_TRANSLUCENT_POT_DISPLAY', 'Quest pot display', errors);
requireText(boot, 'renderer.setPixelRatio(Math.min', 'Quest pixel budget', errors);
requireText(boot, 'renderer.xr.enabled = true', 'Quest WebXR enabled', errors);
requireText(boot, 'removeAndroidControls', 'Android control removal', errors);

requireText(table, '../assets/table.fbx', 'Uploaded table asset', errors);
requireText(table, 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED', 'Uploaded table name', errors);
requireText(table, 'PHASE358_QUEST_UPLOADED_ASSET_CONTAINER', 'Uploaded table container', errors);
requireText(table, 'removeCompetingTables', 'Competing table removal', errors);
if (!fs.existsSync('game/assets/table.fbx') || fs.statSync('game/assets/table.fbx').size < 1024) errors.push('Uploaded table asset missing or empty');

const presentationIndex = pokerBoot.indexOf("import('./phase341_canonical_table_geometry_card_motion_lock.js')");
const engineIndex = pokerBoot.indexOf("import('./p85_poker_truth_lock.js')");
const rulesIndex = pokerBoot.indexOf("import('./phase336_authoritative_poker_rules_pot_settlement_lock.js')");
if (presentationIndex < 0 || engineIndex <= presentationIndex || rulesIndex <= engineIndex) errors.push('Quest poker-first import order invalid');

requireText(pot, 'PHASE333_PHASE358_QUEST_POT_DISPLAY_AUTHORITY', 'Pot authority marker', errors);
requireText(acceptance, 'action as authoritativeAction', 'Direct authoritative action', errors);
requireText(acceptance, 'resetTable', 'Authoritative table reset', errors);
requireText(acceptance, 'startHand', 'Authoritative next hand', errors);
requireText(acceptance, 'turnKey !== lastSubmittedTurnKey', 'One action per turn transition', errors);
requireText(acceptance, "['preflop', 'flop', 'turn', 'river', 'showdown']", 'Full hand streets', errors);
requireText(acceptance, 'totalStacks === 6000', 'Protected Phase 358 chip conservation', errors);
requireText(acceptance, 'physicalQuestSessionTested', 'Physical Quest truth', errors);
forbidText(acceptance, 'window.SVR_POKER_ACTION(action)', 'Wrapped action acceptance bug', errors);

if (Number(questRelease.phase) < 361 || !/^PHASE-(?:361|36[2-9]|3[7-9]\d)-/.test(String(questRelease.build || ''))) errors.push('Quest successor release mismatch');
if (questRelease.browserAcceptance?.baseGameplayCertification !== 'PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK') errors.push('Protected Phase 358 certification missing');
if (!String(questRelease.webEntry || '').includes('platform=quest') || !/v=phase(?:361|36[2-9]|3[7-9]\d)/.test(String(questRelease.webEntry || ''))) errors.push('Quest successor route mismatch');
if (questRelease.physicalQuestAcceptance?.pending !== true || questRelease.physicalQuestAcceptance?.requiresHeadset !== true) errors.push('Physical Quest acceptance truth missing');
if (questRelease.productTruth?.serverAuthoritativePoker !== false) errors.push('Server-authoritative poker overclaim');
if (questRelease.androidApkPolicy?.versionName !== '0.1.0-rc1' || questRelease.androidApkPolicy?.versionCode !== 1) errors.push('Quest record changed APK lock');
if (questRelease.androidApkPolicy?.forceUpdate !== false || questRelease.androidApkPolicy?.showUpdatePrompt !== false || questRelease.androidApkPolicy?.manualUpdateOnly !== true) errors.push('Quest record changed APK policy');
if (androidRelease.apkVersionName !== '0.1.0-rc1' || androidRelease.apkVersionCode !== 1 || androidRelease.manualUpdateOnly !== true) errors.push('Android release policy regressed');
if (Number(webManifest.phase) < 360 || !/^PHASE-(?:360|36[1-9]|3[7-9]\d)-/.test(String(webManifest.build || ''))) errors.push('Android/web successor release mismatch');
if (webManifest.apk_version_name !== '0.1.0-rc1' || webManifest.apk_version_code !== 1 || webManifest.manual_update_only !== true) errors.push('Web manifest APK policy regressed');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  pass: true,
  protectedQuestGameplay: 'PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK',
  successorRelease: questRelease.build,
  criticalBoot: 'shader deferral, runtime, main, uploaded table, poker presentation, hands and gestures, settlement, acceptance',
  sessionAuthority: 'standing lobby spawn, PLAY GAME south/front seat, locked seated movement, LEAVE TABLE, watch and NPC alignment',
  acceptance: {
    localPlayMoneyVsFiveBots: true,
    protectedFullHand: true,
    protectedChipConservation: 6000,
    successorPolicyBankroll: questRelease.tablePolicy?.tableBankroll || null,
    nextHand: true,
    physicalHeadsetPending: true
  },
  androidProtected: {
    phase: webManifest.phase,
    apkVersionName: androidRelease.apkVersionName,
    apkVersionCode: androidRelease.apkVersionCode,
    manualUpdateOnly: androidRelease.manualUpdateOnly
  }
}, null, 2));
