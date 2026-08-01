const { chromium } = require('playwright');

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

  const url = `${base}/game/android.html?channel=stable&manual=1&v=phase357`;
  let report = null;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => (
      typeof window.SVR_PHASE357_QA === 'function'
      && typeof window.SVR_PHASE355_RUN_FULL_HAND_QA === 'function'
      && document.querySelector('#svr347Actions [data-ui="seat"]')
    ), null, { timeout: 120000 });

    await page.locator('#svr347Actions [data-ui="seat"]').click();
    await page.waitForTimeout(1300);

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
      turnPanel: document.getElementById('svr357TurnPanel')?.textContent || '',
      betIndicators: document.querySelectorAll('.svr357Bet').length,
      state: window.SVR_PHASE357_STATE || null
    }));

    await page.locator('#svr357Ante').click();
    await page.waitForFunction((previous) => (
      Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0) > previous
      && window.SVR_PHASE336_POKER_STATE?.phase === 'preflop'
    ), showdown.handNo, { timeout: 10000 });

    const continuation = await page.evaluate((previous) => ({
      previous,
      current: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      advanced: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0) > previous,
      qa: window.SVR_PHASE357_QA?.() || null
    }), showdown.handNo);

    report = {
      url,
      seated,
      hand,
      showdown,
      continuation,
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

  const pass = report?.seated?.pass === true
    && report?.seated?.seated === true
    && Number(report?.seated?.cameraDistance || Infinity) <= Number(report?.seated?.maximumCloseSeatDistance || 0) + 0.08
    && report?.hand?.pass === true
    && report?.showdown?.phase === 'showdown'
    && /WIN|WINS/i.test(report?.showdown?.title || '')
    && /POT SETTLED:/i.test(report?.showdown?.pot || '')
    && /WINNING CARDS:/i.test(report?.showdown?.winners || '')
    && /BOARD:/i.test(report?.showdown?.board || '')
    && report?.showdown?.anteVisible === true
    && report?.showdown?.betIndicators === 6
    && report?.continuation?.advanced === true
    && report?.continuation?.phase === 'preflop'
    && pageErrors.length === 0
    && consoleErrors.length === 0
    && httpErrors.length === 0
    && requestFailures.length === 0;

  if (!pass) process.exit(1);
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
