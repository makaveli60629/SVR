'use strict';

const { chromium } = require('playwright');

const BASE = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const URL = `${BASE}/game/android.html?channel=stable&manual=1&v=phase372`;
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/132.0 Mobile Safari/537.36';

async function tap(locator) {
  try {
    await locator.tap({ force: true, timeout: 15000 });
  } catch {
    await locator.click({ force: true, timeout: 15000 });
  }
}

async function waitFor(page, evaluator, timeout = 120000) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeout) {
    try {
      last = await page.evaluate(evaluator);
      if (last) return last;
    } catch {}
    await page.waitForTimeout(250);
  }
  throw new Error(`Timed out waiting for Android showdown state: ${JSON.stringify(last)}`);
}

async function joinPhase372(page, reason) {
  await page.evaluate((value) => window.SVR_PHASE372_SYNC_ANDROID_ENTRY?.(value), reason);
  await page.waitForFunction(() => {
    const button = document.getElementById('svr372Primary');
    const phase372 = window.SVR_PHASE372_QA?.();
    const join = window.SVR_PHASE363_JOIN_CONTROL_QA?.();
    return window.SVR_PHASE372_CORE_READY === true
      && Boolean(button?.offsetParent)
      && button.disabled === false
      && /JOIN TABLE/i.test(button.textContent || '')
      && phase372?.pass === true
      && phase372?.primaryVisible === true
      && join?.pass === true
      && join?.authorityId === 'svr372Primary'
      && join?.visibleJoinControls === 1;
  }, null, { timeout: 120000 });
  await tap(page.locator('#svr372Primary'));
  return 'phase372-visible-entry';
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: ANDROID_UA,
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const httpErrors = [];
  const requestFailures = [];

  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error?.message || error)));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('response', (response) => {
    if (response.url().startsWith(BASE) && response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(BASE)) requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`);
  });

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    const lobby = await waitFor(page, () => {
      const button = document.getElementById('svr372Primary');
      const legacy = document.querySelector('#svr347Actions [data-ui="seat"]');
      const phase372 = window.SVR_PHASE372_QA?.();
      const join = window.SVR_PHASE363_JOIN_CONTROL_QA?.();
      const table = window.SVR_PHASE363_TABLE_QA?.();
      const result = {
        coreReady: window.SVR_PHASE372_CORE_READY === true,
        joined: Boolean(window.SVR_PHASE363_STATE?.joined || window.SVR_PHASE363_JOINED_IMMEDIATE),
        gameState: window.SVR_PHASE363_STATE?.gameState || null,
        phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
        phase372,
        join,
        table,
        phase372EntryVisible: Boolean(button?.offsetParent),
        legacySeatHidden: Boolean(legacy?.hidden || legacy?.inert || legacy?.getAttribute('aria-hidden') === 'true' || !legacy?.offsetParent)
      };
      return result.coreReady
        && !result.joined
        && result.gameState === 'LOBBY'
        && result.phase === 'idle'
        && result.phase372?.pass === true
        && result.phase372?.primaryVisible === true
        && result.join?.pass === true
        && result.join?.authorityId === 'svr372Primary'
        && result.join?.visibleJoinControls === 1
        && result.table?.pass === true
        && result.phase372EntryVisible
        && result.legacySeatHidden
        ? result : null;
    });

    const firstJoinSurface = await joinPhase372(page, 'phase357-first-join');
    const seated = await waitFor(page, () => {
      window.SVR_PHASE364_ANDROID_SEAT?.(true);
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const phase357 = window.SVR_PHASE357_QA?.();
      const phase364 = window.SVR_PHASE364_QA?.();
      const legacy = document.querySelector('#svr347Actions [data-ui="seat"]');
      const result = {
        joined: Boolean(window.SVR_PHASE363_STATE?.joined && window.SVR_PHASE363_JOINED_IMMEDIATE),
        phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
        holeCards: Number(audit?.players?.[0]?.hand?.length || 0),
        phase357,
        phase364,
        legacyLeaveVisible: Boolean(legacy?.offsetParent) && (legacy?.textContent || '').trim() === 'LEAVE TABLE',
        phase372EntryVisible: Boolean(document.getElementById('svr372Primary')?.offsetParent)
      };
      return result.joined
        && result.phase === 'preflop'
        && result.holeCards === 2
        && result.phase357?.seated === true
        && result.phase364?.tablePass === true
        && result.phase364?.androidJoined === true
        && result.legacyLeaveVisible
        && !result.phase372EntryVisible
        ? result : null;
    }, 45000);

    const compatibilityHand = await page.evaluate(() => window.SVR_PHASE355_RUN_FULL_HAND_QA({ maxHands: 1, timeoutMs: 90000 }));
    const record = compatibilityHand?.record || {};
    if (!compatibilityHand?.pass
        || Number(record.compatibilityExpectedTableBankroll || 0) !== 6000
        || Number(record.actualExpectedTableBankroll || record.expectedTableBankroll || 0) !== 90000
        || Number(record.totalStacks || 0) !== Number(record.actualExpectedTableBankroll || record.expectedTableBankroll || 0)
        || record.protectedProductionBankrollPreserved !== true
        || Number(record.settledPot || 0) <= 0) {
      throw new Error(`Phase 355 protected-bankroll hand failed: ${JSON.stringify(compatibilityHand)}`);
    }

    const showdown = await waitFor(page, () => {
      const panel = document.getElementById('svr357Showdown');
      const result = {
        phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
        title: document.getElementById('svr357ResultTitle')?.textContent || '',
        pot: document.getElementById('svr357ResultPot')?.textContent || '',
        winners: document.getElementById('svr357WinnerDetails')?.textContent || '',
        board: document.getElementById('svr357Board')?.textContent || '',
        betIndicators: document.querySelectorAll('.svr357Bet').length,
        phase357: window.SVR_PHASE357_QA?.() || null,
        phase364: window.SVR_PHASE364_QA?.() || null
      };
      return result.phase === 'showdown'
        && panel?.hidden === false
        && /WIN|WINS/i.test(result.title)
        && /POT SETTLED:/i.test(result.pot)
        && /WINNING CARDS:/i.test(result.winners)
        && /BOARD:/i.test(result.board)
        ? result : null;
    }, 30000);

    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    const lobbyAfterLeave = await waitFor(page, () => {
      window.SVR_PHASE372_SYNC_ANDROID_ENTRY?.('phase357-after-leave');
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const consistency = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const join = window.SVR_PHASE363_JOIN_CONTROL_QA?.();
      const phase372 = window.SVR_PHASE372_QA?.();
      const legacy = document.querySelector('#svr347Actions [data-ui="seat"]');
      const handsCleared = (audit?.players || []).every((player) => Array.isArray(player.hand) && player.hand.length === 0);
      const result = {
        joined: Boolean(window.SVR_PHASE363_STATE?.joined || window.SVR_PHASE363_JOINED_IMMEDIATE),
        gameState: window.SVR_PHASE363_STATE?.gameState || null,
        phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
        consistency,
        join,
        phase372,
        handsCleared,
        phase372EntryVisible: Boolean(document.getElementById('svr372Primary')?.offsetParent),
        legacySeatHidden: Boolean(legacy?.hidden || legacy?.inert || legacy?.getAttribute('aria-hidden') === 'true' || !legacy?.offsetParent)
      };
      return !result.joined
        && result.gameState === 'LOBBY'
        && result.phase === 'idle'
        && result.handsCleared
        && result.consistency?.lobbyCardsCleared === true
        && result.join?.pass === true
        && result.join?.authorityId === 'svr372Primary'
        && result.join?.visibleJoinControls === 1
        && result.phase372?.pass === true
        && result.phase372EntryVisible
        && result.legacySeatHidden
        ? result : null;
    }, 30000);

    const rejoinSurface = await joinPhase372(page, 'phase357-fresh-rejoin');
    const freshRejoin = await waitFor(page, () => {
      window.SVR_PHASE364_ANDROID_SEAT?.(true);
      const state = window.SVR_PHASE336_POKER_STATE;
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const consistency = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const phase357 = window.SVR_PHASE357_QA?.();
      const phase364 = window.SVR_PHASE364_QA?.();
      const legacy = document.querySelector('#svr347Actions [data-ui="seat"]');
      const result = {
        joined: Boolean(window.SVR_PHASE363_STATE?.joined && window.SVR_PHASE363_JOINED_IMMEDIATE),
        gameState: window.SVR_PHASE363_STATE?.gameState || null,
        handNo: Number(state?.handNo || 0),
        phase: state?.phase || null,
        holeCards: Number(audit?.players?.[0]?.hand?.length || 0),
        consistency,
        phase357,
        phase364,
        legacyLeaveVisible: Boolean(legacy?.offsetParent) && (legacy?.textContent || '').trim() === 'LEAVE TABLE',
        phase372EntryVisible: Boolean(document.getElementById('svr372Primary')?.offsetParent)
      };
      return result.joined
        && result.gameState === 'SEATED'
        && result.handNo === 1
        && result.phase === 'preflop'
        && result.holeCards === 2
        && result.legacyLeaveVisible
        && !result.phase372EntryVisible
        && Number(result.consistency?.effectiveTableChips || 0) === 90000
        && Number(result.consistency?.expectedTableChips || 0) === 90000
        && result.consistency?.pass === true
        && result.phase357?.seated === true
        && result.phase364?.tablePass === true
        && result.phase364?.androidJoined === true
        ? result : null;
    }, 45000);

    const filteredConsole = consoleErrors.filter((line) => !/favicon|WebXR.*not available|THREE\.WebGLRenderer/i.test(line));
    const filteredFailures = requestFailures.filter((line) => !/favicon/i.test(line));
    const pass = firstJoinSurface === 'phase372-visible-entry'
      && rejoinSurface === 'phase372-visible-entry'
      && lobby.coreReady
      && seated.phase357.seated === true
      && seated.phase364.tablePass === true
      && compatibilityHand.pass === true
      && showdown.phase357.seated === true
      && showdown.phase364.tablePass === true
      && showdown.betIndicators === 6
      && lobbyAfterLeave.consistency?.pass === true
      && freshRejoin.consistency?.pass === true
      && pageErrors.length === 0
      && filteredConsole.length === 0
      && httpErrors.length === 0
      && filteredFailures.length === 0;

    const report = {
      pass,
      build: 'PHASE-357-PROTECTED-BY-PHASE-372-PRODUCTION-BANKROLL-ACCEPTANCE',
      url: URL,
      firstJoinSurface,
      rejoinSurface,
      lobby,
      seated,
      compatibilityHand,
      showdown,
      lobbyAfterLeave,
      freshRejoin,
      bankrollAuthorities: {
        compatibilityPolicy: 6000,
        protectedProductionTable: 90000
      },
      pageErrors,
      consoleErrors: filteredConsole,
      httpErrors,
      requestFailures: filteredFailures,
      checkedAt: new Date().toISOString()
    };
    console.log(JSON.stringify(report, null, 2));
    if (!pass) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});