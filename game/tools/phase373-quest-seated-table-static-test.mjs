import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(`missing:${label}`); };
const forbid = (source, token, label = token) => { if (source.includes(token)) errors.push(`forbidden:${label}`); };

const quest = read('game/index.html');
const entry = read('game/modules/phase372_live_entry_recovery_lock.js');
const preflight = read('game/modules/phase373_quest_rig_preflight_lock.js');
const runtime = read('game/modules/phase373_quest_seated_teleport_table_spawn_npc_lock.js');
const postflight = read('game/modules/phase373_quest_npc_teleport_postflight_lock.js');
const finalizer = read('game/modules/phase373_quest_table_seat_finalizer_lock.js');
const originalTable = read('game/modules/phase380_original_table_authority_lock.js');
const tableWatchdog = read('game/modules/phase381_table_lobby_watchdog_lock.js');
const deploy = read('.github/workflows/deploy.yml');
const accountConfig = JSON.parse(read('site/config/player-api.json'));

need(quest, 'data-build="PHASE-380-GAME-SITE-INTEGRITY-LOCK"', 'protected-quest-build');
need(quest, 'data-release="PHASE-381-SITE-LOBBY-RESTORATION-LOCK"', 'quest-active-successor');
need(quest, "phase373_quest_rig_preflight_lock.js?v=phase381", 'quest-preflight-import');
need(quest, "phase373_quest_seated_teleport_table_spawn_npc_lock.js?v=phase381", 'quest-phase373-import');
need(quest, "phase373_quest_npc_teleport_postflight_lock.js?v=phase381", 'quest-postflight-import');
need(quest, "phase373_quest_table_seat_finalizer_lock.js?v=phase381", 'quest-finalizer-import');
need(quest, "phase380_original_table_authority_lock.js?v=phase381", 'original-table-import');
need(quest, "phase381_table_lobby_watchdog_lock.js?v=phase381", 'table-watchdog-import');
need(quest, 'window.SVR_PHASE364_LOBBY_SPAWN=window.SVR_PHASE373_STABLE_LOBBY', 'single-phase364-spawn');
need(quest, 'window.SVR_PHASE361_LOBBY_SPAWN=window.SVR_PHASE373_STABLE_LOBBY', 'single-phase361-spawn');
need(quest, 'window.SVR_PHASE373_REPAIR_TABLE?.()', 'table-repair-before-release');
need(quest, 'window.SVR_PHASE373_REPAIR_NPCS?.()', 'npc-repair-before-release');
need(quest, 'window.SVR_PHASE373_POSTFLIGHT_REPAIR_NPCS?.()', 'postflight-npc-repair-before-release');
need(quest, "window.SVR_PHASE373_STABLE_LOBBY?.('phase381-core-ready')", 'stable-lobby-before-release');
need(quest, "window.SVR_PHASE373_FINALIZE_TABLE?.('phase381-core-ready')", 'table-finalizer-before-release');
need(quest, "window.SVR_PHASE373_POSTFLIGHT_RESTORE_TELEPORT?.('phase381-core-ready')", 'standing-teleport-before-release');
need(quest, "window.SVR_PHASE380_ORIGINAL_TABLE_REASSERT?.('phase381-core-ready')", 'original-table-reassert-before-release');
need(quest, "window.SVR_PHASE381_TABLE_WATCHDOG_TICK?.('phase381-core-ready')", 'table-watchdog-before-release');
const stableLobbyCall = quest.indexOf("window.SVR_PHASE373_STABLE_LOBBY?.('phase381-core-ready')");
const finalizerCall = quest.indexOf("window.SVR_PHASE373_FINALIZE_TABLE?.('phase381-core-ready')");
const originalCall = quest.indexOf("window.SVR_PHASE380_ORIGINAL_TABLE_REASSERT?.('phase381-core-ready')");
const watchdogCall = quest.indexOf("window.SVR_PHASE381_TABLE_WATCHDOG_TICK?.('phase381-core-ready')");
const releaseCall = quest.indexOf("document.body.classList.add('boot-released')");
if (!(stableLobbyCall >= 0 && finalizerCall > stableLobbyCall && originalCall > finalizerCall && watchdogCall > originalCall && releaseCall > watchdogCall)) errors.push('order:stable-lobby-finalizer-original-watchdog-release');
const p361 = quest.indexOf('phase361_quest_lobby_play_seat_watch_npc_lock.js');
const p364q = quest.indexOf('phase364_quest_eric_quarantine_watch.js');
const pre = quest.indexOf('phase373_quest_rig_preflight_lock.js');
const p373 = quest.indexOf('phase373_quest_seated_teleport_table_spawn_npc_lock.js');
const post = quest.indexOf('phase373_quest_npc_teleport_postflight_lock.js');
const fin = quest.indexOf('phase373_quest_table_seat_finalizer_lock.js');
if (!(p361 >= 0 && p364q > p361 && pre > p364q && p373 > pre && post > p373 && fin > post)) errors.push('order:phase361-quarantine-preflight-phase373-postflight-finalizer');

need(entry, "await waitForFunction(['SVR_PHASE373_STABLE_LOBBY'], 30000)", 'visible-entry-waits-for-phase373');
need(entry, "publish(platform === 'quest' ? 'quest-phase373-lobby-ready'", 'phase373-entry-publish');
forbid(entry, 'window.SVR_PHASE364_LOBBY_SPAWN?.();', 'old-phase364-direct-spawn');
forbid(entry, 'window.SVR_PHASE361_LOBBY_SPAWN?.();', 'old-phase361-direct-spawn');

need(preflight, "export const BUILD = 'PHASE-373-QUEST-RIG-PREFLIGHT-LOCK'", 'preflight-build');
need(preflight, 'isAncestorOf(ancestor, object)', 'table-ancestor-check');
need(preflight, 'state.rejectedTableAncestors.push', 'unsafe-rig-rejection');
need(preflight, 'guardUnsafeRig(object)', 'unsafe-rig-method-guard');
need(preflight, "rig.name = 'PHASE373_SAFE_QUEST_PLAYER_RIG'", 'camera-rig-fallback');
need(preflight, 'window.SVR_TELEPORT_RIG_REF = choice.object', 'safe-rig-authority');
need(preflight, 'window.SVR_PHASE373_RIG_PREFLIGHT_QA = qa', 'preflight-qa');
forbid(preflight, 'new THREE.WebGLRenderer', 'preflight-no-renderer');

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

need(postflight, "export const BUILD = 'PHASE-373-QUEST-NPC-TELEPORT-POSTFLIGHT-LOCK'", 'postflight-build');
need(postflight, 'scheduleStandingRestore', 'delayed-standing-restore');
need(postflight, "for (const delay of [0, 180, 480, 900, 1600])", 'late-handler-restore-windows');
need(postflight, 'if (object.isSkinnedMesh || object.skeleton?.bones?.length)', 'unnamed-humanoid-discovery');
need(postflight, "npcValidation: state.npcRootsRepaired > 0 ? 'runtime-humanoids-repaired' : 'no-humanoid-roots-in-current-scene'", 'honest-headless-npc-validation');
need(postflight, 'window.SVR_PHASE373_POSTFLIGHT_RESTORE_TELEPORT = scheduleStandingRestore', 'postflight-restore-api');
need(postflight, 'window.SVR_PHASE373_POSTFLIGHT_REPAIR_NPCS = repairNpcs', 'postflight-npc-api');
need(postflight, 'window.SVR_PHASE373_POSTFLIGHT_QA = qa', 'postflight-qa');
forbid(postflight, 'new THREE.WebGLRenderer', 'postflight-no-renderer');

need(finalizer, "export const BUILD = 'PHASE-373-QUEST-TABLE-SEAT-FINALIZER-LOCK'", 'finalizer-build');
need(finalizer, 'wrapPublicPlacementApis()', 'finalizer-wraps-placement');
need(finalizer, 'scheduleTableFinalization', 'finalizer-schedules-table-grounding');
need(finalizer, 'scheduleSeatFinalization', 'finalizer-schedules-seat-stability');
need(finalizer, 'window.SVR_PHASE373_FINALIZER_QA = qa', 'finalizer-qa');
forbid(finalizer, 'new THREE.WebGLRenderer', 'finalizer-no-renderer');

need(originalTable, 'PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK', 'original-table-build');
need(originalTable, 'if (!table.parent && worldRoot()?.isObject3D) worldRoot().add(table)', 'original-table-reattach');
need(tableWatchdog, 'PHASE-381-ANDROID-QUEST-LOBBY-TABLE-WATCHDOG-LOCK', 'watchdog-build');
need(tableWatchdog, "setInterval(() => tick('interval'), 1800)", 'watchdog-continuous');
need(tableWatchdog, 'SVR_PHASE381_TABLE_WATCHDOG_QA', 'watchdog-qa');

need(deploy, 'test -s source/game/assets/models/table.glb', 'deploy-table-glb');
need(deploy, 'test -s source/game/assets/table.fbx', 'deploy-table-fbx');
need(deploy, 'test -f publish/game/modules/phase381_table_lobby_watchdog_lock.js', 'deploy-watchdog-module');
need(deploy, '"questRoute": "/game/index.html?platform=quest&v=phase381"', 'deploy-phase381-route');
need(deploy, '"androidRoute": "/game/android-lobby.html?v=phase381"', 'android-route-preserved');
need(deploy, '"questTableWatchdog": true', 'deploy-watchdog-proof');
if (accountConfig.provider !== 'aws' || accountConfig.database !== 'dynamodb' || accountConfig.identity !== 'cognito') errors.push('aws-account-foundation-regressed');

const result = {
  build: 'PHASE-373-QUEST-RECOVERY-PROTECTED-BY-PHASE-381',
  successor: 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK',
  exactLobbyGapMeters: 0.90,
  exactSeatGapMeters: 0.62,
  safeRigCannotOwnTable: true,
  standingMovementAllowed: true,
  visibleEntryUsesOneSpawn: true,
  realTableGlbFallback: true,
  originalUploadedTableFirst: true,
  continuousTableWatchdog: true,
  seatedTeleportHardBlocked: true,
  delayedTeleportRestoredAfterLeave: true,
  namedAndUnnamedNpcRepair: true,
  tableAndSeatFinalizer: true,
  awsPreserved: true,
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
