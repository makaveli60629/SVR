import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const root = read('index.html');
const site = read('site/index.html');
const hooks = read('site-public-hooks.js');
const androidLobby = read('game/android-lobby.html');
const android = read('game/android-stable.html');
const androidRedirect = read('game/android.html');
const androidPlay = read('game/android-play.html');
const quest = read('game/index.html');
const questTable = read('game/modules/phase379_quest_procedural_table_authority.js');
const originalTable = read('game/modules/phase380_original_table_authority_lock.js');
const tableWatchdog = read('game/modules/phase381_table_lobby_watchdog_lock.js');
const downloads = read('downloads/index.html');
const release = JSON.parse(read('game/android-release.json'));
const update = JSON.parse(read('update/app-version.json'));
const manifest = JSON.parse(read('manifest.webmanifest'));
const pwa = read('pwa-sw.js');
const sw = read('sw.js');

assert.match(root, /SVR Poker \| Public Launch Page/);
assert.match(root, /id="binary-rain"/);
assert.match(root, /Preview Site/);
assert.match(root, /Preview Game/);
assert.match(root, /data-svr-status="server"/);
assert.match(root, /data-svr-status="database"/);
assert.match(root, /data-svr-status="admin"/);
assert.match(root, /data-svr-status="ai"/);
assert.match(root, /data-svr-ask-ai/);
assert.doesNotMatch(root, /DOWNLOAD APK RC2/);

assert.match(site, /PHASE-380-PUBLIC-GAME-SITE-INTEGRITY-LOCK/);
assert.match(site, /PHASE-381-FULL-WEBSITE-HOMEPAGE-RESTORATION-LOCK/);
assert.match(site, /SVR Website/);
assert.match(site, /Live Lobby View/);
assert.match(site, /Open Android Lobby/);
assert.match(site, /Download APK/);
assert.match(site, /Ask AI Support/);
assert.match(hooks, /PHASE-381-PUBLIC-SERVER-DATABASE-ADMIN-AI-STATUS-LOCK/);
assert.match(hooks, /url\.pathname = '\/game\/android-lobby\.html'/);
assert.match(hooks, /Database Standby/);

assert.match(androidLobby, /PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK/);
assert.match(androidLobby, /ENTER VR LOBBY/);
assert.match(androidLobby, /phase363_android_integrated_lobby_audio_gyro_bankroll_lock\.js\?v=phase381/);
assert.match(androidLobby, /phase380_original_table_authority_lock\.js\?v=phase381/);
assert.match(androidLobby, /phase381_table_lobby_watchdog_lock\.js\?v=phase381/);
assert.match(androidLobby, /unlockSound\(\)/);
assert.match(androidLobby, /SVR_PHASE363_LEAVE_TABLE/);

assert.match(android, /PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK/);
assert.match(android, /PHASE-381-ANDROID-SOUND-COMPACT-LOGO-CARDS-LOCK/);
assert.match(android, /id="join"[^>]*>[\s\S]*JOIN NOW/);
assert.match(android, /No cards(?:, poker actions, or movement controls appear| are dealt) before (?:joining|you join)/);
assert.match(android, /function scoreFive\(cards\)/);
assert.match(android, /function bestHand\(cards\)/);
assert.match(android, /function burn\(\)/);
assert.match(android, /SVR card back/);
assert.match(android, /function tone\(/);
assert.doesNotMatch(android, /three\.module|type="module"|main\.js|>SIT<|>SEAT/);

assert.match(androidRedirect, /android-lobby\.html\?v=phase381/);
assert.match(androidPlay, /android-lobby\.html\?v=phase381/);
assert.match(quest, /PHASE-380-GAME-SITE-INTEGRITY-LOCK/);
assert.match(quest, /PHASE-381-SITE-LOBBY-RESTORATION-LOCK/);
assert.match(quest, /phase380_original_table_authority_lock\.js/);
assert.match(quest, /phase381_table_lobby_watchdog_lock\.js/);
assert.match(quest, /phase379_quest_procedural_table_authority\.js/);
assert.match(originalTable, /PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK/);
assert.match(originalTable, /if \(!table\.parent && worldRoot\(\)\?\.isObject3D\) worldRoot\(\)\.add\(table\)/);
assert.match(tableWatchdog, /PHASE-381-ANDROID-QUEST-LOBBY-TABLE-WATCHDOG-LOCK/);
assert.match(tableWatchdog, /SVR_PHASE381_TABLE_WATCHDOG_QA/);
assert.match(questTable, /PHASE-380-QUEST-PROCEDURAL-TABLE-FALLBACK-LOCK/);
assert.match(questTable, /PHASE379_PROCEDURAL_TABLE_AUTHORITY/);
assert.match(questTable, /FALLBACK_DELAY_MS = 10000/);
assert.match(questTable, /preferredOriginal/);
assert.match(questTable, /SVR_PHASE379_FORCE_TABLE/);

assert.match(downloads, /PHASE-380-APK-RC2-SAME-DOMAIN-DOWNLOAD-LOCK/);
assert.match(downloads, /PHASE-381-ANDROID-LOBBY-DOWNLOAD-ROUTE-LOCK/);
assert.match(downloads, /android-lobby\.html\?v=phase381/);
assert.match(downloads, /android-stable\.html\?v=phase381/);
assert.match(downloads, /DOWNLOAD APK RC2/);
assert.match(downloads, /RETURN TO WEBSITE HOME/);

assert.equal(release.webEntry, '/game/android-lobby.html?v=phase381');
assert.equal(release.lowPowerEntry, '/game/android-stable.html?v=phase381');
assert.equal(release.currentGameBuild, 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK');
assert.equal(release.lowPowerGameBuild, 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK');
assert.equal(release.questBuild, 'PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK');
assert.equal(release.tableWatchdogBuild, 'PHASE-381-ANDROID-QUEST-LOBBY-TABLE-WATCHDOG-LOCK');
assert.equal(release.forceUpdate, false);
assert.equal(release.showUpdatePrompt, false);
assert.equal(release.manualUpdateOnly, true);
assert.equal(update.androidLobbyUrl, '/game/android-lobby.html?v=phase381');
assert.equal(update.androidSafeUrl, '/game/android-stable.html?v=phase381');
assert.equal(update.gameUrl, '/game/index.html?platform=quest&v=phase381');
assert.equal(update.siteUrl, '/site/index.html?v=phase381');
assert.equal(update.fullWebsiteHomepage, true);
assert.equal(update.publicStatusLights, true);
assert.equal(update.aiOnlineWhenAdminOffline, true);
assert.equal(update.forceUpdate, false);
assert.equal(update.showUpdatePrompt, false);
assert.equal(manifest.start_url, '/?source=pwa-phase381');
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === '/site/index.html?v=phase381'));
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === '/game/android-lobby.html?v=phase381'));
assert.match(pwa, /phase381-site-lobby/);
assert.match(sw, /phase381-site-lobby-network/);

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-379-PRODUCTION-ACCEPTANCE-LOCK',
  successor: 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK',
  public: {
    matrixLaunchPage: true,
    statusLights: true,
    askAiSupport: true,
    apkTakeover: false
  },
  website: {
    fullHomepage: true,
    appDownloadIsButton: true,
    liveLobbyPreview: true
  },
  android: {
    lobbyFirst: true,
    lowPowerRecovery: true,
    cardsBeforeJoin: false,
    heavy3dExcludedFromLowPower: true,
    deterministicEvaluator: true,
    sound: true,
    logoCardBacks: true
  },
  quest: {
    originalUploadedTableFirst: true,
    continuousTableWatchdog: true,
    proceduralTableEmergencyOnly: true
  },
  pwa: { phase381NetworkAuthority: true },
  apk: { version: release.apkVersionName, code: release.apkVersionCode, ready: release.releaseReady, manualUpdateOnly: true },
  checkedAt: new Date().toISOString()
}, null, 2));
