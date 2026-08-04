import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const phase = read('game/modules/phase364_device_xr_geometry_spawn_lock.js');
const quarantine = read('game/modules/phase364_quest_eric_quarantine_watch.js');
const recovery = read('game/modules/phase373_quest_seated_teleport_table_spawn_npc_lock.js');
const originalTable = read('game/modules/phase374_original_table_authority_lock.js');
const core = read('game/modules/core_scene.js');
const manifest = read('game/modules/phase340_platform_manifest.js');
const quest = read('game/index.html');
const android = read('game/android.html');
const appManifest = JSON.parse(read('game/manifest.json'));

const requireText = (source, token, label = token) => {
  if (!source.includes(token)) throw new Error(`Missing ${label}`);
};
const forbidText = (source, token, label = token) => {
  if (source.includes(token)) throw new Error(`Forbidden ${label}`);
};

requireText(phase, 'length: 2.74');
requireText(phase, 'depth: 1.46');
requireText(phase, 'height: 0.80');
requireText(phase, 'TABLE_READY_GAP = 0.90');
requireText(phase, "spawnMode: 'table-ready-standing'");
requireText(phase, "scheduleStableSpawn('xr-session-start')");
requireText(phase, 'headInsideTable');
requireText(phase, 'bounceCorrectionsBlocked');
requireText(phase, 'trapAuthority()');
requireText(phase, "optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']");
requireText(phase, 'window.SVR_PHASE364_ENTER_VR');
requireText(phase, 'window.SVR_PHASE364_LOBBY_SPAWN');
requireText(phase, 'window.SVR_PHASE364_SEAT');
requireText(phase, 'window.SVR_PHASE364_ANDROID_SEAT');
requireText(phase, 'Dealer Eric remains hidden');
requireText(phase, 'root.rotation.y = Math.atan2(-dx, -dz)');
forbidText(phase, 'frontZ + 3.15', 'distant Quest lobby spawn');
forbidText(phase, 'setTimeout(() => lobbySpawn(true), 180); setTimeout(() => lobbySpawn(true), 850)', 'double forced XR recenter');
forbidText(phase, 'function installControllerRecovery', 'duplicate Phase 364 controller select authority');

requireText(quarantine, 'PHASE-364-QUEST-ERIC-QUARANTINE-WATCH');
requireText(quarantine, 'SVR_PHASE364_SANITIZE_NPCS');
requireText(quarantine, 'window.setInterval(sweep, 260)');
requireText(quarantine, 'SVR_PHASE364_ERIC_QUARANTINE_SWEEP');

requireText(recovery, 'PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK');
requireText(recovery, 'window.SVR_PHASE364_SANITIZE_NPCS = repairNpcs');
requireText(recovery, 'svrPhase364Quarantined: false');
requireText(recovery, 'textureNpc(root)');
requireText(recovery, 'chooseUprightRotation(root)');
requireText(recovery, 'groundNpc(root)');

requireText(originalTable, 'PHASE-374-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK');
requireText(originalTable, "new URL('../assets/models/table.glb', import.meta.url).href", 'original-glb-primary');
requireText(originalTable, "new URL('../assets/table.fbx', import.meta.url).href", 'original-fbx-fallback');
requireText(originalTable, 'length: 2.734');
requireText(originalTable, 'height: 0.801');
requireText(originalTable, 'depth: 1.46');
requireText(originalTable, 'PHASE374_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY');
requireText(originalTable, 'removeCompetingTables()');

requireText(core, 'renderer.xr.setReferenceSpaceType("local-floor")');
requireText(core, 'optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"]');
forbidText(core, 'requiredFeatures:', 'required XR floor feature');

requireText(manifest, 'phase364_device_xr_geometry_spawn_lock.js');
requireText(manifest, 'phase364-quest-critical-load-order');
if (!/export const VERSION = 'phase3(?:6[4-9]|[7-9][0-9])'/.test(manifest)) throw new Error('Platform version regressed below Phase 364');
if (!/phase(?:364|365|367)-android-critical-load-order/.test(manifest)) throw new Error('Missing protected Android geometry load-order validator');

const questPhaseMatch = quest.match(/phase364_device_xr_geometry_spawn_lock\.js\?v=(phase\d+)/);
const questBootMatch = quest.match(/phase340_platform_core_loader\.js\?v=(phase\d+)/);
const phase361Match = quest.match(/phase361_quest_lobby_play_seat_watch_npc_lock\.js\?v=(phase\d+)/);
const quarantineMatch = quest.match(/phase364_quest_eric_quarantine_watch\.js\?v=(phase\d+)/);
const recoveryMatch = quest.match(/phase373_quest_seated_teleport_table_spawn_npc_lock\.js\?v=(phase\d+)/);
const originalMatch = quest.match(/phase374_original_table_authority_lock\.js\?v=(phase\d+)/);
if (!questPhaseMatch || !questBootMatch || !phase361Match || !quarantineMatch || !recoveryMatch || !originalMatch) throw new Error('Quest protected geometry, platform, lobby, quarantine, recovery, or original-table module missing');
const questPhaseIndex = quest.indexOf(questPhaseMatch[0]);
const questBootIndex = quest.indexOf(questBootMatch[0]);
const phase361Index = quest.indexOf(phase361Match[0]);
const quarantineIndex = quest.indexOf(quarantineMatch[0]);
const recoveryIndex = quest.indexOf(recoveryMatch[0]);
const originalIndex = quest.indexOf(originalMatch[0]);
if (originalIndex < 0 || questPhaseIndex <= originalIndex || questBootIndex <= questPhaseIndex) throw new Error('Original table and Phase 364 must load before platform boot');
if (phase361Index < 0 || quarantineIndex <= phase361Index || recoveryIndex <= quarantineIndex) throw new Error('Phase 373 recovery must load after the Phase 361 NPC and historical quarantine modules');
requireText(quest, 'PHASE-364-QUEST-XR-ENTRY-TABLE-FLOOR-SPAWN-LOCK');
requireText(quest, 'SVR_PHASE364_LOBBY_SPAWN');
requireText(quest, 'SVR_PHASE373_REPAIR_NPCS');
requireText(quest, 'SVR_PHASE373_STABLE_LOBBY');
requireText(quest, 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK', 'phase372-entry-successor');
requireText(quest, 'PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK', 'phase373-active-successor');
requireText(quest, 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK', 'phase374-physical-successor');
forbidText(quest, 'window.SVR_PHASE364_ERIC_QUARANTINE_SWEEP?.();', 'page-level-Eric-hide-call');

const androidPhaseMatch = android.match(/phase364_device_xr_geometry_spawn_lock\.js\?v=(phase\d+)/);
const androidBootMatch = android.match(/phase340_platform_core_loader\.js\?v=(phase\d+)/);
const androidOriginalMatch = android.match(/phase374_original_table_authority_lock\.js\?v=(phase\d+)/);
if (!androidPhaseMatch || !androidBootMatch || !androidOriginalMatch) throw new Error('Android original table, Phase 364 geometry, or platform loader missing');
const androidPhaseIndex = android.indexOf(androidPhaseMatch[0]);
const androidBootIndex = android.indexOf(androidBootMatch[0]);
const androidOriginalIndex = android.indexOf(androidOriginalMatch[0]);
if (androidOriginalIndex < 0 || androidPhaseIndex <= androidOriginalIndex || androidBootIndex <= androidPhaseIndex) throw new Error('Android original table and Phase 364 must load before platform boot');
requireText(android, 'SVR_PHASE364_ALIGN_TABLE');
requireText(android, 'PHASE-354-ANDROID-FULL-GAME-RELEASE-ACCEPTANCE-LOCK');
requireText(android, 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK', 'android-phase372-successor');
requireText(android, 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK', 'android-phase374-successor');

if (appManifest.apk_version_name !== '0.1.0-rc1' || appManifest.apk_version_code !== 1) throw new Error('APK lock changed');
if (appManifest.force_update || appManifest.show_update_prompt || !appManifest.manual_update_only) throw new Error('APK prompt policy changed');
if (Number(appManifest.phase || 0) < 364) throw new Error('Manifest phase regressed below 364');
const dimensions = appManifest.table_dimensions_meters || {};
if (Math.abs(Number(dimensions.length) - 2.734) > 0.006 || Math.abs(Number(dimensions.height) - 0.801) > 0.006 || Math.abs(Number(dimensions.depth) - 1.46) > 0.006) throw new Error('Original uploaded table dimensions changed');
if (!appManifest.one_table_authority_both_platforms || appManifest.generated_low_poly_table_is_visible_authority) throw new Error('Phase 374 original table authority policy missing');

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-364-PROTECTED-BY-PHASE-374',
  currentPlatformPhase: appManifest.phase,
  tableMeters: [dimensions.length, dimensions.height, dimensions.depth],
  tableAuthority: 'original uploaded GLB with FBX fallback',
  questSpawn: '0.90m outside south/front rail facing felt',
  xrEntry: 'single one-time lobby placement plus seated position safety recovery',
  xrLocalFloorRequired: false,
  historicalEricQuarantineModuleRetained: true,
  phase373EricRepairOverridesQuarantine: true,
  apk: `${appManifest.apk_version_name}/${appManifest.apk_version_code}`
}, null, 2));
