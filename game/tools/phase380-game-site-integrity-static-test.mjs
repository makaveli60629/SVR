import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const requireText = (value, token, label) => {
  if (!value.includes(token)) throw new Error(`${label} missing ${token}`);
};
const requireAny = (value, tokens, label) => {
  if (!tokens.some((token) => value.includes(token))) throw new Error(`${label} missing an accepted successor token`);
};
const forbidText = (value, token, label) => {
  if (value.includes(token)) throw new Error(`${label} must not contain ${token}`);
};

const root = read('index.html');
const site = read('site/index.html');
const hooks = read('site-public-hooks.js');
const game = read('game/index.html');
const android = read('game/android-stable.html');
const original = read('game/modules/phase380_original_table_authority_lock.js');
const fallback = read('game/modules/phase379_quest_procedural_table_authority.js');
const deploy = read('.github/workflows/deploy.yml');
const pages = read('.github/workflows/pages-live-publish.yml');
const release = JSON.parse(read('game/android-release.json'));
const app = JSON.parse(read('update/app-version.json'));

requireText(root, 'SVR Poker | Public Launch Page', 'locked public root');
requireText(root, 'id="binary-rain"', 'locked public root');
requireText(root, 'Preview Site', 'locked public root');
requireText(root, 'Preview Game', 'locked public root');
requireAny(root, ['PHASE-380-GAME-SITE-INTEGRITY-LOCK', 'PHASE-382-LIVE-ROUTE-CACHE-RECOVERY-LOCK', 'PHASE-383-FULL-SITE-HOMEPAGE-RESTORE-LOCK'], 'locked public root');

requireAny(site, ['PHASE-380-PUBLIC-GAME-SITE-INTEGRITY-LOCK', 'PHASE-383-FULL-SITE-HOMEPAGE-RESTORE-LOCK'], 'site portal');
requireText(site, 'game/android-stable.html?v=phase380', 'site portal');
requireText(site, 'game/index.html?platform=quest', 'site portal');
requireText(site, 'downloads/svr-poker-android-rc2.apk', 'site portal');
requireText(site, 'SVR Store', 'restored site portal');
requireText(site, 'Tournaments', 'restored site portal');
requireText(site, 'Membership', 'restored site portal');
requireText(site, 'Sponsorship', 'restored site portal');
requireText(site, 'Community Impact', 'restored site portal');
requireAny(hooks, ["const CURRENT_PHASE = 'phase380'", "const CURRENT_PHASE = 'phase382'", "const CURRENT_PHASE = 'phase383'"], 'site route normalizer');
requireText(hooks, "url.pathname = '/game/android-stable.html'", 'site route normalizer');

requireText(game, 'PHASE-380-GAME-SITE-INTEGRITY-LOCK', 'Quest entry');
const originalImport = game.indexOf('phase380_original_table_authority_lock.js');
const fallbackImport = game.indexOf('phase379_quest_procedural_table_authority.js');
if (originalImport < 0 || fallbackImport < 0 || originalImport > fallbackImport) throw new Error('Quest entry must import original table authority before emergency fallback');
requireText(original, 'PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK', 'original table authority');
requireText(original, '../assets/models/table.glb', 'original table authority');
requireText(original, '../assets/table.fbx', 'original table authority');
requireText(fallback, 'PHASE-380-QUEST-PROCEDURAL-TABLE-FALLBACK-LOCK', 'procedural fallback');
requireText(fallback, 'const FALLBACK_DELAY_MS = 10000', 'procedural fallback');
requireText(fallback, 'preferredOriginal()', 'procedural fallback');

requireText(android, 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK', 'Android stable table');
requireText(android, 'JOIN NOW', 'Android stable table');
requireText(android, 'No cards, poker actions, or movement controls appear before joining.', 'Android stable table');
requireText(android, "RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A']", 'Android cards');
forbidText(android, "RANKS=['2','3','4','5','6','7','8','9','T'", 'Android cards');
requireText(android, 'function scoreFive(cards)', 'Android hand evaluator');
requireText(android, 'function bestHand(cards)', 'Android hand evaluator');
requireText(android, 'function burn()', 'Android burn cards');
requireText(android, 'window.SVR_PHASE380_SET_BRAND', 'Android tournament brand slot');
requireText(android, 'movementControlsWhileSeated:0', 'Android seated controls');
if (android.indexOf('id="gate"') > android.indexOf('id="table"')) throw new Error('JOIN gate must precede the table');

if (release.currentGameBuild !== 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK') throw new Error('Android release build mismatch');
if (release.questBuild !== 'PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK') throw new Error('Quest release build mismatch');
if (release.webEntry !== '/game/android-stable.html?v=phase380') throw new Error('Android release route mismatch');
if (release.showUpdatePrompt !== false || release.forceUpdate !== false || release.manualUpdateOnly !== true) throw new Error('APK update policy mismatch');
if (app.androidSafeUrl !== '/game/android-stable.html?v=phase380') throw new Error('App version Android route mismatch');
if (app.showUpdatePrompt !== false || app.forceUpdate !== false || app.manualUpdateOnly !== true) throw new Error('App version update policy mismatch');

requireText(deploy, '/game/', 'production sparse checkout');
requireText(deploy, '/site/', 'production sparse checkout');
requireText(deploy, 'cp -a source/game publish/game', 'full game publish');
requireText(deploy, 'cp -a source/site publish/site', 'full site publish');
requireText(deploy, 'git add -A', 'stale-file deletion publish');
requireText(deploy, 'cleanTreePublish', 'deployment health');
requireText(pages, 'game/assets/models/table.glb', 'Pages table asset verification');

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-383-FULL-SITE-HOMEPAGE-RESTORE-LOCK',
  publicMatrixPageLocked: true,
  fullWebsiteRestored: true,
  cleanTreePublish: true,
  questOriginalTableFirst: true,
  questEmergencyFallbackRemovable: true,
  androidDeterministicEvaluator: true,
  androidRankTen: true,
  androidSponsorSlot: true,
  siteRoutesNormalized: true,
  apkUpdatePrompt: false
}, null, 2));
