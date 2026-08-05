import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const root = read('index.html');
const site = read('site/index.html');
const android = read('game/android-stable.html');
const androidRedirect = read('game/android.html');
const androidPlay = read('game/android-play.html');
const quest = read('game/index.html');
const questTable = read('game/modules/phase379_quest_procedural_table_authority.js');
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
assert.match(root, /PHASE-(?:383-FULL-SITE-HOMEPAGE-RESTORE|382-LIVE-ROUTE-CACHE-RECOVERY|380-GAME-SITE-INTEGRITY)-LOCK/);
assert.match(site, /PHASE-(?:383-FULL-SITE-HOMEPAGE-RESTORE|379-PUBLIC-SITE-ANDROID-APK-QUEST-RECOVERY|380-PUBLIC-GAME-SITE-INTEGRITY)-LOCK/);
assert.match(site, /Download APK RC2/i);
assert.match(site, /SVR Store/);
assert.match(site, /Tournaments/);
assert.match(site, /Membership/);
assert.match(site, /Sponsorship/);
assert.match(site, /Community Impact/);
assert.match(android, /PHASE-(?:379-ANDROID-STANDALONE-JOIN-NOW|380-ANDROID-PLAYABLE-POKER-PRESENTATION)-LOCK/);
assert.match(android, /id="join"[^>]*>[\s\S]*JOIN NOW/);
assert.match(android, /No cards(?:, poker actions, or movement controls appear| are dealt) before (?:joining|you join)/);
assert.doesNotMatch(android, /three\.module|type="module"|main\.js|>SIT<|>SEAT</);
assert.match(androidRedirect, /android-stable\.html\?v=phase380/);
assert.match(androidPlay, /android-stable\.html\?v=phase380/);
assert.match(quest, /PHASE-380-GAME-SITE-INTEGRITY-LOCK/);
assert.match(quest, /phase380_original_table_authority_lock\.js/);
assert.match(quest, /phase379_quest_procedural_table_authority\.js/);
assert.match(questTable, /PHASE-380-QUEST-PROCEDURAL-TABLE-FALLBACK-LOCK/);
assert.match(questTable, /PHASE379_PROCEDURAL_TABLE_AUTHORITY/);
assert.match(questTable, /FALLBACK_DELAY_MS = 10000/);
assert.match(questTable, /preferredOriginal/);
assert.match(questTable, /SVR_PHASE379_FORCE_TABLE/);
assert.match(downloads, /PHASE-380-APK-RC2-SAME-DOMAIN-DOWNLOAD-LOCK/);
assert.match(downloads, /android-stable\.html\?v=phase380/);
assert.equal(release.webEntry, '/game/android-stable.html?v=phase380');
assert.equal(release.questBuild, 'PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK');
assert.equal(release.forceUpdate, false);
assert.equal(release.showUpdatePrompt, false);
assert.equal(release.manualUpdateOnly, true);
assert.equal(update.androidSafeUrl, '/game/android-stable.html?v=phase380');
assert.match(update.gameUrl, /^\/game\/index\.html\?platform=quest&v=phase(?:380|382)$/);
assert.equal(update.forceUpdate, false);
assert.equal(update.showUpdatePrompt, false);
assert.match(manifest.start_url, /^\/\?source=pwa-phase(?:380|382)(?:&v=phase382)?$/);
assert.match(pwa, /phase(?:380-clean-routes|382-live-route-recovery|383-full-site-homepage-restore)/);
assert.match(sw, /phase(?:380-network-authority|382-live-route-recovery|383-full-site-homepage-restore)/);

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-379-PRODUCTION-ACCEPTANCE-LOCK',
  successor: 'PHASE-383-FULL-SITE-HOMEPAGE-RESTORE-LOCK',
  fullWebsiteRestored: true,
  android: {
    joinStatic: true,
    cardsBeforeJoin: false,
    heavy3dExcluded: true,
    deterministicEvaluator: true,
    stableRouteLocked: true
  },
  quest: {
    originalUploadedTableFirst: true,
    proceduralTableEmergencyOnly: true,
    runtimeRoute: update.gameUrl
  },
  pwa: { currentStartUrl: manifest.start_url, cacheRecoveryAccepted: true },
  apk: { version: release.apkVersionName, code: release.apkVersionCode, ready: release.releaseReady, manualUpdateOnly: true },
  checkedAt: new Date().toISOString()
}, null, 2));
