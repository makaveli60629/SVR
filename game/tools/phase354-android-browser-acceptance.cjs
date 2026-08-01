const { chromium } = require('playwright');

(async () => {
  const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/132.0 Mobile Safari/537.36'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error.message || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(`${base}/game/android.html?channel=stable&v=phase354&acceptance=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });

  let timedOut = false;
  try {
    await page.waitForFunction(
      () => window.SVR_PHASE354_ACCEPTANCE_RESULT?.finishedAt,
      null,
      { timeout: 230000 }
    );
  } catch (error) {
    timedOut = true;
    errors.push(String(error.message || error));
  }

  const result = await page.evaluate(() => ({
    acceptance: window.SVR_PHASE354_ACCEPTANCE_RESULT || null,
    progress: window.SVR_PHASE354_PROGRESS || null,
    qa: window.SVR_PHASE354_QA?.() || window.SVR_PHASE354_QA_STATE || null,
    runtime: {
      platformReady: Boolean(window.SVR_PLATFORM_READY),
      controllerRoot: document.querySelectorAll('#svr347Root').length,
      tableAuthority: Boolean(window.SVR_TABLE_AUTHORITY || window.SVR_PHASE341_TABLE_LAYOUT),
      pokerAction: typeof window.SVR_POKER_ACTION,
      resetPoker: typeof window.SVR_RESET_POKER_TABLE,
      phase344Driver: typeof window.SVR_PHASE344_RUN_FULL_HAND_QA,
      phase354Runner: typeof window.SVR_PHASE354_RUN_ANDROID_FULL_GAME_ACCEPTANCE,
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      handNo: window.SVR_PHASE336_POKER_STATE?.handNo || 0,
      community: window.SVR_PHASE336_POKER_STATE?.community?.length || 0,
      waitingHuman: Boolean(window.SVR_PHASE336_POKER_STATE?.waitingHuman),
      lastAction: window.SVR_PHASE336_POKER_STATE?.lastAction || null
    }
  }));

  const output = { ...result, timedOut, browserErrors: errors.slice(-30) };
  console.log(JSON.stringify(output, null, 2));
  await browser.close();
  if (timedOut || !result.acceptance?.pass) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
