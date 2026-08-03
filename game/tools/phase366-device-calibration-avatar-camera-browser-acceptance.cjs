'use strict';

const { chromium } = require('playwright');

const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const url = `${base}/game/android.html?channel=stable&v=phase366&acceptance=phase366`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 915, height: 412 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36'
  });
  const page = await context.newPage();
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => errors.push(String(error?.stack || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console:${message.text()}`);
  });
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE366_QA === 'function', null, { timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE365_QA === 'function', null, { timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE363_JOIN_TABLE === 'function', null, { timeout: 120000 });
  await page.waitForFunction(() => Boolean(window.__SVR_CAMERA__ && window.SVR_TABLE_AUTHORITY), null, { timeout: 120000 });
  await page.waitForSelector('#svr366CalibrationButton', { timeout: 30000 });
  await page.waitForSelector('#svr366CalibrationPanel', { state: 'attached', timeout: 30000 });
  await page.waitForFunction(() => window.SVR_PHASE366_QA?.().pass === true, null, { timeout: 30000 });

  const baseline = await page.evaluate(() => ({
    qa: window.SVR_PHASE366_QA(),
    calibration: window.SVR_PHASE366_CALIBRATION,
    stored: localStorage.getItem('svr.phase366.androidCalibration.v1'),
    buttonCount: document.querySelectorAll('#svr366CalibrationButton').length,
    panelCount: document.querySelectorAll('#svr366CalibrationPanel').length,
    buttonDisplay: getComputedStyle(document.querySelector('#svr366CalibrationButton')).display,
    phase365: window.SVR_PHASE365_QA?.() || null
  }));

  await page.evaluate(() => window.SVR_PHASE366_OPEN_CALIBRATION());
  await page.waitForFunction(() => document.querySelector('#svr366CalibrationPanel')?.hidden === false);

  await page.evaluate(() => window.SVR_PHASE366_SET_CALIBRATION({
    tableYOffset: 0.015,
    seatDistanceOffset: -0.04,
    seatHeightOffset: 0.02,
    hudScale: 0.92,
    potOpacity: 0.64,
    potScale: 0.78,
    gyroSensitivity: 1.14,
    avatarRadialOffset: 0.03,
    avatarHeightOffset: -0.015
  }));
  await page.waitForTimeout(500);

  const custom = await page.evaluate(() => ({
    qa: window.SVR_PHASE366_QA(),
    state: window.SVR_PHASE366_STATE,
    calibration: window.SVR_PHASE366_CALIBRATION,
    stored: JSON.parse(localStorage.getItem('svr.phase366.androidCalibration.v1') || '{}'),
    hudScale: getComputedStyle(document.documentElement).getPropertyValue('--svr366-hud-scale').trim(),
    table: window.SVR_PHASE366_TABLE_CALIBRATION || null,
    panelOpen: document.querySelector('#svr366CalibrationPanel')?.hidden === false
  }));

  await page.evaluate(() => window.SVR_PHASE363_JOIN_TABLE('phase366-browser-acceptance'));
  await page.waitForFunction(() => (
    window.SVR_PHASE363_STATE?.joined === true
    && document.body.classList.contains('svr365-seated')
  ), null, { timeout: 30000 });
  await page.waitForTimeout(900);

  await page.evaluate(() => {
    const event = new Event('deviceorientation');
    Object.defineProperties(event, {
      alpha: { value: 18 },
      beta: { value: 11 },
      gamma: { value: -7 }
    });
    window.dispatchEvent(event);
  });
  await page.waitForTimeout(250);

  const seated = await page.evaluate(() => {
    const scene = window.__SVR_SCENE__;
    const pot = scene?.getObjectByName?.('PHASE365_ANDROID_CLEAN_POT_DISPLAY')
      || scene?.getObjectByName?.('PHASE347_ANDROID_RAISED_POT_DISPLAY');
    return {
      buttonDisplay: getComputedStyle(document.querySelector('#svr366CalibrationButton')).display,
      panelHidden: document.querySelector('#svr366CalibrationPanel')?.hidden,
      state: window.SVR_PHASE366_STATE,
      camera: window.__SVR_CAMERA__?.getWorldPosition?.(new window.__SVR_THREE__.Vector3())?.toArray?.() || window.__SVR_CAMERA__?.position?.toArray?.() || null,
      pot: pot ? {
        opacity: Array.isArray(pot.material) ? pot.material[0]?.opacity : pot.material?.opacity,
        depthWrite: Array.isArray(pot.material) ? pot.material[0]?.depthWrite : pot.material?.depthWrite,
        scale: pot.scale?.toArray?.() || null
      } : null
    };
  }).catch(async () => page.evaluate(() => {
    const scene = window.__SVR_SCENE__;
    let pot = null;
    scene?.traverse?.((object) => {
      if (!pot && /POT_DISPLAY/i.test(object?.name || '')) pot = object;
    });
    return {
      buttonDisplay: getComputedStyle(document.querySelector('#svr366CalibrationButton')).display,
      panelHidden: document.querySelector('#svr366CalibrationPanel')?.hidden,
      state: window.SVR_PHASE366_STATE,
      camera: window.__SVR_CAMERA__?.position?.toArray?.() || null,
      pot: pot ? {
        opacity: Array.isArray(pot.material) ? pot.material[0]?.opacity : pot.material?.opacity,
        depthWrite: Array.isArray(pot.material) ? pot.material[0]?.depthWrite : pot.material?.depthWrite,
        scale: pot.scale?.toArray?.() || null
      } : null
    };
  }));

  await page.evaluate(() => window.SVR_PHASE366_RESET());
  await page.waitForTimeout(500);
  const reset = await page.evaluate(() => ({
    calibration: window.SVR_PHASE366_CALIBRATION,
    stored: JSON.parse(localStorage.getItem('svr.phase366.androidCalibration.v1') || '{}'),
    table: window.SVR_PHASE366_TABLE_CALIBRATION || null,
    qa: window.SVR_PHASE366_QA()
  }));

  await page.evaluate(() => window.SVR_PHASE363_LEAVE_TABLE?.('phase366-browser-acceptance'));
  await page.waitForFunction(() => window.SVR_PHASE363_STATE?.joined === false, null, { timeout: 30000 });
  await page.waitForTimeout(300);
  const lobbyReturn = await page.evaluate(() => ({
    buttonDisplay: getComputedStyle(document.querySelector('#svr366CalibrationButton')).display,
    moveDisplay: getComputedStyle(document.querySelector('#svr347Move')).display,
    lookDisplay: getComputedStyle(document.querySelector('#svr347Look')).display
  }));

  const checks = [
    [baseline.buttonCount === 1 && baseline.panelCount === 1, 'single-calibration-ui'],
    [baseline.buttonDisplay !== 'none', 'calibration-visible-in-lobby'],
    [baseline.qa?.pass === true && baseline.phase365?.pass === true, 'baseline-authorities-pass'],
    [custom.panelOpen === true, 'panel-opens'],
    [Math.abs(Number(custom.calibration?.tableYOffset) - 0.015) < 0.0001, 'table-setting-applied'],
    [Math.abs(Number(custom.calibration?.seatDistanceOffset) + 0.04) < 0.0001, 'seat-distance-setting-applied'],
    [Math.abs(Number(custom.stored?.potOpacity) - 0.64) < 0.0001, 'settings-persist-locally'],
    [custom.hudScale === '0.92', 'hud-scale-applied'],
    [seated.buttonDisplay === 'none' && seated.panelHidden === true, 'calibration-hidden-seated'],
    [Number(seated.state?.gyroEvents || 0) >= 1, 'gyro-calibration-consumed'],
    [Number(seated.state?.potObjects || 0) >= 1, 'pot-object-calibrated'],
    [Number(seated.state?.avatarObjects || 0) >= 5, 'avatar-seats-calibrated'],
    [Math.abs(Number(reset.calibration?.tableYOffset || 0)) < 0.0001, 'table-reset'],
    [Math.abs(Number(reset.calibration?.hudScale || 1) - 1) < 0.0001, 'hud-reset'],
    [Math.abs(Number(reset.calibration?.potOpacity || 0) - 0.88) < 0.0001, 'pot-opacity-reset'],
    [Math.abs(Number(reset.table?.calibratedReferenceLineY || 99)) < 0.012, 'phase365-floor-line-restored'],
    [reset.qa?.pass === true, 'reset-runtime-qa'],
    [lobbyReturn.buttonDisplay !== 'none', 'calibration-returns-in-lobby'],
    [lobbyReturn.moveDisplay !== 'none' && lobbyReturn.lookDisplay !== 'none', 'controller-returns-in-lobby'],
    [errors.length === 0, 'no-page-console-errors'],
    [failedRequests.filter((entry) => entry.includes(base)).length === 0, 'no-local-request-failures']
  ];

  const failures = checks.filter(([pass]) => !pass).map(([, label]) => label);
  const result = {
    build: 'PHASE-366-ANDROID-DEVICE-CALIBRATION-AVATAR-LIVE-CAMERA-LOCK',
    baseline,
    custom,
    seated,
    reset,
    lobbyReturn,
    errors,
    failedRequests,
    failures,
    pass: failures.length === 0
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (!result.pass) process.exit(1);
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
