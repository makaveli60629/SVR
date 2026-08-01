import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const manifest = read('game/modules/phase340_platform_manifest.js');
const loader = read('game/modules/phase340_platform_core_loader.js');
const runtime = read('game/modules/phase356_quest_full_game_acceptance_smoothness_lock.js');
const index = read('game/index.html');
const release = JSON.parse(read('game/quest-release.json'));

assert.match(manifest, /PHASE-356-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK/);
assert.match(manifest, /VERSION = 'phase356'/);
assert.match(manifest, /phase331_quest_meta_hands_table_interaction_lock\.js/);
assert.match(manifest, /phase334_table_layout_gesture_poker_lock\.js/);
assert.match(manifest, /phase335_oculus_acceptance_gameplay_stability_lock\.js/);
assert.match(manifest, /phase356_quest_full_game_acceptance_smoothness_lock\.js/);
assert.match(manifest, /const QUEST_DEFERRED = \[\.\.\.SHARED_SOCIAL\]/);
assert.match(manifest, /params\.get\('platform'\) === 'quest'/);
assert.match(manifest, /phase356-quest-critical-load-order/);
assert.match(manifest, /phase356-quest-deferred-load-order/);

const questBlock = manifest.slice(manifest.indexOf("if (value === 'quest')"), manifest.indexOf("if (value === 'camera3')"));
assert.doesNotMatch(questBlock, /phase347_android_single_controller/);
assert.doesNotMatch(questBlock, /phase350_android_controller/);

assert.match(loader, /'svr-phase356'/);
assert.match(loader, /state\.platform === 'quest' \? 44 : 64/);
assert.match(loader, /renderer\.xr\.enabled = true/);
assert.match(loader, /phase356_quest_full_game_acceptance_smoothness_lock\.js/);
assert.match(loader, /phase356-\$\{state\.platform\}-critical-ready/);

assert.match(runtime, /SVR_PHASE356_RUN_QUEST_FULL_GAME_ACCEPTANCE/);
assert.match(runtime, /SVR_POKER_QA_PASSIVE_BOTS = true/);
assert.match(runtime, /\['preflop', 'flop', 'turn', 'river', 'showdown'\]/);
assert.match(runtime, /totalStacks === 6000/);
assert.match(runtime, /snapTurnDegrees: 45/);
assert.match(runtime, /forwardReference: 'headset-look-direction'/);
assert.match(runtime, /physicalQuestInputAcceptanceRequired: true/);
assert.match(runtime, /androidRoots === 0/);

assert.match(index, /PHASE-356-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK/);
assert.match(index, /phase340_platform_core_loader\.js\?v=phase356/);
assert.equal(release.status, 'quest-browser-full-game-acceptance-pending');
assert.equal(release.handsPrimary, true);
assert.equal(release.controllerFallback, true);
assert.equal(release.snapTurnDegrees, 45);
assert.equal(release.androidControlsAllowed, false);
assert.equal(release.productTruth.serverAuthoritativeMultiplayer, false);
assert.equal(release.productTruth.physicalHandTrackingAcceptanceRequired, true);
assert.equal(release.androidApkUnchanged.versionName, '0.1.0-rc1');
assert.equal(release.androidApkUnchanged.forceUpdate, false);
assert.equal(release.androidApkUnchanged.showUpdatePrompt, false);

console.log('Phase 356 Quest static contract passed.');
