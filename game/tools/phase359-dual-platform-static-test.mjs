import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const continuity = read('game/modules/phase359_dual_platform_gameplay_continuity_lock.js');
const shuffle = read('game/modules/phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const phase361 = read('game/modules/phase361_quest_lobby_play_seat_watch_npc_lock.js');
const phase363 = read('game/modules/phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js');
const indexText = read('game/index.html');
const androidRedirect = read('game/android.html');
const androidLobby = read('game/android-lobby.html');
const androidStable = read('game/android-stable.html');
const originalTable = read('game/modules/phase380_original_table_authority_lock.js');
const tableWatchdog = read('game/modules/phase381_table_lobby_watchdog_lock.js');
const fallbackTable = read('game/modules/phase379_quest_procedural_table_authority.js');
const androidRelease = JSON.parse(read('game/android-release.json'));
const questRelease = JSON.parse(read('game/quest-release.json'));
const manifest = JSON.parse(read('game/manifest.json'));

for (const pattern of [
  /PHASE-359-DUAL-PLATFORM-GAMEPLAY-CONTINUITY-LOCK/,
  /phase336_authoritative_engine\.js/,
  /CONTINUOUS_DELAY_MS\s*=\s*9000/,
  /PHASE359_QUEST_WINNER_CARDS_AMOUNT_PANEL/,
  /NEXT HAND IN/,
  /SVR_PHASE359_NEXT_HAND/,
  /SVR_PHASE359_TOGGLE_CONTINUOUS/,
  /left-input-moves-left-right-input-moves-right/,
  /headset-look-direction/,
  /hold-to-aim-release-to-teleport/
]) assert.match(continuity, pattern);
for (const pattern of [
  /PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK/,
  /crypto\.getRandomValues/,
  /SVR_PHASE336_POKER_SNAPSHOT_V1/,
  /SVR_PHASE360_FRESH_ON_JOIN_V1/,
  /function secureNext/,
  /function armFreshJoin/,
  /function joinFreshTable/,
  /practice-table-reset/,
  /SVR_PHASE360_META_CARD_GRAB_QA/,
  /physicalHeadsetAcceptancePending: true/
]) assert.match(shuffle, pattern);
for (const pattern of [/PHASE-361-QUEST-LOBBY-PLAY-SEAT-WATCH-NPC-LOCK/, /PLAY GAME/, /LEAVE TABLE/, /SVR_PHASE360_JOIN_TABLE/, /SVR_PHASE360_LEAVE_TABLE/]) assert.match(phase361, pattern);
for (const pattern of [/PHASE-363-ANDROID-INTEGRATED-LOBBY-AUDIO-GYRO-BANKROLL-LOCK/, /const STARTING_STACK = 15000/, /function prepareLobby/, /function joinTable/, /function leaveTable/]) assert.match(phase363, pattern);

const importIndex = (source, moduleName) => {
  const escaped = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`(?:await\\s+)?import\\(['\"]\\./modules/${escaped}\\.js\\?v=phase\\d+['\"]\\)`);
  const match = expression.exec(source);
  return match ? match.index : -1;
};

assert.match(indexText, /data-build="PHASE-380-GAME-SITE-INTEGRITY-LOCK"/);
assert.match(indexText, /data-release="PHASE-381-SITE-LOBBY-RESTORATION-LOCK"/);
assert.match(indexText, /phase380_original_table_authority_lock\.js\?v=phase381/);
assert.match(indexText, /phase381_table_lobby_watchdog_lock\.js\?v=phase381/);
assert.match(indexText, /phase379_quest_procedural_table_authority\.js\?v=phase381/);
assert.match(indexText, /phase359_dual_platform_gameplay_continuity_lock\.js\?v=phase381/);
assert.match(indexText, /phase360_fresh_shuffle_leave_reset_continuous_table_lock\.js\?v=phase381/);
assert.match(indexText, /phase361_quest_lobby_play_seat_watch_npc_lock\.js\?v=phase381/);
const questBootIndex = indexText.indexOf('await bootPlatform()');
const phase359Index = importIndex(indexText, 'phase359_dual_platform_gameplay_continuity_lock');
const phase360Index = importIndex(indexText, 'phase360_fresh_shuffle_leave_reset_continuous_table_lock');
const phase361Index = importIndex(indexText, 'phase361_quest_lobby_play_seat_watch_npc_lock');
const questSuccessorIndex = importIndex(indexText, 'phase362_continuous_10000_turn_clock_rejoin_reset_lock');
assert.ok(questBootIndex >= 0 && phase359Index > questBootIndex, 'Phase 359 must load after Quest platform boot');
assert.ok(phase360Index > phase359Index, 'Phase 360 must load after Phase 359');
assert.ok(phase361Index > phase360Index, 'Phase 361 must load after Phase 360');
assert.ok(questSuccessorIndex < 0 || questSuccessorIndex > phase361Index, 'Quest successor policy must load after Phase 361');
assert.match(originalTable, /PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK/);
assert.match(originalTable, /assets\/models\/table\.glb/);
assert.match(originalTable, /assets\/table\.fbx/);
assert.match(originalTable, /if \(!table\.parent && worldRoot\(\)\?\.isObject3D\) worldRoot\(\)\.add\(table\)/);
assert.match(tableWatchdog, /PHASE-381-ANDROID-QUEST-LOBBY-TABLE-WATCHDOG-LOCK/);
assert.match(tableWatchdog, /SVR_PHASE381_TABLE_WATCHDOG_QA/);
assert.match(fallbackTable, /FALLBACK_DELAY_MS = 10000/);
assert.match(fallbackTable, /removeFallback\('original-table-adopted'\)/);

assert.match(androidRedirect, /android-lobby\.html\?v=phase381/);
assert.match(androidLobby, /PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK/);
assert.match(androidLobby, /phase363_android_integrated_lobby_audio_gyro_bankroll_lock\.js\?v=phase381/);
assert.match(androidLobby, /phase357_android_table_status_showdown_ante_lock\.js\?v=phase381/);
assert.match(androidLobby, /SVR_PHASE363_LEAVE_TABLE\?\.\('phase381-lobby-start'\)/);
assert.match(androidStable, /PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK/);
assert.match(androidStable, /PHASE-381-ANDROID-SOUND-COMPACT-LOGO-CARDS-LOCK/);
assert.match(androidStable, /JOIN NOW/);
assert.match(androidStable, /function scoreFive\(cards\)/);
assert.match(androidStable, /function bestHand\(cards\)/);
assert.match(androidStable, /function burn\(\)/);
assert.match(androidStable, /RANKS=\['2','3','4','5','6','7','8','9','10','J','Q','K','A'\]/);
assert.match(androidStable, /SVR card back/);
assert.match(androidStable, /function tone\(/);
assert.match(androidStable, /movementControlsWhileSeated:0/);
assert.doesNotMatch(androidStable, /three\.module|type="module"|phase359_dual_platform_gameplay_continuity_lock\.js|phase360_fresh_shuffle_leave_reset_continuous_table_lock\.js/);

assert.equal(questRelease.phase, 380);
assert.equal(questRelease.build, 'PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK');
assert.equal(questRelease.browserAcceptance.baseGameplayCertification, 'PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK');
assert.equal(questRelease.browserAcceptance.uploadedTable, 'PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY');
assert.equal(questRelease.browserAcceptance.proceduralFallbackEmergencyOnly, true);
assert.equal(questRelease.browserAcceptance.fallbackTablePresent, false);
assert.equal(questRelease.browserAcceptance.handsPrimary, true);
assert.equal(questRelease.browserAcceptance.controllerFallback, true);
assert.equal(questRelease.browserAcceptance.holeCards, 2);
assert.equal(questRelease.browserAcceptance.communityCards, 5);
assert.equal(questRelease.browserAcceptance.burnCards, 3);
assert.equal(questRelease.browserAcceptance.nextHand.advanced, true);
assert.equal(questRelease.physicalQuestAcceptance.pending, true);
assert.equal(questRelease.physicalQuestAcceptance.requiresHeadset, true);
assert.equal(questRelease.productTruth.serverAuthoritativePoker, false);
assert.equal(questRelease.sessionContract.teleportLockedWhileSeated, true);

assert.equal(androidRelease.currentGameBuild, 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK');
assert.equal(androidRelease.lowPowerGameBuild, 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK');
assert.equal(androidRelease.webEntry, '/game/android-lobby.html?v=phase381');
assert.equal(androidRelease.lowPowerEntry, '/game/android-stable.html?v=phase381');
assert.equal(androidRelease.tablePolicy.startingStackPerPlayer, 15000);
assert.equal(androidRelease.tablePolicy.players, 6);
assert.equal(androidRelease.tablePolicy.lobbyBeforeSeating, true);
assert.equal(androidRelease.tablePolicy.joinRequiredBeforeDeal, true);
assert.equal(androidRelease.tablePolicy.cardsHiddenBeforeJoin, true);
assert.equal(androidRelease.tablePolicy.deterministicHandEvaluator, true);
assert.equal(androidRelease.tablePolicy.burnCards, true);
assert.equal(androidRelease.tablePolicy.soundEnabled, true);
assert.equal(androidRelease.tablePolicy.compactOpponentPanels, true);
assert.equal(androidRelease.tablePolicy.twoLogoCardBacksPerOpponent, true);
assert.equal(androidRelease.tablePolicy.replaceableTournamentBrandSlot, true);
assert.equal(androidRelease.forceUpdate, false);
assert.equal(androidRelease.showUpdatePrompt, false);
assert.equal(androidRelease.manualUpdateOnly, true);
assert.equal(androidRelease.apkVersionName, '0.1.0-rc2');
assert.equal(androidRelease.apkVersionCode, 2);

assert.equal(manifest.phase, 381);
assert.equal(manifest.build, 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK');
assert.equal(manifest.start_url, './android-lobby.html?v=phase381');
assert.equal(manifest.android_low_power_entry, './android-stable.html?v=phase381');
assert.equal(manifest.android_starting_stack, 15000);
assert.equal(manifest.android_players, 6);
assert.equal(manifest.android_join_required_before_deal, true);
assert.equal(manifest.android_deterministic_hand_evaluator, true);
assert.equal(manifest.android_burn_cards, true);
assert.equal(manifest.android_sound_enabled, true);
assert.equal(manifest.android_compact_opponent_panels, true);
assert.equal(manifest.android_logo_card_backs, true);
assert.equal(manifest.apk_version_name, '0.1.0-rc2');
assert.equal(manifest.apk_version_code, 2);
assert.equal(manifest.release_ready, true);
assert.equal(manifest.force_update, false);
assert.equal(manifest.show_update_prompt, false);
assert.equal(manifest.manual_update_only, true);

const tablePath = path.join(root, 'game/assets/table.fbx');
const tableGlbPath = path.join(root, 'game/assets/models/table.glb');
assert.equal(fs.existsSync(tablePath), true, 'game/assets/table.fbx must exist');
assert.equal(fs.existsSync(tableGlbPath), true, 'game/assets/models/table.glb must exist');
assert.ok(fs.statSync(tablePath).size > 1024, 'uploaded table FBX must be non-empty');
assert.ok(fs.statSync(tableGlbPath).size > 1024, 'uploaded table GLB must be non-empty');

console.log(JSON.stringify({
  build: 'PHASE-380-GAME-SITE-INTEGRITY-LOCK',
  successor: 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK',
  android: 'Phase 381 3D lobby first with Phase 380 JOIN-gated low-power recovery',
  quest: 'Phase 358 gameplay, Phase 361 lobby/seat, Phase 373 seated teleport, Phase 380 uploaded table, Phase 381 watchdog',
  continuity: 'Phase 359 preserved for Quest/desktop',
  shuffle: 'Phase 360 preserved for Quest/desktop',
  uploadedTableFbx: fs.statSync(tablePath).size,
  uploadedTableGlb: fs.statSync(tableGlbPath).size,
  apk: `${manifest.apk_version_name} (${manifest.apk_version_code})`,
  physicalQuestAcceptance: 'pending-headset',
  pass: true
}, null, 2));
