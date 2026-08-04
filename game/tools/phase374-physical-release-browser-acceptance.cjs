'use strict';

const { chromium } = require('playwright');

const BASE = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const ANDROID_URL = `${BASE}/game/android.html?channel=stable&v=phase374&acceptance=phase374`;
const QUEST_URL = `${BASE}/game/index.html?platform=quest&v=phase374&acceptance=phase374`;
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36';
const QUEST_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 OculusBrowser/37.0 MetaQuestBrowser/37.0 Quest 3 Safari/537.36';

async function waitFor(page, evaluator, timeout = 120000, diagnosticKey = '') {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeout) {
    try {
      last = await page.evaluate(evaluator);
      if (last) return last;
    } catch {}
    await page.waitForTimeout(250);
  }
  let diagnostic = null;
  if (diagnosticKey) {
    diagnostic = await page.evaluate((key) => window[key] || null, diagnosticKey).catch(() => null);
  }
  throw new Error(`Timed out: ${JSON.stringify({ last, diagnostic })}`);
}

function watch(page, base) {
  const result = { pageErrors: [], consoleErrors: [], httpErrors: [], requestFailures: [] };
  page.on('pageerror', (error) => result.pageErrors.push(String(error?.stack || error?.message || error)));
  page.on('console', (message) => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
  page.on('response', (response) => { if (response.url().startsWith(base) && response.status() >= 400) result.httpErrors.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', (request) => { if (request.url().startsWith(base)) result.requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`); });
  return result;
}

async function testAndroid(browser) {
  const context = await browser.newContext({ viewport: { width: 915, height: 412 }, userAgent: ANDROID_UA, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = watch(page, BASE);
  try {
    await page.goto(ANDROID_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    const lobby = await waitFor(page, () => {
      const table = window.SVR_PHASE374_ORIGINAL_TABLE_QA?.() || null;
      const ui = window.SVR_PHASE374_ANDROID_UI_QA?.() || null;
      const phase372 = window.SVR_PHASE372_QA?.() || null;
      const join = document.getElementById('svr372Primary');
      const diagnostic = {
        coreReady: window.SVR_PHASE372_CORE_READY,
        table,
        tableState: window.SVR_PHASE374_TABLE_STATE || null,
        ui,
        phase372,
        joinExists: Boolean(join),
        joinVisible: Boolean(join?.offsetParent),
        joinDisabled: Boolean(join?.disabled),
        joinText: join?.textContent || null,
        badge: Boolean(document.getElementById('svr374Badge')),
        logo: Boolean(document.getElementById('svr374TournamentLogo')),
        phase363: window.SVR_PHASE363_STATE || null
      };
      window.__SVR_PHASE374_ANDROID_LOBBY_DIAGNOSTIC = diagnostic;
      if (diagnostic.coreReady !== true || !table?.pass || !ui?.pass || !phase372?.pass) return null;
      if (!diagnostic.joinVisible || diagnostic.joinDisabled || !/JOIN TABLE/i.test(diagnostic.joinText || '')) return null;
      return { table, ui, phase372, badge: diagnostic.badge, logo: diagnostic.logo };
    }, 120000, '__SVR_PHASE374_ANDROID_LOBBY_DIAGNOSTIC');

    const card = await page.evaluate(async () => {
      const root = document.getElementById('svr347Community') || document.body;
      const element = document.createElement('div');
      element.id = 'svr374QaTenHeart';
      element.className = 'svr347-card svr347-community-card';
      element.textContent = 'T♥';
      root.appendChild(element);
      const started = performance.now();
      while (performance.now() - started < 5000 && !element.querySelector('.svr374-card-face')) await new Promise((resolve) => setTimeout(resolve, 60));
      return {
        rank: element.dataset.svr374Rank,
        suit: element.dataset.svr374Suit,
        corners: element.querySelectorAll('.svr374-card-corner').length,
        center: element.querySelector('.svr374-card-center')?.textContent,
        aria: element.getAttribute('aria-label')
      };
    });

    const joined = await page.evaluate(() => window.SVR_PHASE372_PRIMARY_ACTION?.());
    if (joined === false) throw new Error('Phase 374 Android JOIN rejected.');
    const seated = await waitFor(page, () => {
      const isJoined = Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE || window.SVR_PHASE363_STATE?.joined);
      const move = document.getElementById('svr347Move');
      const look = document.getElementById('svr347Look');
      const hidden = [move, look].every((control) => !control || getComputedStyle(control).display === 'none');
      const ui = window.SVR_PHASE374_ANDROID_UI_QA?.() || null;
      const table = window.SVR_PHASE374_ORIGINAL_TABLE_QA?.() || null;
      const diagnostic = {
        isJoined,
        phase363: window.SVR_PHASE363_STATE || null,
        joinedImmediate: window.SVR_PHASE363_JOINED_IMMEDIATE,
        hidden,
        moveDisplay: move ? getComputedStyle(move).display : null,
        lookDisplay: look ? getComputedStyle(look).display : null,
        ui,
        table,
        tableState: window.SVR_PHASE374_TABLE_STATE || null
      };
      window.__SVR_PHASE374_ANDROID_SEATED_DIAGNOSTIC = diagnostic;
      return isJoined && hidden && ui?.pass && table?.pass ? { hidden, ui, table } : null;
    }, 45000, '__SVR_PHASE374_ANDROID_SEATED_DIAGNOSTIC');

    await page.evaluate(() => window.SVR_PHASE363_LEAVE_TABLE?.('phase374-browser'));
    const returned = await waitFor(page, () => {
      window.SVR_PHASE372_SYNC_ANDROID_ENTRY?.('phase374-browser-return');
      const join = document.getElementById('svr372Primary');
      const diagnostic = {
        joined: Boolean(window.SVR_PHASE363_STATE?.joined),
        joinVisible: Boolean(join?.offsetParent),
        joinDisabled: Boolean(join?.disabled),
        joinText: join?.textContent || null
      };
      window.__SVR_PHASE374_ANDROID_RETURN_DIAGNOSTIC = diagnostic;
      return !diagnostic.joined && diagnostic.joinVisible && !diagnostic.joinDisabled ? true : null;
    }, 30000, '__SVR_PHASE374_ANDROID_RETURN_DIAGNOSTIC');

    const filteredConsole = errors.consoleErrors.filter((line) => !/favicon|WebGL|setPointerCapture|THREE\.WebGLRenderer/i.test(line));
    return {
      pass: lobby.badge && lobby.logo && card.rank === '10' && card.suit === 'hearts' && card.corners === 2 && card.center === '♥' && seated.hidden && returned === true && errors.pageErrors.length === 0 && filteredConsole.length === 0 && errors.httpErrors.length === 0 && errors.requestFailures.length === 0,
      lobby,
      card,
      seated,
      returned,
      errors: { ...errors, consoleErrors: filteredConsole }
    };
  } finally {
    await context.close();
  }
}

async function testQuest(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: QUEST_UA });
  const page = await context.newPage();
  const errors = watch(page, BASE);
  try {
    await page.goto(QUEST_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    const lobby = await waitFor(page, () => {
      const table = window.SVR_PHASE374_ORIGINAL_TABLE_QA?.() || null;
      const phase373 = window.SVR_PHASE373_QA?.() || null;
      const finalizer = window.SVR_PHASE373_FINALIZER_QA?.() || null;
      const diagnostic = {
        table,
        tableState: window.SVR_PHASE374_TABLE_STATE || null,
        phase373,
        finalizer,
        phase361: window.SVR_PHASE361_STATE || null,
        badge: Boolean(document.getElementById('svr374Badge'))
      };
      window.__SVR_PHASE374_QUEST_LOBBY_DIAGNOSTIC = diagnostic;
      if (!table?.pass || !phase373?.pass || !finalizer?.pass) return null;
      if (table.currentAuthority !== 'PHASE374_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY') return null;
      return { table, phase373, finalizer, badge: diagnostic.badge };
    }, 120000, '__SVR_PHASE374_QUEST_LOBBY_DIAGNOSTIC');

    const joinResult = await page.evaluate(() => window.SVR_PHASE361_PLAY_GAME?.());
    if (joinResult === false) throw new Error('Quest PLAY GAME rejected Phase 374 seat.');
    const seated = await waitFor(page, () => {
      window.SVR_PHASE373_STABLE_SEAT?.('phase374-browser');
      window.SVR_PHASE373_FINALIZE_SEAT?.('phase374-browser');
      const qa = window.SVR_PHASE373_QA?.() || null;
      const table = window.SVR_PHASE374_ORIGINAL_TABLE_QA?.() || null;
      const flags = qa?.teleportFlags || {};
      const locked = Object.keys(flags).length >= 4 && Object.values(flags).every((value) => value === false);
      const diagnostic = {
        seated: window.SVR_PHASE361_STATE?.seated,
        qa,
        table,
        tableState: window.SVR_PHASE374_TABLE_STATE || null,
        flags,
        locked
      };
      window.__SVR_PHASE374_QUEST_SEATED_DIAGNOSTIC = diagnostic;
      return diagnostic.seated && qa?.teleportFlagsLocked && locked && table?.pass ? { qa, table, locked } : null;
    }, 45000, '__SVR_PHASE374_QUEST_SEATED_DIAGNOSTIC');

    const prohibited = await page.evaluate(() => {
      const rig = window.SVR_TELEPORT_RIG_REF;
      const before = window.SVR_PHASE373_QA?.().blockedRigMoves || 0;
      let result = null;
      if (typeof rig?.setPlayerPose === 'function') result = rig.setPlayerPose(99, 0, 99);
      else if (typeof rig?.teleportTo === 'function') result = rig.teleportTo(99, 0, 99);
      return { before, result };
    });
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => window.SVR_PHASE373_QA?.().blockedRigMoves || 0);

    await page.evaluate(() => window.SVR_PHASE361_LEAVE_TABLE?.());
    const standing = await waitFor(page, () => {
      const post = window.SVR_PHASE373_POSTFLIGHT_QA?.() || null;
      const diagnostic = { seated: window.SVR_PHASE361_STATE?.seated, post };
      window.__SVR_PHASE374_QUEST_STANDING_DIAGNOSTIC = diagnostic;
      return diagnostic.seated === false && post?.pass && post?.standingRestored ? post : null;
    }, 30000, '__SVR_PHASE374_QUEST_STANDING_DIAGNOSTIC');

    const filteredConsole = errors.consoleErrors.filter((line) => !/favicon|WebXR.*not available|immersive-vr|THREE\.WebGLRenderer/i.test(line));
    return {
      pass: lobby.badge && seated.locked && after > prohibited.before && standing.standingRestored && errors.pageErrors.length === 0 && filteredConsole.length === 0 && errors.httpErrors.length === 0 && errors.requestFailures.length === 0,
      lobby,
      seated,
      prohibited,
      blockedAfter: after,
      standing,
      errors: { ...errors, consoleErrors: filteredConsole }
    };
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
  try {
    const android = await testAndroid(browser);
    const quest = await testQuest(browser);
    const report = {
      build: 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK',
      android,
      quest,
      pass: android.pass && quest.pass,
      checkedAt: new Date().toISOString()
    };
    console.log(JSON.stringify(report, null, 2));
    if (!report.pass) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});