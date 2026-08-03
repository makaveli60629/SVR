'use strict';

const { chromium } = require('playwright');

const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const url = `${base}/game/android.html?channel=stable&v=phase367&acceptance=phase367`;
const userAgent = 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36';

async function tapControl(page, selector) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible', timeout: 120000 });
  const box = await locator.boundingBox();
  if (!box) throw new Error(`No touchable bounds for ${selector}`);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

async function runDevice(browser, viewport, label) {
  const context = await browser.newContext({
    viewport,
    screen: viewport,
    userAgent,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => errors.push(String(error?.stack || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console:${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(base)) failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`);
  });
  page.on('response', (response) => {
    if (response.url().startsWith(base) && response.status() >= 400) failedRequests.push(`HTTP ${response.status()} ${response.url()}`);
  });

  await page.goto(`${url}&device=${label}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE367_DEVICE_QA === 'function', null, { timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE363_JOIN_TABLE === 'function', null, { timeout: 120000 });
  await page.waitForSelector('#svr347Root', { timeout: 120000 });
  await page.waitForSelector('#svr347Move', { timeout: 120000 });
  await page.waitForSelector('#svr347Look', { timeout: 120000 });
  await page.waitForSelector('#svr347Actions [data-ui="seat"]', { timeout: 120000 });

  await tapControl(page, '#svr347Move');
  await page.waitForTimeout(120);
  await tapControl(page, '#svr347Look');
  await page.waitForTimeout(180);
  await page.evaluate(() => window.SVR_PHASE367_DEVICE_CALIBRATE?.());
  const lobby = await page.evaluate(() => window.SVR_PHASE367_DEVICE_QA());

  await tapControl(page, '#svr347Actions [data-ui="seat"]');
  await page.waitForFunction(() => (
    window.SVR_PHASE363_JOINED_IMMEDIATE === true
    && document.body.classList.contains('svr365-seated')
    && document.body.classList.contains('svr367-seated')
  ), null, { timeout: 30000 });
  await page.waitForTimeout(1100);
  await page.evaluate(() => window.SVR_PHASE367_DEVICE_STABILIZE?.());
  await page.waitForTimeout(1150);
  const seated = await page.evaluate(() => window.SVR_PHASE367_DEVICE_QA());

  const result = {
    label,
    viewport,
    lobby,
    seated,
    errors,
    failedRequests
  };
  await context.close();
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const landscape = await runDevice(browser, { width: 915, height: 412 }, 'landscape');
  const portrait = await runDevice(browser, { width: 412, height: 915 }, 'portrait');
  await browser.close();

  const allErrors = [...landscape.errors, ...portrait.errors];
  const allFailedRequests = [...landscape.failedRequests, ...portrait.failedRequests];
  const checks = [
    [landscape.lobby?.pass === true && portrait.lobby?.pass === true, 'lobby-runtime-qa'],
    [landscape.lobby?.singleController === true && portrait.lobby?.singleController === true, 'single-controller-both-orientations'],
    [landscape.lobby?.controllerRoots === 1 && landscape.lobby?.moveControls === 1 && landscape.lobby?.lookControls === 1, 'landscape-one-root-move-look'],
    [portrait.lobby?.controllerRoots === 1 && portrait.lobby?.moveControls === 1 && portrait.lobby?.lookControls === 1, 'portrait-one-root-move-look'],
    [landscape.lobby?.moveTouches >= 1 && landscape.lobby?.lookTouches >= 1, 'landscape-move-look-touch-metrics'],
    [portrait.lobby?.moveTouches >= 1 && portrait.lobby?.lookTouches >= 1, 'portrait-move-look-touch-metrics'],
    [landscape.seated?.actionTouches >= 1 && portrait.seated?.actionTouches >= 1, 'join-action-touch-metrics'],
    [landscape.seated?.seated === true && landscape.seated?.seatedNavigationClean === true, 'landscape-seated-navigation-clean'],
    [portrait.seated?.seated === true && portrait.seated?.seatedNavigationClean === true, 'portrait-seated-navigation-clean'],
    [landscape.seated?.singleController === true && portrait.seated?.singleController === true, 'controller-protected-while-seated'],
    [landscape.seated?.viewportWidth >= 880 && landscape.seated?.viewportHeight <= 430, 'landscape-viewport-calibrated'],
    [portrait.seated?.viewportWidth <= 430 && portrait.seated?.viewportHeight >= 880, 'portrait-viewport-calibrated'],
    [landscape.seated?.stabilizationRequests >= 1 && portrait.seated?.stabilizationRequests >= 1, 'stabilization-requested'],
    [landscape.seated?.stabilizationApplied >= 1 && portrait.seated?.stabilizationApplied >= 1, 'stabilization-applied'],
    [landscape.seated?.stabilizationApplied <= landscape.seated?.stabilizationRequests, 'landscape-stabilization-bounded'],
    [portrait.seated?.stabilizationApplied <= portrait.seated?.stabilizationRequests, 'portrait-stabilization-bounded'],
    [allErrors.length === 0, 'no-browser-errors'],
    [allFailedRequests.length === 0, 'no-same-origin-request-failures']
  ];
  const failures = checks.filter(([pass]) => !pass).map(([, label]) => label);
  const result = {
    build: 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-ACCEPTANCE-LOCK',
    pass: failures.length === 0,
    failures,
    landscape,
    portrait,
    errors: allErrors,
    failedRequests: allFailedRequests
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) process.exit(1);
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
