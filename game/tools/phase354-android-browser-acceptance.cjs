'use strict';

const { chromium } = require('playwright');

const BASE = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const URL = `${BASE}/game/android-stable.html?v=phase380&phase354compat=1`;
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36';

async function waitFor(page, evaluator, timeout = 60000) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeout) {
    try {
      last = await page.evaluate(evaluator);
      if (last) return last;
    } catch {}
    await page.waitForTimeout(150);
  }
  throw new Error(`Timed out waiting for Android Phase 380 state: ${JSON.stringify(last)}`);
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
      const qa = window.SVR_PHASE380_ANDROID_QA?.();
      const gate = document.getElementById('gate');
      const table = document.getElementById('table');
      const result = {
        qa,
        joinText: document.getElementById('join')?.textContent?.trim() || '',
        joinVisible: Boolean(gate && !gate.classList.contains('hide')),
        tableHidden: Boolean(table?.classList.contains('hide')),
        cards: document.querySelectorAll('#community .card,#hole .card').length,
        actionsVisible: [...document.querySelectorAll('.actions button')].some((button) => button.offsetParent !== null),
        movementControls: document.querySelectorAll('.virtual-stick,[data-svr-android-controller],#svr347Move,#svr347Look').length
      };
      return result.qa?.build === 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK'
        && result.qa?.cardsBeforeJoin === 0
        && result.joinText === 'JOIN NOW'
        && result.joinVisible
        && result.tableHidden
        && result.cards === 0
        && !result.actionsVisible
        && result.movementControls === 0
        ? result : null;
    });

    await page.evaluate(() => {
      const nativeRandom = Math.random;
      Math.random = () => 0.99;
      window.SVR_PHASE380_QA_RANDOM_LOCKED = true;
      window.SVR_PHASE380_QA_RESTORE_RANDOM = () => { Math.random = nativeRandom; };
    });
    await page.click('#join');
    const seated = await waitFor(page, () => {
      const qa = window.SVR_PHASE380_ANDROID_QA?.();
      const slot = document.getElementById('brandSlot');
      const style = slot ? getComputedStyle(slot) : null;
      const rect = slot?.getBoundingClientRect?.();
      const result = {
        qa,
        tableVisible: !document.getElementById('table')?.classList.contains('hide'),
        gateHidden: document.getElementById('gate')?.classList.contains('hide'),
        playerCards: document.querySelectorAll('#hole .card').length,
        communitySlots: document.querySelectorAll('#community .card').length,
        bots: document.querySelectorAll('#bots .bot').length,
        actions: document.querySelectorAll('.actions button').length,
        movementControls: document.querySelectorAll('.virtual-stick,[data-svr-android-controller],#svr347Move,#svr347Look').length,
        brandVisible: Boolean(slot && style?.display !== 'none' && style?.visibility !== 'hidden' && Number(style?.opacity || 1) > 0 && rect?.width > 0 && rect?.height > 0),
        status: document.getElementById('status')?.textContent || ''
      };
      return result.qa?.joined === true
        && result.qa?.players === 6
        && result.qa?.rankUsesTen === true
        && result.qa?.deterministicHandEvaluator === true
        && result.qa?.movementControlsWhileSeated === 0
        && result.tableVisible
        && result.gateHidden
        && result.playerCards === 2
        && result.communitySlots === 5
        && result.bots === 5
        && result.actions === 4
        && result.movementControls === 0
        && result.brandVisible
        && /YOUR TURN/.test(result.status)
        ? result : null;
    });

    const brand = await page.evaluate(() => window.SVR_PHASE380_SET_BRAND?.({ id: 'qa-tournament', name: 'QA TOURNAMENT', logoUrl: '/logo.png' }));
    const branding = await waitFor(page, () => {
      const slot = document.getElementById('brandSlot');
      const style = slot ? getComputedStyle(slot) : null;
      const rect = slot?.getBoundingClientRect?.();
      const result = {
        visible: Boolean(slot && style?.display !== 'none' && style?.visibility !== 'hidden' && Number(style?.opacity || 1) > 0 && rect?.width > 0 && rect?.height > 0),
        name: document.getElementById('brandName')?.textContent || '',
        logo: document.getElementById('brandLogo')?.getAttribute('src') || ''
      };
      return result.visible && result.name === 'QA TOURNAMENT' && result.logo === '/logo.png' ? result : null;
    });

    const phases = [];
    for (let action = 0; action < 4; action += 1) {
      phases.push((await page.textContent('#status') || '').trim());
      await page.click('[data-a="call"]');
      await page.waitForTimeout(100);
      if (await page.locator('#next').isVisible()) break;
    }

    const showdown = await waitFor(page, () => {
      const qa = window.SVR_PHASE380_ANDROID_QA?.();
      const result = {
        qa,
        status: document.getElementById('status')?.textContent || '',
        community: document.querySelectorAll('#community .card:not(.back)').length,
        hole: document.querySelectorAll('#hole .card:not(.back)').length,
        nextVisible: Boolean(document.getElementById('next')?.offsetParent),
        actionDisabled: [...document.querySelectorAll('.actions button')].every((button) => button.disabled),
        pot: document.getElementById('pot')?.textContent || '',
        stack: document.getElementById('stack')?.textContent || '',
        cardCorners: document.querySelectorAll('#community .card:not(.back) .corner').length,
        centerSuits: document.querySelectorAll('#community .card:not(.back) .suit').length
      };
      return /WINS \$|WIN \$/.test(result.status)
        && result.community === 5
        && result.hole === 2
        && result.qa?.burnCards === 3
        && result.nextVisible
        && result.actionDisabled
        && result.cardCorners === 10
        && result.centerSuits === 5
        ? result : null;
    });

    const dealerBefore = (await page.textContent('#dealer') || '').trim();
    await page.click('#next');
    const nextHand = await waitFor(page, () => {
      const dealer = document.getElementById('dealer')?.textContent || '';
      const result = {
        dealer,
        status: document.getElementById('status')?.textContent || '',
        playerCards: document.querySelectorAll('#hole .card:not(.back)').length,
        nextHidden: document.getElementById('next')?.classList.contains('hide'),
        actionEnabled: [...document.querySelectorAll('.actions button')].every((button) => !button.disabled)
      };
      return dealer && dealer !== dealerBefore
        && /YOUR TURN/.test(result.status)
        && result.playerCards === 2
        && result.nextHidden
        && result.actionEnabled
        ? result : null;
    });

    const filteredConsole = consoleErrors.filter((line) => !/favicon/i.test(line));
    const filteredFailures = requestFailures.filter((line) => !/favicon/i.test(line));
    const pass = lobby.joinVisible
      && seated.playerCards === 2
      && brand?.id === 'qa-tournament'
      && branding.name === 'QA TOURNAMENT'
      && showdown.community === 5
      && showdown.qa?.burnCards === 3
      && nextHand.dealer !== dealerBefore
      && pageErrors.length === 0
      && filteredConsole.length === 0
      && httpErrors.length === 0
      && filteredFailures.length === 0;

    const report = {
      pass,
      build: 'PHASE-354-PROTECTED-BY-PHASE-380-STANDALONE-ACCEPTANCE',
      url: URL,
      lobby,
      seated,
      branding,
      phases,
      showdown,
      nextHand,
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
