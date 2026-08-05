import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const phase = read('game/modules/phase364_device_xr_geometry_spawn_lock.js');
const quarantine = read('game/modules/phase364_quest_eric_quarantine_watch.js');
const recovery = read('game/modules/phase373_quest_seated_teleport_table_spawn_npc_lock.js');
const originalTable = read('game/modules/phase380_original_table_authority_lock.js');
const core = read('game/modules/core_scene.js');
const manifest = read('game/modules/phase340_platform_manifest.js');
const quest = read('game/index.html');
const androidRedirect = read('game/android.html');
const androidStable = read('game/android-stable.html');
const appManifest = JSON.parse(read('game/manifest.json'));

const requireText = (source, token, label = token) => {
  if (!source.includes(token)) throw new Error(`Missing ${label}`);
};
const forbidText = (source, token, label = token) => {
  if (source.includes(token)) throw new Error(`Forbidden ${label}`);
};

for (const token of [
  'length: 2.74', 'depth: 1.46', 'height: 0.80', 'TABLE_READY_GAP = 0.90',
  "spawnMode: 'table-ready-standing'", "scheduleStableSpawn('xr-session-start')", 'headInsideTable',
  'bounceCorrectionsBlocked', 'trapAuthority()', "optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']",
  'window.SVR_PHASE364_ENTER_VR', 'window.SVR_PHASE364_LOBBY_SPAWN', 'window.SVR_PHASE364_SEAT',
  'window.SVR_PHASE364_ANDROID_SEAT', 'Dealer Eric remains hidden', 'root.rotation.y = Math.atan2(-dx, -dz)'
]) requireText(phase, token);
forbidText(phase, 'frontZ + 3.15', 'distant Quest lobby spawn');
forbidText(phase, 'setTimeout(() => lobbySpawn(true), 180); setTimeout(() => lobbySpawn(true), 850)', 'double forced XR recenter');
forbidText(phase, 'function installControllerRecovery', 'duplicate Phase 364 controller select authority');

for (const token of ['PHASE-364-QUEST-ERIC-QUARANTINE-WATCH', 'SVR_PHASE364_SANITIZE_NPCS', 'window.setInterval(sweep, 260)', 'SVR_PHASE364_ERIC_QUARANTINE_SWEEP']) requireText(quarantine, token);
for (const token of ['PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK', 'window.SVR_PHASE364_SANITIZE_NPCS = repairNpcs', 'svrPhase364Quarantined: false', 'textureNpc(root)', 'chooseUprightRotation(root)', 'groundNpc(root)']) requireText(recovery, token);
for (const token of ['PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK', 'length: 2.734', 'depth: 1.46', 'PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY']) requireText(originalTable, token);

requireText(core, 'renderer.xr.setReferenceSpaceType("local-floor")');
requireText(core, 'optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"]');
forbidText(core, 'requiredFeatures:', 'required XR floor feature');

requireText(manifest, 'phase364_device_xr_geometry_spawn_lock.js');
requireText(manifest, 'phase364-quest-critical-load-order');
if (!/export const VERSION = 'phase3(?:6[4-9]|[7-9][0-9])'/.test(manifest)) throw new Error('Platform version regressed below Phase 364');
if (!/phase(?:364|365|367)-android-critical-load-order/.test(manifest)) throw new Error('Missing protected optional Android geometry validator');

const importPosition = (source, token) => source.indexOf(token);
const questPhaseIndex = importPosition(quest, 'phase364_device_xr_geometry_spawn_lock.js?v=phase380');
const questBootIndex = importPosition(quest, 'phase340_platform_core_loader.js?v=phase380');
const originalIndex = importPosition(quest, 'phase380_original_table_authority_lock.js?v=phase380');
const phase361Index = importPosition(quest, 'phase361_quest_lobby_play_seat_watch_npc_lock.js?v=phase380');
const quarantineIndex = importPosition(quest, 'phase364_quest_eric_quarantine_watch.js?v=phase380');
const recoveryIndex = importPosition(quest, 'phase373_quest_seated_teleport_table_spawn_npc_lock.js?v=phase380');
if (questPhaseIndex < 0 || questBootIndex <= questPhaseIndex) throw new Error('Quest Phase 364 must load before platform boot');
if (originalIndex < 0 || originalIndex > questBootIndex) throw new Error('Original uploaded table authority must load before platform boot');
if (phase361Index < 0 || quarantineIndex <= phase361Index || recoveryIndex <= quarantineIndex) throw new Error('Phase 373 recovery must load after Phase 361 and historical quarantine modules');
requireText(quest, 'PHASE-380-GAME-SITE-INTEGRITY-LOCK');
requireText(quest, 'SVR_PHASE364_LOBBY_SPAWN');
requireText(quest, 'SVR_PHASE373_REPAIR_NPCS');
requireText(quest, 'SVR_PHASE373_STABLE_LOBBY');
requireText(quest, 'SVR_PHASE380_ORIGINAL_TABLE_REASSERT');
forbidText(quest, 'window.SVR_PHASE364_ERIC_QUARANTINE_SWEEP?.();', 'page-level-Eric-hide-call');

// Phase 380 intentionally redirects Android to a low-power seated table. The
// Phase 364 Android APIs above remain available for the optional 3D route.
requireText(androidRedirect, 'PHASE-354-ANDROID-FULL-GAME-RELEASE-ACCEPTANCE-LOCK', 'protected Android full-game certification');
requireText(androidRedirect, 'android-stable.html?v=phase380', 'Phase 380 Android redirect');
requireText(androidStable, 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK');
requireText(androidStable, 'JOIN NOW');
requireText(androidStable, 'movementControlsWhileSeated:0');
requireText(androidStable, 'function scoreFive(cards)');
forbidText(androidStable, 'phase364_device_xr_geometry_spawn_lock.js', 'heavy XR geometry on standalone Android');

if (appManifest.apk_version_name !== '0.1.0-rc2' || appManifest.apk_version_code !== 2) throw new Error('APK release version mismatch');
if (appManifest.force_update || appManifest.show_update_prompt || !appManifest.manual_update_only || !appManifest.release_ready) throw new Error('APK prompt policy changed');
if (Number(appManifest.phase || 0) !== 380) throw new Error('Manifest phase is not Phase 380');
if (appManifest.table_reference_line_offset_meters !== 0.065) throw new Error('Protected table reference line changed');
if (!appManifest.android_sticks_hidden_while_seated || appManifest.android_movement_controls_while_seated !== 0) throw new Error('Standalone seated movement lock changed');

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-364-PROTECTED-BY-PHASE-380',
  currentPlatformPhase: appManifest.phase,
  tableMeters: [2.74, 0.80, 1.46],
  questSpawn: '0.90m outside south/front rail facing felt',
  xrEntry: 'single one-time lobby placement plus seated position safety recovery',
  xrLocalFloorRequired: false,
  originalTableAuthority: 'PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY',
  historicalEricQuarantineModuleRetained: true,
  phase373EricRepairOverridesQuarantine: true,
  android: 'Phase 380 standalone seated table; Phase 364 3D APIs retained as optional regression surface',
  apk: `${appManifest.apk_version_name}/${appManifest.apk_version_code}`
}, null, 2));
