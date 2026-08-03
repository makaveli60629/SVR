'use strict';

const { chromium } = require('playwright');
const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';

async function drag(page, selector, dx, dy) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`NO_BOX:${selector}`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(150);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 915, height: 412 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error?.stack || error)));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${base}/game/android.html?channel=stable&v=phase368&acceptance=phase368-pointer`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE368_JOIN_CARD_QA === 'function' && typeof window.SVR_PHASE367_DEVICE_QA === 'function', null, { timeout: 120000 });
  await page.waitForSelector('#svr347Move', { timeout: 30000 });
  await page.waitForSelector('#svr347Look', { timeout: 30000 });
  await page.waitForSelector('#svr347Actions', { timeout: 30000 });
  await page.waitForFunction(() => window.SVR_PHASE367_DEVICE_QA?.().pass === true, null, { timeout: 30000 });

  const snapshots = [];
  const snap = async (label) => snapshots.push(await page.evaluate((name) => ({
    label: name,
    phase367: window.SVR_PHASE367_DEVICE_QA?.(),
    phase368: window.SVR_PHASE368_JOIN_CARD_QA?.(),
    targets: {
      move: document.elementFromPoint(...(() => { const r = document.querySelector('#svr347Move').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })())?.id || null,
      look: document.elementFromPoint(...(() => { const r = document.querySelector('#svr347Look').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })())?.id || null,
      action: document.elementFromPoint(...(() => { const r = document.querySelector('#svr347Actions').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })())?.id || null
    }
  }), label));

  await snap('baseline');
  await drag(page, '#svr347Move', 14, 0);
  await snap('after-move');
  await drag(page, '#svr347Look', -12, 0);
  await snap('after-look');
  await page.evaluate(() => {
    const panel = document.querySelector('#svr347Actions');
    for (const child of panel?.querySelectorAll('*') || []) child.style.pointerEvents = 'none';
  });
  const actionBox = await page.locator('#svr347Actions').boundingBox();
  await page.mouse.click(actionBox.x + actionBox.width / 2, actionBox.y + actionBox.height / 2);
  await page.waitForTimeout(150);
  await snap('after-action');

  const final = snapshots.at(-1)?.phase367 || {};
  const result = {
    build: 'PHASE-368-ANDROID-POINTER-BROWSER-ACCEPTANCE',
    snapshots,
    errors,
    checks: {
      moveTouches: Number(final.moveTouches || 0) >= 1,
      lookTouches: Number(final.lookTouches || 0) >= 1,
      actionTouches: Number(final.actionTouches || 0) >= 1,
      phase368Pass: snapshots.at(-1)?.phase368?.pass === true,
      noErrors: errors.length === 0
    }
  };
  result.pass = Object.values(result.checks).every(Boolean);
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (!result.pass) process.exit(1);
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
