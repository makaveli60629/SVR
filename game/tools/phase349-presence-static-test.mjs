import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const runtime = read('game/modules/phase349_multiplayer_presence_seat_reconnect_lock.js');
const seatBridge = read('game/modules/phase349_presence_gameplay_seat_bridge.js');
const platform = read('game/modules/phase340_platform_manifest.js');
const server = read('backend/phase349/src/server.js');
const schema = read('backend/phase349/sql/001_phase349_presence_seat_leases.sql');
const config = JSON.parse(read('site/config/player-api.json'));
const manifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const errors = [];
const requireText = (source, text, label) => { if (!source.includes(text)) errors.push(label); };

requireText(runtime, "const BUILD = 'PHASE-349-MULTIPLAYER-PRESENCE-SEAT-RECONNECT-LOCK'", 'runtime-build');
requireText(runtime, "transport = apiBase && accountState.mode === 'api' ? 'api-rest' : 'local-simulation'", 'transport-truth');
requireText(runtime, 'pokerStateSynchronized: false', 'poker-authority-disclaimer');
requireText(runtime, 'new BroadcastChannel(CHANNEL_NAME)', 'broadcast-channel-simulation');
requireText(runtime, 'newest.set(item.playerId', 'duplicate-player-deduplication');
requireText(runtime, 'window.SVR_PHASE349_CLAIM_SEAT', 'seat-claim-api');
requireText(runtime, 'window.SVR_PHASE349_RELEASE_SEAT', 'seat-release-api');
requireText(runtime, 'PHASE349_REMOTE_PLAYER_PRESENCE_ROOT', 'remote-presence-root');
requireText(runtime, 'const REMOTE_LIMIT', 'remote-budget');
requireText(seatBridge, 'SVR_PHASE349_CLAIM_SEAT(0)', 'canonical-seat-zero-claim');
requireText(seatBridge, 'SVR_PHASE349_RELEASE_SEAT', 'gameplay-seat-release');

for (const token of [
  'phase349_multiplayer_presence_seat_reconnect_lock.js',
  'phase349_presence_gameplay_seat_bridge.js',
  'const SHARED_SOCIAL = [...ACCOUNT_ACTIVITY, ...INGAME_AVATAR, ...MULTIPLAYER_PRESENCE]',
  'const QUEST_DEFERRED = [...SHARED_SOCIAL]',
  'const ANDROID_DEFERRED =',
  '...SHARED_SOCIAL',
  'const presenceIndex = normalizedDeferred.findIndex',
  'presenceIndex <= avatarIndex',
  'phase356-quest-deferred-load-order'
]) requireText(platform, token, `platform-${token}`);

const platformVersion = Number(platform.match(/export const VERSION = 'phase(\d+)'/)?.[1] || 0);
if (platformVersion < 349) errors.push('platform-version-regressed');
const profileIndex = platform.indexOf("'modules/phase346_player_avatar_profile_bridge.js'");
const avatarIndex = platform.indexOf("'modules/phase348_ingame_player_avatar_presence_performance_lock.js'");
const presenceIndex = platform.indexOf("'modules/phase349_multiplayer_presence_seat_reconnect_lock.js'");
const bridgeIndex = platform.indexOf("'modules/phase349_presence_gameplay_seat_bridge.js'");
if (!(profileIndex >= 0 && avatarIndex > profileIndex && presenceIndex > avatarIndex && bridgeIndex > presenceIndex)) errors.push('presence-declaration-order');

const multiplayerBlock = platform.slice(platform.indexOf('const MULTIPLAYER_PRESENCE ='), platform.indexOf('const SHARED_SOCIAL ='));
if (!(multiplayerBlock.indexOf('phase349_presence_gameplay_seat_bridge.js') > multiplayerBlock.indexOf('phase349_multiplayer_presence_seat_reconnect_lock.js'))) errors.push('seat-bridge-order');
const camera3ManifestBlock = platform.slice(platform.indexOf('const CAMERA3 ='), platform.indexOf('function unique'));
if (camera3ManifestBlock.includes('phase349_multiplayer_presence_seat_reconnect_lock.js') || camera3ManifestBlock.includes('phase349_presence_gameplay_seat_bridge.js')) errors.push('camera3-presence-loaded');
const cameraValidation = platform.slice(platform.indexOf("if (value === 'camera3')"));
if (!cameraValidation.includes('phase349_multiplayer_presence_seat_reconnect_lock.js') || !cameraValidation.includes('phase349_presence_gameplay_seat_bridge.js')) errors.push('camera3-exclusion-validator');

requireText(server, "app.post('/api/presence/join'", 'server-join');
requireText(server, "app.post('/api/presence/heartbeat'", 'server-heartbeat');
requireText(server, "app.get('/api/presence/room/:roomId'", 'server-list');
requireText(server, "app.post('/api/presence/seat/claim'", 'server-seat-claim');
requireText(server, "app.post('/api/presence/seat/release'", 'server-seat-release');
requireText(server, "app.post('/api/presence/leave'", 'server-leave');
requireText(server, 'await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)', 'transactional-seat-claim');
requireText(server, 'jwt.verify', 'authenticated-presence');
requireText(schema, 'CREATE TABLE dbo.PlayerPresence', 'presence-table');
requireText(schema, 'PRIMARY KEY (RoomId, PlayerId)', 'one-player-per-room');
requireText(schema, 'CREATE TABLE dbo.PlayerSeatLeases', 'seat-lease-table');
requireText(schema, 'PRIMARY KEY(RoomId,SeatId)', 'one-owner-per-seat');
requireText(schema, 'CHECK(SeatId BETWEEN 0 AND 5)', 'six-seat-limit');

if (config.presenceApiBase !== '') errors.push('presence-api-prematurely-configured');
if (config.allowLocalPresenceSimulation !== true) errors.push('simulation-disabled');
if (Number(manifest.phase || 0) < 349) errors.push('manifest-phase-regressed');
if (!String(manifest.build || '').startsWith('PHASE-')) errors.push('manifest-build-missing');
const releasePhase = Number(String(release.currentGameBuild || '').match(/PHASE-(\d+)/)?.[1] || 0);
if (releasePhase < 355) errors.push('android-release-build-regressed');
if (!String(release.webEntry || '').includes('v=phase355')) errors.push('android-release-entry');
if (release.releaseReady !== false || release.apkUrl !== '') errors.push('unverified-apk-exposed');
if (release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) errors.push('apk-policy');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  protectedBuild: 'PHASE-349-MULTIPLAYER-PRESENCE-SEAT-RECONNECT-LOCK',
  globalBuild: manifest.build,
  androidReleaseBuild: release.currentGameBuild,
  platformVersion,
  transport: 'local-simulation-until-presenceApiBase-configured',
  authority: { presence: true, seats: true, pokerState: false },
  androidLoadPolicy: 'deferred-until-table-playable',
  questLoadPolicy: 'deferred-until-table-playable',
  camera3Excluded: true,
  apk: { version: release.apkVersionName, code: release.apkVersionCode, releaseReady: release.releaseReady }
}, null, 2));
