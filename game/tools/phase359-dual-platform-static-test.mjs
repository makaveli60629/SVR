import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const moduleText = read('game/modules/phase359_dual_platform_gameplay_continuity_lock.js');
const indexText = read('game/index.html');
const androidText = read('game/android.html');
const androidRelease = JSON.parse(read('game/android-release.json'));
const questRelease = JSON.parse(read('game/quest-release.json'));
const manifest = JSON.parse(read('game/manifest.json'));

assert.match(moduleText, /PHASE-359-DUAL-PLATFORM-GAMEPLAY-CONTINUITY-LOCK/);
assert.match(moduleText, /phase336_authoritative_engine\.js/);
assert.match(moduleText, /CONTINUOUS_DELAY_MS\s*=\s*9000/);
assert.match(moduleText, /PHASE359_QUEST_WINNER_CARDS_AMOUNT_PANEL/);
assert.match(moduleText, /WINS \$\{/);
assert.match(moduleText, /CARDS \$\{/);
assert.match(moduleText, /SETTLED POT/);
assert.match(moduleText, /NEXT HAND IN/);
assert.match(moduleText, /winner\.amount/);
assert.match(moduleText, /winner\.label/);
assert.match(moduleText, /holeCards/);
assert.match(moduleText, /state\.community/);
assert.match(moduleText, /SVR_PHASE359_QA/);
assert.match(moduleText, /SVR_PHASE359_NEXT_HAND/);
assert.match(moduleText, /SVR_PHASE359_TOGGLE_CONTINUOUS/);
assert.match(moduleText, /left-input-moves-left-right-input-moves-right/);
assert.match(moduleText, /headset-look-direction/);
assert.match(moduleText, /hold-to-aim-release-to-teleport/);
assert.match(moduleText, /getHand/);
assert.match(moduleText, /getController/);

assert.match(indexText, /data-build="PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK"/);
assert.match(indexText, /data-release="PHASE-359-DUAL-PLATFORM-GAMEPLAY-CONTINUITY-LOCK"/);
assert.match(indexText, /phase359_dual_platform_gameplay_continuity_lock\.js\?v=phase359/);
assert.ok(indexText.indexOf('await bootPlatform()') < indexText.indexOf('phase359_dual_platform_gameplay_continuity_lock.js'));

assert.match(androidText, /data-build="PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK"/);
assert.match(androidText, /data-release="PHASE-359-DUAL-PLATFORM-GAMEPLAY-CONTINUITY-LOCK"/);
assert.match(androidText, /phase359_dual_platform_gameplay_continuity_lock\.js\?v=phase359/);
assert.ok(androidText.indexOf('phase357_android_table_status_showdown_ante_lock.js') < androidText.indexOf('phase359_dual_platform_gameplay_continuity_lock.js'));
assert.ok(androidText.indexOf('phase357_android_direct_camera_seat_fix.js') < androidText.indexOf('phase359_dual_platform_gameplay_continuity_lock.js'));

assert.equal(questRelease.browserAcceptance.passed, true);
assert.equal(questRelease.browserAcceptance.uploadedTable, 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED');
assert.equal(questRelease.browserAcceptance.fallbackTablePresent, false);
assert.equal(questRelease.browserAcceptance.handsPrimary, true);
assert.equal(questRelease.browserAcceptance.controllerFallback, true);
assert.equal(questRelease.browserAcceptance.holeCards, 2);
assert.equal(questRelease.browserAcceptance.communityCards, 5);
assert.equal(questRelease.browserAcceptance.winner.amount > 0, true);
assert.equal(questRelease.browserAcceptance.nextHand.advanced, true);

assert.equal(androidRelease.browserAcceptance.passed, true);
assert.equal(androidRelease.browserAcceptance.holeCards, 2);
assert.equal(androidRelease.browserAcceptance.communityCards, 5);
assert.equal(androidRelease.browserAcceptance.winnerRecorded, true);
assert.equal(androidRelease.browserAcceptance.settledPotRecorded, true);
assert.equal(androidRelease.browserAcceptance.nextHandAdvanced, true);
assert.equal(androidRelease.browserAcceptance.singleControllerPassed, true);
assert.equal(androidRelease.browserAcceptance.legacyControllerRoots, 0);

assert.equal(manifest.apk_version_name, '0.1.0-rc1');
assert.equal(manifest.apk_version_code, 1);
assert.equal(manifest.release_ready, false);
assert.equal(manifest.force_update, false);
assert.equal(manifest.show_update_prompt, false);
assert.equal(manifest.manual_update_only, true);

const tablePath = path.join(root, 'game/assets/table.fbx');
assert.equal(fs.existsSync(tablePath), true, 'game/assets/table.fbx must exist');
assert.ok(fs.statSync(tablePath).size > 1024, 'uploaded table FBX must be non-empty');

console.log(JSON.stringify({
  build: 'PHASE-359-DUAL-PLATFORM-GAMEPLAY-CONTINUITY-LOCK',
  android: 'phase357 protected',
  quest: 'phase358 protected',
  uploadedTableFbx: fs.statSync(tablePath).size,
  continuousDelayMs: 9000,
  apk: `${manifest.apk_version_name} (${manifest.apk_version_code})`,
  pass: true
}, null, 2));
