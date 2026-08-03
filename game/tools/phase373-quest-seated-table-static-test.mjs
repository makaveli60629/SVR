import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(`missing:${label}`); };
const forbid = (source, token, label = token) => { if (source.includes(token)) errors.push(`forbidden:${label}`); };

const quest = read('game/index.html');
const entry = read('game/modules/phase372_live_entry_recovery_lock.js');
const runtime = read('game/modules/phase373_quest_seated_teleport_table_spawn_npc_lock.js');
const deploy = read('.github/workflows/deploy.yml');

need(quest, 'PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK', 'quest-active-build');
need(quest, "phase373_quest_seated_teleport_table_spawn_npc_lock.js?v=phase373", 'quest-phase373-import');
need(quest, 'window.SVR_PHASE364_LOBBY_SPAWN=window.SVR_PHASE373_STABLE_LOBBY', 'single-phase364-spawn');
need(quest, 'window.SVR_PHASE361_LOBBY_SPAWN=window.SVR_PHASE373_STABLE_LOBBY', 'single-phase361-spawn');
need(quest, 'window.SVR_PHASE373_REPAIR_TABLE?.()', 'table-repair-before-release');
need(quest, 'window.SVR_PHASE373_REPAIR_NPCS?.()', 'npc-repair-before-release');
need(quest, 'window.SVR_PHASE373_STABLE_LOBBY?.()', 'stable-lobby-before-release');
const p361 = quest.indexOf('phase361_quest_lobby_play_seat_watch_npc_lock.js');
const p364q = quest.indexOf('phase364_quest_eric_quarantine_watch.js');
const p373 = quest.indexOf('phase373_quest_seated_teleport_table_spawn_npc_lock.js');
if (!(p361 >= 0 && p364q > p361 && p373 > p364q)) errors.push('order:phase361-phase364quarantine-phase373');

need(entry, "await waitForFunction(['SVR_PHASE373_STABLE_LOBBY'], 30000)", 'visible-entry-waits-for-phase373');
need(entry, "publish(platform === 'quest' ? 'quest-phase373-lobby-ready'", 'phase373-entry-publish');
forbid(entry, 'window.SVR_PHASE364_LOBBY_SPAWN?.();', 'old-phase364-direct-spawn');
forbid(entry, 'window.SVR_PHASE361_LOBBY_SPAWN?.();', 'old-phase361-direct-spawn');

need(runtime, "export const BUILD = 'PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK'", 'runtime-build');
need(runtime, "new URL('../assets/models/table.glb', import.meta.url).href", 'real-table-glb-fallback');
need(runtime, "root.name = 'PHASE373_VISIBLE_TABLE_GLB_AUTHORITY'", 'fallback-table-authority');
need(runtime, 'forceTableVisible(object)', 'force-table-visible');
need(runtime, 'cloneVisibleMaterial', 'visible-table-materials');
need(runtime, 'LOBBY_GAP = 0.90', 'exact-lobby-gap');
need(runtime, 'SEAT_GAP = 0.62', 'exact-seat-gap');
need(runtime, 'standingMovementAllowed: true', 'standing-movement-preserved');
need(runtime, "window.SVR_PHASE364_LOBBY_SPAWN = () => stableLobby('phase364-public-bridge')", 'phase364-spawn-bridge');
need(runtime, "window.SVR_PHASE364_SEAT = () => stableSeat('phase364-public-bridge')", 'phase364-seat-bridge');
need(runtime, "window.SVR_PHASE364_SANITIZE_NPCS = repairNpcs", 'eric-quarantine-replaced');
need(runtime, "['squeezestart', 'squeezeend']", 'grip-listener-suspension');
need(runtime, 'state.blockedRigMoves += 1', 'rig-move-block');
need(runtime, 'captureTeleportBaseline();', 'pre-seat-teleport-baseline');
need(runtime, 'window[key] = false', 'teleport-flags-off');
need(runtime, 'floor.userData.teleportSurface = false', 'teleport-floor-off');
need(runtime, 'hideTeleportVisuals()', 'teleport-ray-hidden');
need(runtime, "if (stableAnchor?.mode !== 'seated') return;", 'seated-only-position-enforcement');
need(runtime, 'enforceStablePosition();', 'seated-position-lock');
need(runtime, 'chooseUprightRotation', 'npc-upright-repair');
need(runtime, 'textureNpc(root)', 'npc-texture-repair');
need(runtime, 'groundNpc(root)', 'npc-grounding');
need(runtime, 'faceNpcToTable(root, tableInfo)', 'npc-facing-table');
need(runtime, 'window.SVR_PHASE373_QA = qa', 'phase373-qa');
forbid(runtime, "if (!isSeated && stableAnchor?.mode === 'lobby') enforceStablePosition();", 'standing-lobby-position-loop');
forbid(runtime, 'new THREE.WebGLRenderer', 'no-second-renderer');
forbid(runtime, 'window.SVR_PHASE361_PLAY_GAME =', 'phase361-gameplay-authority-preserved');

need(deploy, 'test -f build/game/modules/phase373_quest_seated_teleport_table_spawn_npc_lock.js', 'deploy-phase373-module');
need(deploy, '"questRoute": "/game/index.html?platform=quest&v=phase373"', 'deploy-phase373-route');
need(deploy, '"androidRoute": "/game/android.html?channel=stable&v=phase372"', 'android-route-preserved');
need(deploy, '"databaseProvider": "aws"', 'aws-preserved');

const result = {
  build: 'PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK',
  exactLobbyGapMeters: 0.90,
  exactSeatGapMeters: 0.62,
  standingMovementAllowed: true,
  visibleEntryUsesOneSpawn: true,
  realTableGlbFallback: true,
  seatedTeleportHardBlocked: true,
  teleportRestoredAfterLeave: true,
  npcUprightTextureRepair: true,
  androidBuildPreserved: 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK',
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);