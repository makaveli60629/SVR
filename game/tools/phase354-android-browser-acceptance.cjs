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
  await page.goto(`${base}/game/android.html?channel=stable&v=phase354&acceptance=1`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.SVR_PHASE354_ACCEPTANCE_RESULT && window.SVR_PHASE354_ACCEPTANCE_RESULT.finishedAt, null, { timeout: 240000 });
  const result = await page.evaluate(() => ({ acceptance: window.SVR_PHASE354_ACCEPTANCE_RESULT, qa: window.SVR_PHASE354_QA?.() || null }));
  console.log(JSON.stringify({ ...result, browserErrors: errors.slice(-20) }, null, 2));
  await browser.close();
  if (!result.acceptance?.pass) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
