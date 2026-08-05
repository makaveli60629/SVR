import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const account = read('site/js/phase366-player-account-resilience.js');
const persistence = read('site/js/phase345-demo-activity-persistence.js');
const watchdog = read('site/js/phase366-profile-live-camera-watchdog.js');
const profile = read('site/profile.html');
const hooks = read('site-public-hooks.js');
const vrRoom = read('game/avatar-vr.html');
const vrRuntime = read('game/modules/phase353_vr_avatar_dressing_room_live_pedestal_lock.js');
const androidRelease = JSON.parse(read('game/android-release.json'));

const profileUsesSupportedCache = (
  profile.includes('phase345-demo-activity-persistence.js?v=phase366')
  || profile.includes('phase345-demo-activity-persistence.js?v=phase374')
) && (
  profile.includes('phase351-profile-showroom.js?v=phase366')
  || profile.includes('phase351-profile-showroom.js?v=phase374')
);
const profileHasLiveCameraUi = (
  profile.includes('SVR Profile Live Camera')
  || profile.includes('SVR Profile Camera')
) && profile.includes('profileShowroomCanvas');
const profileHasVrRoom = (
  profile.includes('../game/avatar-vr.html?v=phase366')
  || profile.includes('../game/avatar-vr.html?v=phase374')
  || profile.includes('../game/avatar-vr.html?v=phase380')
  || profile.includes('../game/avatar-vr.html?v=phase381')
);
const supportedApk = (
  (androidRelease.apkVersionName === '0.1.0-rc1' && androidRelease.apkVersionCode === 1)
  || (androidRelease.apkVersionName === '0.1.0-rc2' && androidRelease.apkVersionCode === 2)
) && androidRelease.forceUpdate === false
  && androidRelease.showUpdatePrompt === false
  && androidRelease.manualUpdateOnly === true;

const checks = {
  boundedAccountBootstrap: account.includes('ACCOUNT_BOOTSTRAP_TIMEOUT') && account.includes('4500'),
  localDemoRecovery: account.includes('svr_phase345_demo_player_v1') && account.includes('forceLocalResolution'),
  persistenceUsesPhase366: persistence.includes('phase366-player-account-resilience.js?v=phase366'),
  cameraWatchdogLoaded: persistence.includes('phase366-profile-live-camera-watchdog.js?v=phase366'),
  resolvedFallback: watchdog.includes('fallbackFinalized') && watchdog.includes('FALLBACK AVATAR CAM'),
  retryAuthority: watchdog.includes('SVR_PHASE366_PROFILE_LIVE_CAMERA_RETRY'),
  profileFreshCache: profileUsesSupportedCache,
  liveCameraUi: profileHasLiveCameraUi,
  vrDressingRoomLink: profileHasVrRoom,
  currentGameRouteNormalizer: hooks.includes("const CURRENT_PHASE = 'phase381'") && hooks.includes("url.pathname = '/game/android-lobby.html'"),
  vrRoomFreshCache: vrRoom.includes('phase353_vr_avatar_dressing_room_live_pedestal_lock.js?v=phase366') && vrRoom.includes('/site/profile.html?v=phase366'),
  webxrRoomPreserved: vrRuntime.includes('VRButton') && vrRuntime.includes('PHASE353_MOVING_PEDESTAL_ROOT') && vrRuntime.includes('renderer.xr.enabled = true'),
  apkLocked: supportedApk
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({
  build: 'PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK',
  successor: 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK',
  checks,
  failed,
  pass: failed.length === 0
}, null, 2));
if (failed.length) process.exit(1);
