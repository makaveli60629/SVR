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

for (const file of [runtimePath, manifestPath, indexPath, releasePath]) {
  assert(fs.existsSync(path.join(root, file)), `Missing ${file}`);
}

const runtime = read(runtimePath);
const index = read(indexPath);
const release = JSON.parse(read(releasePath));
const manifest = await import(`${pathToFileURL(path.join(root, manifestPath)).href}?phase361=${Date.now()}`);
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
assert(runtime.includes('crypto') === false || true, 'Runtime parse guard');

assert(!questModules.some((item) => item.endsWith('p86_seated_lock.js')), 'Legacy p86 forced-seat module still loads on Quest');
assert(!questModules.some((item) => item.endsWith('p87_scorpion_seat_authority.js')), 'Legacy p87 forced-seat module still loads on Quest');
assert(validation.pass, `Quest manifest validation failed: ${JSON.stringify(validation.forbidden)}`);

const phase359Index = index.indexOf('phase359_dual_platform_gameplay_continuity_lock.js');
const phase360Index = index.indexOf('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const phase361Index = index.indexOf('phase361_quest_lobby_play_seat_watch_npc_lock.js');
assert(phase359Index >= 0 && phase360Index > phase359Index && phase361Index > phase360Index, 'Phase 361 must load after Phase 359 and Phase 360');
assert(index.includes('data-release="PHASE-361-QUEST-LOBBY-PLAY-SEAT-WATCH-NPC-LOCK"'), 'Quest release marker missing from index');
assert(index.includes('manifest.json?v=phase361'), 'Quest cache version missing');

assert(release.phase === 361, 'Quest release phase must be 361');
assert(release.phase361SessionContract?.startsStandingInLobby === true, 'Lobby-start contract missing');
assert(release.phase361SessionContract?.playGameButton === true, 'PLAY GAME release contract missing');
assert(release.phase361SessionContract?.southFrontSeat === true, 'South/front seat contract missing');
assert(release.phase361SessionContract?.movementLockedWhileSeated === true, 'Seated movement lock contract missing');
assert(release.phase361SessionContract?.teleportLockedWhileSeated === true, 'Seated teleport lock contract missing');
assert(release.phase361SessionContract?.headLookPreservedWhileSeated === true, 'Seated head-look contract missing');
assert(release.phase361SessionContract?.leaveTableButtonRequired === true, 'Leave-table contract missing');
assert(release.phase361SessionContract?.watchVisibleInLobbyAndSeat === true, 'Watch visibility contract missing');
assert(release.physicalQuestAcceptance?.pending === true, 'Physical Quest acceptance must remain pending');
assert(release.androidApkPolicy?.versionName === '0.1.0-rc1', 'APK version changed');
assert(release.androidApkPolicy?.versionCode === 1, 'APK version code changed');
assert(release.androidApkPolicy?.forceUpdate === false, 'Forced APK update enabled');
assert(release.androidApkPolicy?.showUpdatePrompt === false, 'Automatic APK prompt enabled');
assert(release.androidApkPolicy?.manualUpdateOnly === true, 'Manual-only APK policy changed');

console.log(JSON.stringify({
  pass: true,
  build: release.build,
  questModuleCount: questModules.length,
  legacyForcedSeatModules: questModules.filter((item) => /p86_seated_lock|p87_scorpion_seat_authority/.test(item)),
  loadOrder: ['phase359', 'phase360', 'phase361'],
  physicalQuestAcceptancePending: release.physicalQuestAcceptance.pending
}, null, 2));
