'use strict';

const { chromium } = require('playwright');

const BASE = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const URL = `${BASE}/game/android.html?channel=stable&v=phase372&phase354compat=1`;
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36';

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

async function joinThroughPhase372(page, reason) {
  await page.evaluate((value) => window.SVR_PHASE372_SYNC_ANDROID_ENTRY?.(value), reason);
  const ready = await waitFor(page, () => {
    const button = document.getElementById('svr372Primary');
    const phase372 = window.SVR_PHASE372_QA?.();
    const join = window.SVR_PHASE363_JOIN_CONTROL_QA?.();
    const result = {
      coreReady: window.SVR_PHASE372_CORE_READY === true,
      primaryApi: typeof window.SVR_PHASE372_PRIMARY_ACTION === 'function',
      visible: Boolean(button?.offsetParent),
      enabled: Boolean(button && !button.disabled && /JOIN TABLE/i.test(button.textContent || '')),
      phase372,
      join
    };
    return result.coreReady
      && result.primaryApi
      && result.visible
      && result.enabled
      && result.phase372?.pass === true
      && result.phase372?.primaryVisible === true
      && result.join?.pass === true
      && result.join?.authorityId === 'svr372Primary'
      && result.join?.visibleJoinControls === 1
      ? result : null;
  });
  const actionResult = await page.evaluate(() => window.SVR_PHASE372_PRIMARY_ACTION());
  if (actionResult === false) {
    const failure = await page.evaluate(() => ({
      phase372: window.SVR_PHASE372_QA?.() || null,
      state: window.SVR_PHASE372_STATE || null,
      join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
      phase363: window.SVR_PHASE363_STATE || null
    }));
    throw new Error(`Phase 372 authoritative JOIN rejected: ${JSON.stringify(failure)}`);
  }
  return { surface: 'phase372-visible-entry', ready };
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
        entryVisible: Boolean(document.getElementById('svr372Primary')?.offsetParent)
      };
      return result.coreReady
        && !result.joined
        && result.gameState === 'LOBBY'
        && result.phase === 'idle'
        && result.phase372?.pass === true
        && result.join?.pass === true
        && result.join?.authorityId === 'svr372Primary'
        && result.table?.pass === true
        && result.entryVisible
        ? result : null;
    });

    const firstJoin = await joinThroughPhase372(page, 'phase354-first-join');
    const seated = await waitFor(page, () => {
      window.SVR_PHASE364_ANDROID_SEAT?.(true);
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const result = {
        joined: Boolean(window.SVR_PHASE363_STATE?.joined && window.SVR_PHASE363_JOINED_IMMEDIATE),
        gameState: window.SVR_PHASE363_STATE?.gameState || null,
        phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
        handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
        holeCards: Number(audit?.players?.[0]?.hand?.length || 0),
        phase357: window.SVR_PHASE357_QA?.() || null,
        phase364: window.SVR_PHASE364_QA?.() || null,
        entryVisible: Boolean(document.getElementById('svr372Primary')?.offsetParent)
      };
      return result.joined
        && result.gameState === 'SEATED'
        && result.phase === 'preflop'
        && result.holeCards === 2
        && result.phase357?.seated === true
        && result.phase364?.tablePass === true
        && result.phase364?.androidJoined === true
        && !result.entryVisible
        ? result : null;
    }, 45000);

    const hand = await page.evaluate(() => window.SVR_PHASE355_RUN_FULL_HAND_QA({ maxHands: 1, timeoutMs: 90000 }));
    const record = hand?.record || {};
    if (!hand?.pass
        || Number(record.compatibilityExpectedTableBankroll || 0) !== 6000
        || Number(record.actualExpectedTableBankroll || record.expectedTableBankroll || 0) !== 90000
        || Number(record.totalStacks || 0) !== 90000
        || record.protectedProductionBankrollPreserved !== true) {
      throw new Error(`Complete-hand driver failed: ${JSON.stringify(hand)}`);
    }

    const showdown = await waitFor(page, () => {
      const state = window.SVR_PHASE336_POKER_STATE;
      const result = {
        phase: state?.phase || null,
        community: Number(state?.community?.length || 0),
        burn: Number(state?.burn?.length || 0),
        settledPot: Number(state?.settledPot || 0),
        winners: Array.isArray(state?.winners) ? state.winners : [],
        title: document.getElementById('svr357ResultTitle')?.textContent || '',
        pot: document.getElementById('svr357ResultPot')?.textContent || '',
        details: document.getElementById('svr357WinnerDetails')?.textContent || '',
        board: document.getElementById('svr357Board')?.textContent || '',
        phase354: window.SVR_PHASE354_QA?.() || null
      };
      return result.phase === 'showdown'
        && result.community === 5
        && result.burn === 3
        && result.settledPot > 0
        && result.winners.length > 0
        && /WIN|WINS/i.test(result.title)
        && /POT SETTLED:/i.test(result.pot)
        && /WINNING CARDS:/i.test(result.details)
        && /BOARD:/i.test(result.board)
        ? result : null;
    }, 30000);

    await page.evaluate(() => window.SVR_PHASE363_LEAVE_TABLE?.('phase354-after-hand'));
    const lobbyAfterLeave = await waitFor(page, () => {
      window.SVR_PHASE372_SYNC_ANDROID_ENTRY?.('phase354-after-leave');
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const consistency = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const join = window.SVR_PHASE363_JOIN_CONTROL_QA?.();
      const phase372 = window.SVR_PHASE372_QA?.();
      const handsCleared = (audit?.players || []).every((player) => Array.isArray(player.hand) && player.hand.length === 0);
      const result = {
        joined: Boolean(window.SVR_PHASE363_STATE?.joined || window.SVR_PHASE363_JOINED_IMMEDIATE),
        gameState: window.SVR_PHASE363_STATE?.gameState || null,
        phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
        handsCleared,
        consistency,
        join,
        phase372,
        entryVisible: Boolean(document.getElementById('svr372Primary')?.offsetParent)
      };
      return !result.joined
        && result.gameState === 'LOBBY'
        && result.phase === 'idle'
        && result.handsCleared
        && result.consistency?.lobbyCardsCleared === true
        && result.join?.pass === true
        && result.join?.authorityId === 'svr372Primary'
        && result.phase372?.pass === true
        && result.entryVisible
        ? result : null;
    }, 30000);

    const secondJoin = await joinThroughPhase372(page, 'phase354-fresh-rejoin');
    const freshRejoin = await waitFor(page, () => {
      window.SVR_PHASE364_ANDROID_SEAT?.(true);
      const state = window.SVR_PHASE336_POKER_STATE;
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const consistency = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const result = {
        joined: Boolean(window.SVR_PHASE363_STATE?.joined && window.SVR_PHASE363_JOINED_IMMEDIATE),
        gameState: window.SVR_PHASE363_STATE?.gameState || null,
        phase: state?.phase || null,
        handNo: Number(state?.handNo || 0),
        holeCards: Number(audit?.players?.[0]?.hand?.length || 0),
        playerCount: Number(audit?.players?.length || 0),
        consistency,
        table: window.SVR_PHASE363_TABLE_QA?.() || null
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
        ? result : null;
    }, 45000);

    const filteredConsole = consoleErrors.filter((line) => !/favicon|WebXR.*not available|immersive-vr|THREE\.WebGLRenderer/i.test(line));
    const filteredFailures = requestFailures.filter((line) => !/favicon/i.test(line));
    const presentation = showdown.phase354 || {};
    const pass = firstJoin.surface === 'phase372-visible-entry'
      && secondJoin.surface === 'phase372-visible-entry'
      && lobby.coreReady
      && seated.joined
      && hand.pass === true
      && showdown.community === 5
      && showdown.burn === 3
      && lobbyAfterLeave.handsCleared
      && freshRejoin.consistency?.pass === true
      && presentation.controller?.pass === true
      && presentation.cards?.pass === true
      && presentation.table?.table === true
      && presentation.table?.logo === true
      && presentation.table?.potDisplay === true
      && pageErrors.length === 0
      && filteredConsole.length === 0
      && httpErrors.length === 0
      && filteredFailures.length === 0;

    const report = {
      pass,
      build: 'PHASE-354-PROTECTED-BY-PHASE-372-PRODUCTION-ACCEPTANCE',
      url: URL,
      firstJoin,
      secondJoin,
      lobby,
      seated,
      hand,
      showdown,
      lobbyAfterLeave,
      freshRejoin,
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