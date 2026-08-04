'use strict';

const { chromium } = require('playwright');

const BASE = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const URL = `${BASE}/game/android.html?channel=stable&v=phase372&phase354compat=1`;
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36';

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
  throw new Error(`Timed out waiting for Android production state: ${JSON.stringify(last)}`);
}

async function joinThroughPhase372(page) {
  await page.evaluate(() => window.SVR_PHASE372_SYNC_ANDROID_ENTRY?.('phase354-production-acceptance'));
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
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.url().startsWith(BASE) && response.status() >= 400) {
      httpErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(BASE)) {
      requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`);
    }
  });

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    const lobby = await waitFor(page, () => {
      const phase372 = window.SVR_PHASE372_QA?.();
      const join = window.SVR_PHASE363_JOIN_CONTROL_QA?.();
      const table = window.SVR_PHASE363_TABLE_QA?.();
      const consistency = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const legacy = document.querySelector('#svr347Actions [data-ui="seat"]');
      const button = document.getElementById('svr372Primary');
      const result = {
        coreReady: window.SVR_PHASE372_CORE_READY === true,
        joined: Boolean(window.SVR_PHASE363_STATE?.joined || window.SVR_PHASE363_JOINED_IMMEDIATE),
        gameState: window.SVR_PHASE363_STATE?.gameState || null,
        phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
        phase372,
        join,
        table,
        consistency,
        phase372EntryVisible: Boolean(button?.offsetParent),
        phase372EntryEnabled: Boolean(button && !button.disabled && /JOIN TABLE/i.test(button.textContent || '')),
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
        && result.phase372EntryEnabled
        && result.legacySeatHidden
        ? result : null;
    });

    const firstJoinSurface = await joinThroughPhase372(page);
    const seated = await waitFor(page, () => {
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const legacy = document.querySelector('#svr347Actions [data-ui="seat"]');
      const join = window.SVR_PHASE363_JOIN_CONTROL_QA?.();
      const result = {
        joined: Boolean(window.SVR_PHASE363_STATE?.joined && window.SVR_PHASE363_JOINED_IMMEDIATE),
        gameState: window.SVR_PHASE363_STATE?.gameState || null,
        phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
        handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
        holeCards: Number(audit?.players?.[0]?.hand?.length || 0),
        legacyLeaveVisible: Boolean(legacy?.offsetParent) && (legacy?.textContent || '').trim() === 'LEAVE TABLE',
        phase372EntryVisible: Boolean(document.getElementById('svr372Primary')?.offsetParent),
        join,
        audit
      };
      return result.joined
        && result.gameState === 'SEATED'
        && result.phase === 'preflop'
        && result.holeCards === 2
        && result.legacyLeaveVisible
        && !result.phase372EntryVisible
        && result.join?.pass === true
        ? result : null;
    }, 45000);

    const hand = await page.evaluate(() => window.SVR_PHASE355_RUN_FULL_HAND_QA({ maxHands: 1, timeoutMs: 90000 }));
    if (!hand?.pass) throw new Error(`Complete-hand driver failed: ${JSON.stringify(hand)}`);

    const showdown = await waitFor(page, () => {
      const state = window.SVR_PHASE336_POKER_STATE;
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const result = {
        phase: state?.phase || null,
        handNo: Number(state?.handNo || 0),
        community: Number(state?.community?.length || 0),
        burn: Number(state?.burn?.length || 0),
        settledPot: Number(state?.settledPot || 0),
        winners: Array.isArray(state?.winners) ? state.winners : [],
        totalStacks: (audit?.players || []).reduce((sum, player) => sum + Number(player.stack || 0), 0),
        expectedDriverBankroll: Number(hand?.record?.expectedTableBankroll || 0),
        driverTotalStacks: Number(hand?.record?.totalStacks || 0),
        resultTitle: document.getElementById('svr357ResultTitle')?.textContent || '',
        resultPot: document.getElementById('svr357ResultPot')?.textContent || '',
        winnerDetails: document.getElementById('svr357WinnerDetails')?.textContent || '',
        board: document.getElementById('svr357Board')?.textContent || '',
        phase354: window.SVR_PHASE354_QA?.() || null
      };
      return result.phase === 'showdown'
        && result.community === 5
        && result.burn === 3
        && result.settledPot > 0
        && result.winners.length > 0
        && result.expectedDriverBankroll > 0
        && result.driverTotalStacks === result.expectedDriverBankroll
        && /WIN|WINS/i.test(result.resultTitle)
        && /POT SETTLED:/i.test(result.resultPot)
        && /WINNING CARDS:/i.test(result.winnerDetails)
        && /BOARD:/i.test(result.board)
        ? result : null;
    }, 30000);

    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    const lobbyAfterLeave = await waitFor(page, () => {
      window.SVR_PHASE372_SYNC_ANDROID_ENTRY?.('phase354-after-leave');
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
        handsCleared,
        consistency,
        join,
        phase372,
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

    const rejoinSurface = await joinThroughPhase372(page);
    const freshRejoin = await waitFor(page, () => {
      const state = window.SVR_PHASE336_POKER_STATE;
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const consistency = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const table = window.SVR_PHASE363_TABLE_QA?.();
      const join = window.SVR_PHASE363_JOIN_CONTROL_QA?.();
      const legacy = document.querySelector('#svr347Actions [data-ui="seat"]');
      const result = {
        joined: Boolean(window.SVR_PHASE363_STATE?.joined && window.SVR_PHASE363_JOINED_IMMEDIATE),
        gameState: window.SVR_PHASE363_STATE?.gameState || null,
        phase: state?.phase || null,
        handNo: Number(state?.handNo || 0),
        holeCards: Number(audit?.players?.[0]?.hand?.length || 0),
        playerCount: Number(audit?.players?.length || 0),
        consistency,
        table,
        join,
        legacyLeaveVisible: Boolean(legacy?.offsetParent) && (legacy?.textContent || '').trim() === 'LEAVE TABLE',
        phase372EntryVisible: Boolean(document.getElementById('svr372Primary')?.offsetParent)
      };
      return result.joined
        && result.gameState === 'SEATED'
        && result.phase === 'preflop'
        && result.handNo === 1
        && result.holeCards === 2
        && result.playerCount === 6
        && result.consistency?.pass === true
        && Number(result.consistency?.effectiveTableChips || 0) === 90000
        && Number(result.consistency?.expectedTableChips || 0) === 90000
        && result.table?.pass === true
        && result.join?.pass === true
        && result.legacyLeaveVisible
        && !result.phase372EntryVisible
        ? result : null;
    }, 45000);

    const filteredConsoleErrors = consoleErrors.filter((line) => !/favicon|WebXR.*not available|immersive-vr|THREE\.WebGLRenderer/i.test(line));
    const filteredFailures = requestFailures.filter((line) => !/favicon/i.test(line));
    const presentation = showdown.phase354 || {};
    const pass = firstJoinSurface === 'phase372-visible-entry'
      && rejoinSurface === 'phase372-visible-entry'
      && lobby.coreReady
      && seated.joined
      && hand.pass === true
      && showdown.community === 5
      && showdown.burn === 3
      && showdown.winners.length > 0
      && lobbyAfterLeave.handsCleared
      && freshRejoin.consistency?.pass === true
      && presentation.controller?.pass === true
      && presentation.cards?.pass === true
      && presentation.table?.table === true
      && presentation.table?.logo === true
      && presentation.table?.potDisplay === true
      && pageErrors.length === 0
      && filteredConsoleErrors.length === 0
      && httpErrors.length === 0
      && filteredFailures.length === 0;

    const report = {
      pass,
      build: 'PHASE-354-PROTECTED-BY-PHASE-372-PRODUCTION-ACCEPTANCE',
      url: URL,
      firstJoinSurface,
      rejoinSurface,
      lobby,
      seated,
      hand,
      showdown,
      lobbyAfterLeave,
      freshRejoin,
      pageErrors,
      consoleErrors: filteredConsoleErrors,
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