const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SVR Phase360 QA) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const requestFailures = [];

  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`));

  await page.goto(`${base}/game/android.html?channel=stable&v=phase360&phase360qa=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });

  await page.waitForFunction(() => {
    try {
      const qa = window.SVR_PHASE360_QA?.();
      return Boolean(qa?.nextHandWrapped && qa?.resetWrapped && qa?.deckFingerprint);
    } catch {
      return false;
    }
  }, null, { timeout: 180000 });

  const first = await page.evaluate(() => window.SVR_PHASE360_QA());
  assert.equal(first.active, true);
  assert.equal(first.randomSource, 'crypto.getRandomValues');
  assert.equal(first.secureRandomAvailable, true);
  assert.equal(first.totalStacks, 6000);
  assert.equal(first.fundedPlayers, 6);
  assert.equal(first.exactDeckRepeats, 0);
  assert.ok(first.deckFingerprint);

  const firstFingerprint = first.deckFingerprint;
  const firstHandNo = first.handNo;

  const nextAccepted = await page.evaluate(() => window.SVR_PHASE360_SECURE_NEXT_HAND());
  assert.equal(nextAccepted, true);
  await page.waitForFunction((previous) => window.SVR_PHASE360_QA?.().handNo > previous, firstHandNo, { timeout: 30000 });
  const second = await page.evaluate(() => window.SVR_PHASE360_QA());
  assert.notEqual(second.deckFingerprint, firstFingerprint, 'a secure next hand must create a different complete deck order');
  assert.equal(second.exactDeckRepeats, 0);
  assert.equal(second.totalStacks, 6000);

  await page.evaluate(() => window.SVR_PHASE360_LEAVE_TABLE());
  await page.waitForFunction(() => window.SVR_PHASE360_QA?.().leaveResetArmed === true, null, { timeout: 10000 });
  const left = await page.evaluate(() => window.SVR_PHASE360_QA());
  assert.equal(left.leaveResetArmed, true);
  assert.equal(left.continuous, false);

  await page.evaluate(() => window.SVR_PHASE360_JOIN_TABLE());
  await page.waitForFunction(() => {
    const qa = window.SVR_PHASE360_QA?.();
    return Boolean(qa && qa.leaveResetArmed === false && qa.handNo === 1 && qa.counters.joinResets >= 1);
  }, null, { timeout: 30000 });
  const joined = await page.evaluate(() => window.SVR_PHASE360_QA());
  assert.equal(joined.handNo, 1, 'deliberate leave then join must start a fresh table session');
  assert.equal(joined.totalStacks, 6000);
  assert.equal(joined.fundedPlayers, 6);
  assert.equal(joined.continuous, true);
  assert.notEqual(joined.deckFingerprint, second.deckFingerprint, 'rejoining must use a fresh deck');
  assert.equal(joined.exactDeckRepeats, 0);
  assert.equal(joined.androidLeaveWrapped, true);
  assert.equal(joined.androidSitWrapped, true);

  assert.deepEqual(pageErrors, []);
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(requestFailures, []);

  const result = {
    pass: true,
    viewport: '412x915',
    randomSource: joined.randomSource,
    firstHandNo,
    secondHandNo: second.handNo,
    joinedHandNo: joined.handNo,
    fingerprintsDifferent: firstFingerprint !== second.deckFingerprint && second.deckFingerprint !== joined.deckFingerprint,
    leaveResetArmed: left.leaveResetArmed,
    joinResets: joined.counters.joinResets,
    exactDeckRepeats: joined.exactDeckRepeats,
    totalStacks: joined.totalStacks,
    pageErrors: pageErrors.length,
    consoleErrors: consoleErrors.length,
    requestFailures: requestFailures.length
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
