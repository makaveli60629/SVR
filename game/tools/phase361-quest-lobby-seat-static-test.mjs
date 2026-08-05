import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const runtimePath = 'game/modules/phase361_quest_lobby_play_seat_watch_npc_lock.js';
const manifestPath = 'game/modules/phase340_platform_manifest.js';
const indexPath = 'game/index.html';
const releasePath = 'game/quest-release.json';
const originalTablePath = 'game/modules/phase380_original_table_authority_lock.js';
const watchdogPath = 'game/modules/phase381_table_lobby_watchdog_lock.js';

for (const file of [runtimePath, manifestPath, indexPath, releasePath, originalTablePath, watchdogPath]) {
  assert(fs.existsSync(path.join(root, file)), `Missing ${file}`);
}

const runtime = read(runtimePath);
const index = read(indexPath);
const originalTable = read(originalTablePath);
const watchdog = read(watchdogPath);
const release = JSON.parse(read(releasePath));
const manifest = await import(`${pathToFileURL(path.join(root, manifestPath)).href}?phase381=${Date.now()}`);
const questModules = manifest.manifestFor('quest');
const validation = manifest.validateManifest('quest');

assert(runtime.includes('PHASE-361-QUEST-LOBBY-PLAY-SEAT-WATCH-NPC-LOCK'), 'Phase 361 build label missing');
assert(runtime.includes('PLAY GAME'), 'PLAY GAME control missing');
assert(runtime.includes('LEAVE TABLE'), 'LEAVE TABLE control missing');
assert(runtime.includes('applyLobbySpawn'), 'Lobby spawn authority missing');
assert(runtime.includes('applySeatAnchor'), 'Seat anchor authority missing');
assert(runtime.includes('setMovementAllowed(false)'), 'Seated movement lock missing');
assert(runtime.includes('SVR_PHASE360_JOIN_TABLE'), 'Phase 360 fresh join integration missing');
assert(runtime.includes('SVR_PHASE360_LEAVE_TABLE'), 'Phase 360 deliberate leave integration missing');
assert(runtime.includes('PHASE361_QUEST_FALLBACK_FOREARM_WATCH'), 'Quest fallback watch missing');
assert(runtime.includes('controller-select'), 'Controller selection path missing');
assert(runtime.includes('hand-pinch'), 'Hand pinch selection path missing');
assert(runtime.includes('svrPhase361FacesTable'), 'NPC face-table marker missing');
assert(runtime.includes('svrPhase361Textured'), 'NPC texture marker missing');

assert(!questModules.some((item) => item.endsWith('p86_seated_lock.js')), 'Legacy p86 forced-seat module still loads on Quest');
assert(!questModules.some((item) => item.endsWith('p87_scorpion_seat_authority.js')), 'Legacy p87 forced-seat module still loads on Quest');
assert(validation.pass, `Quest manifest validation failed: ${JSON.stringify(validation.forbidden)}`);

const importIndex = (moduleName) => {
  const expression = new RegExp(`(?:await\\s+)?import\\(['\"]\\./modules/${moduleName}\\.js\\?v=phase\\d+['\"]\\)`);
  const match = expression.exec(index);
  return match ? match.index : -1;
};
const phase359Index = importIndex('phase359_dual_platform_gameplay_continuity_lock');
const phase360Index = importIndex('phase360_fresh_shuffle_leave_reset_continuous_table_lock');
const phase361Index = importIndex('phase361_quest_lobby_play_seat_watch_npc_lock');
const phase362Index = importIndex('phase362_continuous_10000_turn_clock_rejoin_reset_lock');
const phase373Index = importIndex('phase373_quest_seated_teleport_table_spawn_npc_lock');
assert(phase359Index >= 0 && phase360Index > phase359Index && phase361Index > phase360Index, 'Phase 361 must load after Phase 359 and Phase 360');
assert(phase362Index < 0 || phase362Index > phase361Index, 'Any successor table-policy module must load after Phase 361');
assert(phase373Index > phase361Index, 'Phase 373 seated safety must load after Phase 361');
assert(index.includes('data-build="PHASE-380-GAME-SITE-INTEGRITY-LOCK"'), 'Protected Quest entry marker missing');
assert(index.includes('data-release="PHASE-381-SITE-LOBBY-RESTORATION-LOCK"'), 'Phase 381 Quest successor marker missing');
assert(index.includes('manifest.json?v=phase381'), 'Phase 381 Quest cache version missing');
assert(index.includes("phase372_live_entry_recovery_lock.js?v=phase381"), 'Protected Phase 372 visible-entry recovery missing');
assert(index.includes("phase373_quest_seated_teleport_table_spawn_npc_lock.js?v=phase381"), 'Phase 373 seated safety import missing');
assert(index.includes("phase380_original_table_authority_lock.js?v=phase381"), 'Original uploaded table import missing');
assert(index.includes("phase381_table_lobby_watchdog_lock.js?v=phase381"), 'Phase 381 table watchdog import missing');
assert(index.includes("window.SVR_PHASE373_STABLE_LOBBY?.('phase381-core-ready')"), 'Stable lobby placement missing');
assert(index.includes("window.SVR_PHASE373_FINALIZE_TABLE?.('phase381-core-ready')"), 'Table finalizer missing');
assert(index.includes("window.SVR_PHASE381_TABLE_WATCHDOG_TICK?.('phase381-core-ready')"), 'Table watchdog activation missing');
assert(originalTable.includes('PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK'), 'Original table authority regressed');
assert(originalTable.includes('if (!table.parent && worldRoot()?.isObject3D) worldRoot().add(table)'), 'Original table reattachment missing');
assert(watchdog.includes('PHASE-381-ANDROID-QUEST-LOBBY-TABLE-WATCHDOG-LOCK'), 'Phase 381 table watchdog build missing');
assert(watchdog.includes("setInterval(() => tick('interval'), 1800)"), 'Continuous table watchdog missing');

const sessionContract = release.phase361SessionContract || release.sessionContract;
assert(Number(release.phase) >= 361, 'Quest release phase must remain Phase 361 or later');
assert(sessionContract?.startsStandingInLobby === true, 'Lobby-start contract missing');
assert(sessionContract?.playGameButton === true, 'PLAY GAME release contract missing');
assert(sessionContract?.southFrontSeat === true, 'South/front seat contract missing');
assert(sessionContract?.movementLockedWhileSeated === true, 'Seated movement lock contract missing');
assert(sessionContract?.teleportLockedWhileSeated === true, 'Seated teleport lock contract missing');
assert(sessionContract?.headLookPreservedWhileSeated === true, 'Seated head-look contract missing');
assert(sessionContract?.leaveTableButtonRequired === true, 'Leave-table contract missing');
assert(sessionContract?.watchVisibleInLobbyAndSeat === true, 'Watch visibility contract missing');
assert(release.browserAcceptance?.uploadedTable === 'PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY', 'Original uploaded table release record missing');
assert(release.browserAcceptance?.proceduralFallbackEmergencyOnly === true, 'Emergency fallback policy missing');
assert(release.physicalQuestAcceptance?.pending === true, 'Physical Quest acceptance must remain pending');
assert(release.androidApkPolicy?.versionName === '0.1.0-rc2', 'APK version changed');
assert(release.androidApkPolicy?.versionCode === 2, 'APK version code changed');
assert(release.androidApkPolicy?.forceUpdate === false, 'Forced APK update enabled');
assert(release.androidApkPolicy?.showUpdatePrompt === false, 'Automatic APK prompt enabled');
assert(release.androidApkPolicy?.manualUpdateOnly === true, 'Manual-only APK policy changed');

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-361-QUEST-LOBBY-CONTRACT-PROTECTED-BY-PHASE-381',
  successorBuild: 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK',
  phase: release.phase,
  questModuleCount: questModules.length,
  legacyForcedSeatModules: questModules.filter((item) => /p86_seated_lock|p87_scorpion_seat_authority/.test(item)),
  loadOrder: ['phase359', 'phase360', 'phase361', 'phase373', 'phase381-table-watchdog'],
  originalUploadedTableFirst: true,
  seatedTeleportLocked: true,
  physicalQuestAcceptancePending: release.physicalQuestAcceptance.pending,
  androidApk: `${release.androidApkPolicy.versionName}/${release.androidApkPolicy.versionCode}`
}, null, 2));
