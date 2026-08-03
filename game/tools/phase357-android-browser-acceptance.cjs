const { chromium } = require('playwright');

async function tap(locator) {
  try {
    await locator.tap({ force: true, timeout: 10000 });
  } catch {
    await locator.click({ force: true, timeout: 10000 });
  }
}

(async () => {
  const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/132.0 Mobile Safari/537.36',
    hasTouch: true,
    isMobile: true
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
    if (response.url().startsWith(base) && response.status() >= 400) {
      httpErrors.push({ status: response.status(), url: response.url() });
    }
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(base)) requestFailures.push({ url: request.url(), error: request.failure()?.errorText || 'failed' });
  });

  const url = `${base}/game/android.html?channel=stable&manual=1&v=phase364`;
  let report = null;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => (
      typeof window.SVR_PHASE357_QA === 'function'
      && typeof window.SVR_PHASE355_RUN_FULL_HAND_QA === 'function'
      && typeof window.SVR_PHASE363_JOIN_CONTROL_QA === 'function'
      && typeof window.SVR_PHASE363_CONSISTENCY_QA === 'function'
      && typeof window.SVR_PHASE364_ANDROID_SEAT === 'function'
      && document.querySelector('#svr347Actions [data-ui="seat"]')
    ), null, { timeout: 120000 });

    const lobbyBefore = await page.evaluate(() => ({
      joined: Boolean(window.SVR_PHASE363_STATE?.joined),
      gameState: window.SVR_PHASE363_STATE?.gameState || null,
      joinQa: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
      consistency: window.SVR_PHASE363_CONSISTENCY_QA?.() || null,
      seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || '',
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0)
    }));

    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    await page.waitForFunction(() => (
      window.SVR_PHASE363_STATE?.joined === true
      && window.SVR_PHASE336_POKER_STATE?.handNo >= 1
      && (window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0]?.hand?.length || 0) === 2
    ), null, { timeout: 30000 });

    // Phase 364 owns the final table height and camera eye line. Wait for that
    // device correction instead of sampling Phase 357 during the join transition.
    await page.waitForFunction(() => {
      window.SVR_PHASE364_ANDROID_SEAT?.(true);
      const q = window.SVR_PHASE357_QA?.();
      return q?.seated === true
        && Number(q.cameraDistance || Infinity) <= Number(q.maximumCloseSeatDistance || 0) + 0.08;
    }, null, { timeout: 12000, polling: 180 });
    await page.waitForTimeout(350);

    const seated = await page.evaluate(() => window.SVR_PHASE357_QA());
    const hand = await page.evaluate(() => window.SVR_PHASE355_RUN_FULL_HAND_QA({ maxHands: 1, timeoutMs: 90000 }));

    await page.waitForFunction(() => {
      const panel = document.getElementById('svr357Showdown');
      return window.SVR_PHASE336_POKER_STATE?.phase === 'showdown'
        && panel
        && panel.hidden === false
        && document.getElementById('svr357WinnerDetails')?.textContent?.trim();
    }, null, { timeout: 10000 });

    const showdown = await page.evaluate(() => ({
      handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      title: document.getElementById('svr357ResultTitle')?.textContent || '',
      pot: document.getElementById('svr357ResultPot')?.textContent || '',
      winners: document.getElementById('svr357WinnerDetails')?.textContent || '',
      board: document.getElementById('svr357Board')?.textContent || '',
      anteVisible: Boolean(document.getElementById('svr357Ante')?.offsetParent),
      phase359PanelVisible: Boolean(document.getElementById('svr359AndroidResult')?.offsetParent),
      turnPanel: document.getElementById('svr357TurnPanel')?.textContent || '',
      betIndicators: document.querySelectorAll('.svr357Bet').length,
      state: window.SVR_PHASE357_STATE || null,
      phase363: window.SVR_PHASE363_QA?.() || null,
      phase364: window.SVR_PHASE364_QA?.() || null
    }));

    await page.waitForTimeout(700);
    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    await page.waitForFunction(() => (
      window.SVR_PHASE363_STATE?.joined === false
      && window.SVR_PHASE336_POKER_STATE?.phase === 'idle'
      && window.SVR_PHASE363_CONSISTENCY_QA?.()?.lobbyCardsCleared === true
    ), null, { timeout: 15000 });
    await page.waitForTimeout(700);

    const lobbyAfterLeave = await page.evaluate(() => ({
      joined: Boolean(window.SVR_PHASE363_STATE?.joined),
      gameState: window.SVR_PHASE363_STATE?.gameState || null,
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
      seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || '',
      joinQa: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
      consistency: window.SVR_PHASE363_CONSISTENCY_QA?.() || null,
      audit: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null,
      phase357: window.SVR_PHASE357_QA?.() || null
    }));

    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    await page.waitForFunction(() => (
      window.SVR_PHASE363_STATE?.joined === true
      && window.SVR_PHASE336_POKER_STATE?.handNo === 1
      && window.SVR_PHASE336_POKER_STATE?.phase === 'preflop'
      && (window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0]?.hand?.length || 0) === 2
    ), null, { timeout: 30000 });
    await page.waitForFunction(() => {
      window.SVR_PHASE364_ANDROID_SEAT?.(true);
      return window.SVR_PHASE357_QA?.()?.seated === true;
    }, null, { timeout: 10000, polling: 180 });
    await page.waitForTimeout(350);

    const freshRejoin = await page.evaluate(() => ({
      joined: Boolean(window.SVR_PHASE363_STATE?.joined),
      gameState: window.SVR_PHASE363_STATE?.gameState || null,
      handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || '',
      joinQa: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
      consistency: window.SVR_PHASE363_CONSISTENCY_QA?.() || null,
      audit: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null,
      phase357: window.SVR_PHASE357_QA?.() || null,
      phase364: window.SVR_PHASE364_QA?.() || null
    }));

    report = {
      url,
      lobbyBefore,
      seated,
      hand,
      showdown,
      compatibilityAuthority: 'phase363-leave-join-with-phase364-device-seat',
      compatibilityBankrolls: {
        isolatedLegacyDriver: Number(hand?.record?.expectedTableBankroll || 0),
        phase363FreshTable: Number(freshRejoin?.consistency?.expectedTableChips || 0)
      },
      lobbyAfterLeave,
      freshRejoin,
      pageErrors,
      consoleErrors,
      httpErrors,
      requestFailures,
      checkedAt: new Date().toISOString()
    };
  } finally {
    console.log(JSON.stringify(report || { url, pageErrors, consoleErrors, httpErrors, requestFailures }, null, 2));
    await browser.close();
  }

  const lobbyHandsCleared = (report?.lobbyAfterLeave?.audit?.players || [])
    .every((player) => Array.isArray(player.hand) && player.hand.length === 0);
  const freshHuman = report?.freshRejoin?.audit?.players?.[0] || null;
  const legacyExpected = Number(report?.hand?.record?.expectedTableBankroll || 0);
  const legacySettled = Number(report?.hand?.record?.totalStacks || -1);
  const pass = report?.lobbyBefore?.joined === false
    && report?.lobbyBefore?.joinQa?.pass === true
    && report?.lobbyBefore?.seatText === 'JOIN TABLE'
    && report?.seated?.pass === true
    && report?.seated?.seated === true
    && Number(report?.seated?.cameraDistance || Infinity) <= Number(report?.seated?.maximumCloseSeatDistance || 0) + 0.08
    && report?.hand?.pass === true
    && legacyExpected === 6000
    && legacySettled === legacyExpected
    && Number(report?.hand?.record?.settledPot || 0) > 0
    && report?.showdown?.phase === 'showdown'
    && /WIN|WINS/i.test(report?.showdown?.title || '')
    && /POT SETTLED:/i.test(report?.showdown?.pot || '')
    && /WINNING CARDS:/i.test(report?.showdown?.winners || '')
    && /BOARD:/i.test(report?.showdown?.board || '')
    && report?.showdown?.betIndicators === 6
    && report?.showdown?.phase364?.tablePass === true
    && report?.compatibilityAuthority === 'phase363-leave-join-with-phase364-device-seat'
    && report?.lobbyAfterLeave?.joined === false
    && report?.lobbyAfterLeave?.gameState === 'LOBBY'
    && report?.lobbyAfterLeave?.phase === 'idle'
    && report?.lobbyAfterLeave?.seatText === 'JOIN TABLE'
    && report?.lobbyAfterLeave?.joinQa?.pass === true
    && report?.lobbyAfterLeave?.consistency?.lobbyCardsCleared === true
    && lobbyHandsCleared
    && report?.freshRejoin?.joined === true
    && report?.freshRejoin?.gameState === 'SEATED'
    && report?.freshRejoin?.handNo === 1
    && report?.freshRejoin?.phase === 'preflop'
    && report?.freshRejoin?.seatText === 'LEAVE TABLE'
    && report?.freshRejoin?.joinQa?.pass === true
    && Array.isArray(freshHuman?.hand)
    && freshHuman.hand.length === 2
    && Number(report?.freshRejoin?.consistency?.effectiveTableChips || 0) === 90000
    && Number(report?.freshRejoin?.consistency?.expectedTableChips || 0) === 90000
    && report?.freshRejoin?.phase357?.seated === true
    && report?.freshRejoin?.phase364?.tablePass === true
    && pageErrors.length === 0
    && consoleErrors.length === 0
    && httpErrors.length === 0
    && requestFailures.length === 0;

  if (!pass) process.exit(1);
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
