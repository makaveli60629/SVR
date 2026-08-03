const { chromium } = require('playwright');

const BASE = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const URL = `${BASE}/game/android.html?channel=stable&manual=1&v=phase364`;
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/132.0 Mobile Safari/537.36';

async function tap(locator) {
  try {
    await locator.tap({ force: true, timeout: 10000 });
  } catch {
    await locator.click({ force: true, timeout: 10000 });
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
  throw new Error(`Timed out waiting for Android compatibility state: ${JSON.stringify(last)}`);
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
    await waitFor(page, () => {
      const ready = typeof window.SVR_PHASE357_QA === 'function'
        && typeof window.SVR_PHASE355_RUN_FULL_HAND_QA === 'function'
        && typeof window.SVR_PHASE363_JOIN_CONTROL_QA === 'function'
        && typeof window.SVR_PHASE363_CONSISTENCY_QA === 'function'
        && typeof window.SVR_PHASE364_ANDROID_SEAT === 'function'
        && typeof window.SVR_PHASE364_QA === 'function'
        && document.querySelector('#svr347Actions [data-ui="seat"]');
      return ready ? true : null;
    });

    const lobbyBefore = await page.evaluate(() => ({
      joined: Boolean(window.SVR_PHASE363_STATE?.joined),
      gameState: window.SVR_PHASE363_STATE?.gameState || null,
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || '',
      join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
      consistency: window.SVR_PHASE363_CONSISTENCY_QA?.() || null
    }));
    if (lobbyBefore.joined || lobbyBefore.seatText !== 'JOIN TABLE' || lobbyBefore.join?.pass !== true) {
      throw new Error(`Initial Android lobby contract failed: ${JSON.stringify(lobbyBefore)}`);
    }

    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    await waitFor(page, () => {
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      return window.SVR_PHASE363_STATE?.joined === true
        && Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0) >= 1
        && Number(audit?.players?.[0]?.hand?.length || 0) === 2
        ? true : null;
    }, 30000);

    const seated = await waitFor(page, () => {
      window.SVR_PHASE364_ANDROID_SEAT?.(true);
      const phase357 = window.SVR_PHASE357_QA?.();
      const phase364 = window.SVR_PHASE364_QA?.();
      return phase357?.seated === true
        && phase357?.pass === true
        && Number(phase357?.cameraDistance || Infinity) <= Number(phase357?.maximumCloseSeatDistance || 0)
        && phase364?.tablePass === true
        && phase364?.androidJoined === true
        ? { phase357, phase364 }
        : null;
    }, 15000);

    // Phase 355 intentionally runs a self-contained compatibility table: 1,000 x 6 = 6,000.
    const compatibilityHand = await page.evaluate(() => window.SVR_PHASE355_RUN_FULL_HAND_QA({ maxHands: 1, timeoutMs: 90000 }));
    if (!compatibilityHand?.pass
        || Number(compatibilityHand?.record?.expectedTableBankroll || 0) !== 6000
        || Number(compatibilityHand?.record?.totalStacks || 0) !== 6000
        || Number(compatibilityHand?.record?.settledPot || 0) <= 0) {
      throw new Error(`Phase 355 compatibility hand failed: ${JSON.stringify(compatibilityHand)}`);
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
        ? result
        : null;
    }, 15000);

    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    const lobbyAfterLeave = await waitFor(page, () => {
      const consistency = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const handsCleared = (audit?.players || []).every((player) => Array.isArray(player.hand) && player.hand.length === 0);
      const result = {
        joined: Boolean(window.SVR_PHASE363_STATE?.joined),
        gameState: window.SVR_PHASE363_STATE?.gameState || null,
        phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
        seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || '',
        consistency,
        join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
        handsCleared
      };
      return result.joined === false
        && result.gameState === 'LOBBY'
        && result.phase === 'idle'
        && result.seatText === 'JOIN TABLE'
        && result.consistency?.lobbyCardsCleared === true
        && result.handsCleared
        ? result
        : null;
    }, 15000);

    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    const freshRejoin = await waitFor(page, () => {
      window.SVR_PHASE364_ANDROID_SEAT?.(true);
      const state = window.SVR_PHASE336_POKER_STATE;
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const consistency = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const phase357 = window.SVR_PHASE357_QA?.();
      const phase364 = window.SVR_PHASE364_QA?.();
      const result = {
        joined: Boolean(window.SVR_PHASE363_STATE?.joined),
        gameState: window.SVR_PHASE363_STATE?.gameState || null,
        handNo: Number(state?.handNo || 0),
        phase: state?.phase || null,
        holeCards: Number(audit?.players?.[0]?.hand?.length || 0),
        consistency,
        phase357,
        phase364,
        seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || ''
      };
      return result.joined
        && result.gameState === 'SEATED'
        && result.handNo === 1
        && result.phase === 'preflop'
        && result.holeCards === 2
        && result.seatText === 'LEAVE TABLE'
        && Number(consistency?.effectiveTableChips || 0) === 90000
        && Number(consistency?.expectedTableChips || 0) === 90000
        && consistency?.pass === true
        && phase357?.seated === true
        && phase357?.pass === true
        && Number(phase357?.cameraDistance || Infinity) <= Number(phase357?.maximumCloseSeatDistance || 0)
        && phase364?.tablePass === true
        && phase364?.androidJoined === true
        ? result
        : null;
    }, 30000);

    const filteredConsole = consoleErrors.filter((line) => !/favicon|WebXR.*not available|THREE\.WebGLRenderer/i.test(line));
    const filteredFailures = requestFailures.filter((line) => !/favicon/i.test(line));
    const pass = seated.phase357.pass === true
      && seated.phase364.tablePass === true
      && compatibilityHand.pass === true
      && showdown.phase357.pass === true
      && showdown.phase364.tablePass === true
      && showdown.betIndicators === 6
      && lobbyAfterLeave.consistency.pass === true
      && freshRejoin.consistency.pass === true
      && pageErrors.length === 0
      && filteredConsole.length === 0
      && httpErrors.length === 0
      && filteredFailures.length === 0;

    const report = {
      pass,
      url: URL,
      lobbyBefore,
      seated,
      compatibilityHand,
      showdown,
      lobbyAfterLeave,
      freshRejoin,
      bankrollAuthorities: {
        isolatedCompatibilityHand: 6000,
        productionFreshTable: 90000
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
