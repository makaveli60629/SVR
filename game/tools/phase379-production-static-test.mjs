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

assert.match(root, /PHASE-379-PUBLIC-ROOT-RECOVERY-LOCK/);
assert.match(root, /PLAY ANDROID — JOIN NOW/);
assert.match(site, /PHASE-379-PUBLIC-SITE-ANDROID-APK-QUEST-RECOVERY-LOCK/);
assert.match(site, /DOWNLOAD APK RC2/);
assert.match(android, /PHASE-379-ANDROID-STANDALONE-JOIN-NOW-LOCK/);
assert.match(android, /id="join"[^>]*>[\s\S]*JOIN NOW/);
assert.match(android, /No cards are dealt before you join/);
assert.doesNotMatch(android, /three\.module|type="module"|main\.js|>SIT<|>SEAT</);
assert.match(androidRedirect, /android-stable\.html\?v=phase379/);
assert.match(androidPlay, /android-stable\.html\?v=phase379/);
assert.match(quest, /PHASE-379-QUEST-TABLE-ANDROID-ROUTE-RECOVERY-LOCK/);
assert.match(quest, /phase379_quest_procedural_table_authority\.js/);
assert.match(questTable, /PHASE379_PROCEDURAL_TABLE_AUTHORITY/);
assert.match(questTable, /SVR_PHASE379_FORCE_TABLE/);
assert.match(downloads, /PHASE-379-APK-DOWNLOAD-INSTALL-CENTER-LOCK/);
assert.equal(release.webEntry, '/game/android-stable.html?v=phase379');
assert.equal(update.androidSafeUrl, '/game/android-stable.html?v=phase379');
assert.equal(manifest.start_url, '/?source=pwa-phase379');
assert.match(pwa, /phase379-fresh-routes/);
assert.match(sw, /phase379-network-authority/);

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-379-PRODUCTION-ACCEPTANCE-LOCK',
  android: { joinStatic: true, cardsBeforeJoin: false, heavy3dExcluded: true },
  quest: { proceduralTableFallback: true },
  apk: { version: release.apkVersionName, code: release.apkVersionCode, ready: release.releaseReady },
  checkedAt: new Date().toISOString()
}, null, 2));
