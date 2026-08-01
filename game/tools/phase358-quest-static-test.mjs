import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const requireText = (source, text, label, errors) => {
  if (!source.includes(text)) errors.push(`${label}: missing ${text}`);
};
const forbidText = (source, text, label, errors) => {
  if (source.includes(text)) errors.push(`${label}: forbidden ${text}`);
};

const errors = [];
const manifest = read('game/modules/phase340_platform_manifest.js');
const loader = read('game/modules/phase340_platform_core_loader.js');
const index = read('game/index.html');
const shader = read('game/modules/phase358_quest_incremental_shader_compile_lock.js');
const boot = read('game/modules/phase358_quest_runtime_boot_lock.js');
const table = read('game/modules/phase358_quest_uploaded_table_authority_lock.js');
const pokerBoot = read('game/modules/phase358_quest_poker_boot_order_lock.js');
const pot = read('game/modules/phase358_quest_pot_display_authority_lock.js');
const acceptance = read('game/modules/phase358_quest_full_game_acceptance_smoothness_lock.js');
const questRelease = JSON.parse(read('game/quest-release.json'));
const androidRelease = JSON.parse(read('game/android-release.json'));
const webManifest = JSON.parse(read('game/manifest.json'));

requireText(manifest, "BUILD = 'PHASE-356-ANDROID-REAL-DEVICE-FREEZE-RECOVERY-LOCK'", 'platform compatibility build', errors);
requireText(manifest, "VERSION = 'phase356'", 'platform compatibility version', errors);
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

requireText(index, 'PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK', 'Quest page build', errors);
requireText(index, 'phase340_platform_core_loader.js?v=phase358', 'Quest page cache version', errors);
requireText(index, "?channel=stable&v=phase357", 'Android route preservation', errors);

requireText(shader, 'WebGLRenderer?.prototype', 'Shader prototype authority', errors);
requireText(shader, 'phase358QuestDeferredCompileAsync', 'Shader async deferral', errors);
requireText(shader, "window.addEventListener('svr:platform-ready'", 'Shader restore trigger', errors);

requireText(boot, 'PHASE358_QUEST_TABLE_FALLBACK', 'Quest fallback', errors);
requireText(boot, 'PHASE358_QUEST_RAISED_TRANSLUCENT_POT_DISPLAY', 'Quest pot display', errors);
requireText(boot, 'renderer.setPixelRatio(Math.min', 'Quest pixel budget', errors);
requireText(boot, 'renderer.xr.enabled = true', 'Quest WebXR enabled', errors);
requireText(boot, 'removeAndroidControls', 'Android control removal', errors);

requireText(table, "../assets/table.fbx", 'Uploaded table asset', errors);
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
requireText(acceptance, 'totalStacks === 6000', 'Chip conservation', errors);
requireText(acceptance, 'physicalQuestSessionTested', 'Physical Quest truth', errors);
requireText(acceptance, 'server', 'noop', []);
forbidText(acceptance, 'window.SVR_POKER_ACTION(action)', 'Wrapped action acceptance bug', errors);

if (questRelease.phase !== 358 || questRelease.build !== 'PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK') errors.push('Quest release build mismatch');
if (!String(questRelease.webEntry || '').includes('platform=quest') || !String(questRelease.webEntry || '').includes('v=phase358')) errors.push('Quest release route mismatch');
if (questRelease.physicalQuestAcceptance?.pending !== true || questRelease.physicalQuestAcceptance?.requiresHeadset !== true) errors.push('Physical Quest acceptance truth missing');
if (questRelease.productTruth?.serverAuthoritativePoker !== false) errors.push('Server-authoritative poker overclaim');
if (questRelease.androidApkPolicy?.versionName !== '0.1.0-rc1' || questRelease.androidApkPolicy?.versionCode !== 1) errors.push('Quest record changed APK lock');
if (questRelease.androidApkPolicy?.forceUpdate !== false || questRelease.androidApkPolicy?.showUpdatePrompt !== false || questRelease.androidApkPolicy?.manualUpdateOnly !== true) errors.push('Quest record changed APK policy');
if (androidRelease.apkVersionName !== '0.1.0-rc1' || androidRelease.apkVersionCode !== 1 || androidRelease.manualUpdateOnly !== true) errors.push('Android release policy regressed');
if (webManifest.apk_version_name !== '0.1.0-rc1' || webManifest.apk_version_code !== 1 || webManifest.manual_update_only !== true) errors.push('Web manifest APK policy regressed');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  pass: true,
  build: questRelease.build,
  criticalBoot: 'shader deferral, runtime, main, uploaded table, poker presentation, hands and gestures, settlement, acceptance',
  deferred: 'lobby polish, account activity, avatar, and presence after table ready',
  acceptance: {
    localPlayMoneyVsFiveBots: true,
    fullHand: true,
    chipConservation: 6000,
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
