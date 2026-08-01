const { chromium } = require('playwright');

(async () => {
  const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/132.0 Mobile Safari/537.36'
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const httpErrors = [];
  const requestFailures = [];
  const startedAt = Date.now();
  const compactUrl = (value) => {
    try {
      const url = new URL(value);
      return url.origin === new URL(base).origin ? `${url.pathname}${url.search}` : url.href;
    } catch {
      return String(value || '');
    }
  };

  page.on('pageerror', (error) => {
    pageErrors.push({
      message: String(error?.message || error),
      stack: String(error?.stack || '')
    });
  });
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location();
    consoleErrors.push({
      text: message.text(),
      url: compactUrl(location?.url || ''),
      line: location?.lineNumber ?? null,
      column: location?.columnNumber ?? null
    });
  });
  page.on('response', (response) => {
    if (response.status() < 400) return;
    httpErrors.push({
      status: response.status(),
      url: compactUrl(response.url()),
      resourceType: response.request().resourceType()
    });
  });
  page.on('requestfailed', (request) => {
    requestFailures.push({
      url: compactUrl(request.url()),
      resourceType: request.resourceType(),
      failure: request.failure()?.errorText || 'unknown'
    });
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
    pageErrors.push({ message: String(error?.message || error), stack: String(error?.stack || '') });
  }

  const result = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource')
      .map((entry) => ({
        name: entry.name,
        initiatorType: entry.initiatorType,
        durationMs: Math.round(entry.duration),
        transferSize: Number(entry.transferSize || 0),
        decodedBodySize: Number(entry.decodedBodySize || 0)
      }))
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 40);
    const platformState = window.SVR_PHASE340_PLATFORM_STATE || null;
    return {
      acceptance: window.SVR_PHASE354_ACCEPTANCE_RESULT || null,
      progress: window.SVR_PHASE354_PROGRESS || null,
      qa: window.SVR_PHASE354_QA?.() || window.SVR_PHASE354_QA_STATE || null,
      runtime: {
        platformReady: Boolean(window.SVR_PLATFORM_READY || window.__SVR_GAME_READY__ || window.SVR_GAME_READY),
        platformState,
        platformAudit: window.SVR_PHASE340_AUDIT?.() || null,
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
      },
      performance: {
        navigation: navigation ? {
          domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
          loadEventMs: Math.round(navigation.loadEventEnd),
          responseEndMs: Math.round(navigation.responseEnd)
        } : null,
        resources
      }
    };
  });

  const unique = (items, key) => {
    const seen = new Set();
    return items.filter((item) => {
      const signature = key(item);
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  };
  const output = {
    ...result,
    elapsedMs: Date.now() - startedAt,
    timedOut,
    diagnostics: {
      pageErrors: unique(pageErrors, (item) => `${item.message}|${item.stack}`).slice(-40),
      consoleErrors: unique(consoleErrors, (item) => `${item.text}|${item.url}|${item.line}`).slice(-60),
      httpErrors: unique(httpErrors, (item) => `${item.status}|${item.url}`).slice(-80),
      requestFailures: unique(requestFailures, (item) => `${item.url}|${item.failure}`).slice(-40)
    }
  };
  console.log(JSON.stringify(output, null, 2));
  await browser.close();
  if (timedOut || !result.acceptance?.pass) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
