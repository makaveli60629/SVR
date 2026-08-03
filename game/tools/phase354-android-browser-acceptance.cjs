const { chromium } = require('playwright');

async function tap(locator) {
  try {
    await locator.tap({ force: true, timeout: 10000 });
  } catch {
    await locator.click({ force: true, timeout: 10000 });
  }
}

async function joinAndroidTable(page) {
  const phase372Entry = page.locator('#svr372Primary');
  if (await phase372Entry.count() && await phase372Entry.isVisible().catch(() => false)) {
    await tap(phase372Entry);
    return 'phase372-visible-entry';
  }
  const phase369Entry = page.locator('#svr369Join');
  if (await phase369Entry.count() && await phase369Entry.isVisible().catch(() => false)) {
    await tap(phase369Entry);
    return 'phase369-visible-entry';
  }
  await tap(page.locator('#svr347Actions [data-ui="seat"]'));
  return 'phase347-authoritative-seat';
}

(async () => {
  const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
  const baseOrigin = new URL(base).origin;
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/132.0 Mobile Safari/537.36',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2
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
      return url.origin === baseOrigin ? `${url.pathname}${url.search}` : url.href;
    } catch {
      return String(value || '');
    }
  };
  const isSameOrigin = (value) => {
    try { return new URL(value, base).origin === baseOrigin; }
    catch { return true; }
  };

  page.on('pageerror', (error) => pageErrors.push({
    message: String(error?.message || error),
    stack: String(error?.stack || '')
  }));
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
    if (response.status() < 400 || !isSameOrigin(response.url())) return;
    httpErrors.push({
      status: response.status(),
      url: compactUrl(response.url()),
      resourceType: response.request().resourceType()
    });
  });
  page.on('requestfailed', (request) => {
    if (!isSameOrigin(request.url())) return;
    requestFailures.push({
      url: compactUrl(request.url()),
      resourceType: request.resourceType(),
      failure: request.failure()?.errorText || 'unknown'
    });
  });

  const url = `${base}/game/android.html?channel=stable&v=phase372&phase354compat=1`;
  let report = null;
  let fatal = null;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => (
      typeof window.SVR_PHASE372_QA === 'function'
      && typeof window.SVR_PHASE354_QA === 'function'
      && typeof window.SVR_PHASE355_RUN_FULL_HAND_QA === 'function'
      && typeof window.SVR_PHASE363_JOIN_TABLE === 'function'
      && typeof window.SVR_PHASE363_LEAVE_TABLE === 'function'
      && typeof window.SVR_PHASE363_JOIN_CONTROL_QA === 'function'
      && typeof window.SVR_PHASE363_CONSISTENCY_QA === 'function'
      && typeof window.SVR_PHASE363_TABLE_QA === 'function'
      && window.SVR_PHASE363_STATE?.installedAt
      && window.SVR_PHASE363_STATE?.gameState === 'LOBBY'
      && window.SVR_PHASE363_STATE?.joined === false
      && Boolean(document.getElementById('svr372Primary')?.offsetParent)
    ), null, { timeout: 120000 });
    await page.waitForTimeout(1000);

    const lobby = await page.evaluate(() => ({
      joined: Boolean(window.SVR_PHASE363_STATE?.joined),
      joinedImmediate: Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE),
      gameState: window.SVR_PHASE363_STATE?.gameState || null,
      join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
      table: window.SVR_PHASE363_TABLE_QA?.() || null,
      consistency: window.SVR_PHASE363_CONSISTENCY_QA?.() || null,
      controller: window.SVR_PHASE350_ANDROID_CONTROLLER_QA?.() || null,
      phase354: window.SVR_PHASE354_QA?.() || null,
      phase372: window.SVR_PHASE372_QA?.() || null,
      seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || null,
      phase372EntryVisible: Boolean(document.getElementById('svr372Primary')?.offsetParent),
      phase369EntryVisible: Boolean(document.getElementById('svr369Join')?.offsetParent),
      holeVisible: (() => {
        const element = document.getElementById('svr347Hole');
        return element ? getComputedStyle(element).display !== 'none' : false;
      })(),
      communityVisible: (() => {
        const element = document.getElementById('svr347Community');
        return element ? getComputedStyle(element).display !== 'none' : false;
      })()
    }));

    const firstJoinSurface = await joinAndroidTable(page);
    await page.waitForFunction(() => (
      window.SVR_PHASE363_STATE?.joined === true
      && Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE)
      && window.SVR_PHASE336_POKER_STATE?.phase === 'preflop'
      && (window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0]?.hand?.length || 0) === 2
    ), null, { timeout: 45000 });
    await page.waitForTimeout(900);

    const seated = await page.evaluate(() => ({
      phase354: window.SVR_PHASE354_QA?.() || null,
      phase347: window.SVR_PHASE347_QA?.() || null,
      phase372: window.SVR_PHASE372_QA?.() || null,
      join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
      seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || null,
      poker: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null
    }));

    const hand = await page.evaluate(() => window.SVR_PHASE355_RUN_FULL_HAND_QA({ maxHands: 1, timeoutMs: 90000 }));
    await page.waitForFunction(() => (
      window.SVR_PHASE336_POKER_STATE?.phase === 'showdown'
      && Array.isArray(window.SVR_PHASE336_POKER_STATE?.winners)
      && window.SVR_PHASE336_POKER_STATE.winners.length > 0
    ), null, { timeout: 10000 });
    await page.waitForTimeout(500);

    const showdown = await page.evaluate(() => ({
      phase354: window.SVR_PHASE354_QA?.() || null,
      phase347: window.SVR_PHASE347_QA?.() || null,
      phase372: window.SVR_PHASE372_QA?.() || null,
      handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      community: window.SVR_PHASE336_POKER_STATE?.community?.length || 0,
      burn: window.SVR_PHASE336_POKER_STATE?.burn?.length || 0,
      settledPot: Number(window.SVR_PHASE336_POKER_STATE?.settledPot || 0),
      winners: window.SVR_PHASE336_POKER_STATE?.winners || [],
      totalStacks: (window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players || [])
        .reduce((sum, player) => sum + Number(player.stack || 0), 0),
      resultTitle: document.getElementById('svr357ResultTitle')?.textContent || '',
      resultPot: document.getElementById('svr357ResultPot')?.textContent || '',
      winnerDetails: document.getElementById('svr357WinnerDetails')?.textContent || '',
      board: document.getElementById('svr357Board')?.textContent || '',
      betIndicators: document.querySelectorAll('.svr357Bet').length
    }));

    await page.waitForTimeout(700);
    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    await page.waitForFunction(() => (
      window.SVR_PHASE363_STATE?.joined === false
      && !Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE)
      && window.SVR_PHASE336_POKER_STATE?.phase === 'idle'
      && window.SVR_PHASE363_CONSISTENCY_QA?.()?.lobbyCardsCleared === true
      && Boolean(document.getElementById('svr372Primary')?.offsetParent)
    ), null, { timeout: 15000 });
    await page.waitForTimeout(700);

    const left = await page.evaluate(() => ({
      joined: Boolean(window.SVR_PHASE363_STATE?.joined),
      joinedImmediate: Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE),
      gameState: window.SVR_PHASE363_STATE?.gameState || null,
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
      consistency: window.SVR_PHASE363_CONSISTENCY_QA?.() || null,
      seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || null,
      phase372EntryVisible: Boolean(document.getElementById('svr372Primary')?.offsetParent),
      phase369EntryVisible: Boolean(document.getElementById('svr369Join')?.offsetParent),
      phase372: window.SVR_PHASE372_QA?.() || null,
      audit: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null
    }));

    const rejoinSurface = await joinAndroidTable(page);
    await page.waitForFunction(() => (
      window.SVR_PHASE363_STATE?.joined === true
      && Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE)
      && window.SVR_PHASE336_POKER_STATE?.handNo === 1
      && window.SVR_PHASE336_POKER_STATE?.phase === 'preflop'
      && (window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0]?.hand?.length || 0) === 2
    ), null, { timeout: 45000 });
    await page.waitForTimeout(900);

    const rejoined = await page.evaluate(() => ({
      joined: Boolean(window.SVR_PHASE363_STATE?.joined),
      joinedImmediate: Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE),
      gameState: window.SVR_PHASE363_STATE?.gameState || null,
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
      join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
      consistency: window.SVR_PHASE363_CONSISTENCY_QA?.() || null,
      table: window.SVR_PHASE363_TABLE_QA?.() || null,
      phase354: window.SVR_PHASE354_QA?.() || null,
      phase372: window.SVR_PHASE372_QA?.() || null,
      seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || null,
      audit: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null
    }));

    report = {
      build: 'PHASE-354-ANDROID-FULL-GAME-RELEASE-ACCEPTANCE-LOCK',
      successor: 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK',
      url,
      firstJoinSurface,
      rejoinSurface,
      lobby,
      seated,
      hand,
      showdown,
      left,
      rejoined,
      compatibilityBankrolls: {
        isolatedLegacyDriver: Number(hand?.record?.expectedTableBankroll || 0),
        phase363ReleaseTable: Number(rejoined?.consistency?.expectedTableChips || 0)
      },
      elapsedMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    fatal = String(error?.stack || error);
  }

  const unique = (items, key) => {
    const seen = new Set();
    return items.filter((item) => {
      const signature = key(item);
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  };
  const diagnostics = {
    fatal,
    pageErrors: unique(pageErrors, (item) => `${item.message}|${item.stack}`).slice(-40),
    consoleErrors: unique(consoleErrors, (item) => `${item.text}|${item.url}|${item.line}`).slice(-60),
    httpErrors: unique(httpErrors, (item) => `${item.status}|${item.url}`).slice(-80),
    requestFailures: unique(requestFailures, (item) => `${item.url}|${item.failure}`).slice(-40)
  };

  const legacyExpected = Number(report?.hand?.record?.expectedTableBankroll || 0);
  const legacySettled = Number(report?.hand?.record?.totalStacks || -1);
  const lobbyHandsClear = (report?.left?.audit?.players || []).every((player) => player.hand?.length === 0);
  const releasePlayers = report?.rejoined?.audit?.players || [];
  const releaseEffective = Number(report?.rejoined?.consistency?.effectiveTableChips || 0);
  const releaseExpected = Number(report?.rejoined?.consistency?.expectedTableChips || 0);

  const quality = {
    historicalPresentationPassed: report?.showdown?.phase354?.controller?.pass === true
      && report?.showdown?.phase354?.cards?.pass === true
      && report?.showdown?.phase354?.table?.table === true
      && report?.showdown?.phase354?.table?.logo === true
      && report?.showdown?.phase354?.table?.potDisplay === true,
    isolatedHandPassed: report?.hand?.pass === true
      && legacyExpected === 6000
      && legacySettled === 6000
      && Number(report?.showdown?.settledPot || 0) > 0
      && report?.showdown?.community === 5
      && report?.showdown?.burn === 3
      && (report?.showdown?.winners || []).length > 0,
    deliberateJoinPassed: report?.firstJoinSurface === 'phase372-visible-entry'
      && report?.lobby?.joined === false
      && report?.lobby?.join?.pass === true
      && report?.lobby?.seatText === 'JOIN TABLE'
      && report?.lobby?.phase372EntryVisible === true
      && report?.lobby?.phase372?.pass === true
      && report?.seated?.join?.pass === true
      && report?.seated?.seatText === 'LEAVE TABLE'
      && report?.seated?.poker?.players?.[0]?.hand?.length === 2,
    leavePassed: report?.left?.joined === false
      && report?.left?.joinedImmediate === false
      && report?.left?.gameState === 'LOBBY'
      && report?.left?.phase === 'idle'
      && report?.left?.seatText === 'JOIN TABLE'
      && report?.left?.join?.pass === true
      && report?.left?.consistency?.lobbyCardsCleared === true
      && report?.left?.phase372EntryVisible === true
      && report?.left?.phase372?.primaryText === 'JOIN TABLE'
      && lobbyHandsClear,
    freshReleaseRejoinPassed: report?.rejoinSurface === 'phase372-visible-entry'
      && report?.rejoined?.joined === true
      && report?.rejoined?.joinedImmediate === true
      && report?.rejoined?.gameState === 'SEATED'
      && report?.rejoined?.handNo === 1
      && report?.rejoined?.phase === 'preflop'
      && report?.rejoined?.seatText === 'LEAVE TABLE'
      && report?.rejoined?.join?.pass === true
      && report?.rejoined?.table?.pass === true
      && releasePlayers.length === 6
      && releasePlayers[0]?.hand?.length === 2
      && releaseEffective === 90000
      && releaseExpected === 90000,
    oneController: report?.rejoined?.phase354?.controller?.roots === 1
      && report?.rejoined?.phase354?.controller?.move === 1
      && report?.rejoined?.phase354?.controller?.look === 1
      && report?.rejoined?.phase354?.controller?.legacy?.visibleLegacyRoots === 0,
    noRuntimeErrors: !fatal
      && diagnostics.pageErrors.length === 0
      && diagnostics.consoleErrors.length === 0
      && diagnostics.httpErrors.length === 0
      && diagnostics.requestFailures.length === 0
  };
  quality.pass = Object.values(quality).every(Boolean);

  const output = { ...report, quality, diagnostics };
  console.log(JSON.stringify(output, null, 2));
  await browser.close();
  if (!quality.pass) process.exit(1);
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});