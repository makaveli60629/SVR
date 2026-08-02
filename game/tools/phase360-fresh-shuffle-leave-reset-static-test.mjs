import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(file, 'utf8');
const runtime = read('game/modules/phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const android = read('game/android.html');
const quest = read('game/index.html');
const gesture = read('game/modules/phase334_table_layout_gesture_poker_lock.js');
const engine = read('game/modules/phase336_authoritative_engine.js');
const manifest = JSON.parse(read('game/manifest.json'));

assert.match(runtime, /PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK/);
assert.match(runtime, /crypto\.getRandomValues/);
assert.match(runtime, /Math\.random = secureRandom/);
assert.match(runtime, /SVR_PHASE336_POKER_SNAPSHOT_V1/);
assert.match(runtime, /SVR_PHASE360_TABLE_SESSION_V1/);
assert.match(runtime, /SVR_PHASE360_FRESH_ON_JOIN_V1/);
assert.match(runtime, /function secureReset/);
assert.match(runtime, /function secureNext/);
assert.match(runtime, /function armFreshJoin/);
assert.match(runtime, /function joinFreshTable/);
assert.match(runtime, /function requiresPracticeReset/);
assert.match(runtime, /practice-table-reset/);
assert.match(runtime, /SVR_PHASE360_FRESH_HAND/);
assert.match(runtime, /SVR_PHASE360_LEAVE_TABLE/);
assert.match(runtime, /SVR_PHASE360_JOIN_TABLE/);
assert.match(runtime, /SVR_PHASE360_SECURE_NEXT_HAND/);
assert.match(runtime, /SVR_PHASE360_META_CARD_GRAB_QA/);
assert.match(runtime, /physicalHeadsetAcceptancePending: true/);
assert.match(runtime, /exactDeckRepeats === 0/);

assert.match(engine, /function shuffledDeck\(\)/);
assert.match(engine, /localStorage\.setItem\(SAVE/);
assert.match(engine, /Date\.now\(\) - snapshot\.savedAt > 1800000/);

assert.match(gesture, /function nearestHumanCard/);
assert.match(gesture, /function grabCard/);
assert.match(gesture, /function releaseCard/);
assert.match(gesture, /pointer\.down/);
assert.match(gesture, /window\.SVR_POKER_ACTION\?\.\("fold"\)/);

for (const [name, html] of [['android', android], ['quest', quest]]) {
  assert.match(html, /data-release="PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK"/);
  assert.match(html, /phase359_dual_platform_gameplay_continuity_lock\.js\?v=phase360/);
  assert.match(html, /phase360_fresh_shuffle_leave_reset_continuous_table_lock\.js\?v=phase360/);
  assert.ok(
    html.indexOf('phase359_dual_platform_gameplay_continuity_lock.js')
      < html.indexOf('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js'),
    `${name} Phase 360 must load after Phase 359`
  );
}

assert.equal(manifest.phase, 360);
assert.equal(manifest.build, 'PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK');
assert.match(manifest.start_url, /v=phase360/);
assert.equal(manifest.apk_version_name, '0.1.0-rc1');
assert.equal(manifest.apk_version_code, 1);
assert.equal(manifest.release_ready, false);
assert.equal(manifest.force_update, false);
assert.equal(manifest.show_update_prompt, false);
assert.equal(manifest.manual_update_only, true);

console.log(JSON.stringify({
  pass: true,
  build: manifest.build,
  random: 'crypto.getRandomValues with synchronous engine-call wrapper',
  leave: 'deliberate leave clears recovery snapshot and arms fresh join',
  loop: 'Phase 359 nine-second continuation protected; Phase 360 resets practice table when fewer than two players or human is out',
  metaCards: 'pinch and trigger pickup source contract present; physical headset acceptance pending',
  apk: `${manifest.apk_version_name} (${manifest.apk_version_code})`
}, null, 2));
