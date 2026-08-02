const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';

function diagnostics(page) {
  const state = { pageErrors: [], consoleErrors: [], requestFailures: [], httpErrors: [] };
  page.on('pageerror', (error) => state.pageErrors.push(String(error?.stack || error?.message || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') state.consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => state.requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', (response) => {
    if (response.url().startsWith(base) && response.status() >= 400) state.httpErrors.push(`${response.status()} ${response.url()}`);
  });
  return state;
}

async function tap(locator) {
  try { await locator.tap({ force: true, timeout: 10000 }); }
  catch { await locator.click({ force: true, timeout: 10000 }); }
}

async function verifyQuestPhase360(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; Quest 3) AppleWebKit/537.36 OculusBrowser/33.0 Chrome/132.0 Safari/537.36'
  });
  const page = await context.newPage();
  const errors = diagnostics(page);

  // Do not add preview=1 here. The preview flag deliberately redirects to
  // Camera 3. acceptance=1 with v=phase360 uses the route's existing legacy
  // acceptance branch to measure Phase 360 without the Phase 362 successor.
  await page.goto(`${base}/game/index.html?platform=quest&acceptance=1&v=phase360&phase360qa=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });
  await page.waitForFunction(() => {
    try {
      const qa = window.SVR_PHASE360_QA?.();
      return Boolean(qa?.active && qa?.nextHandWrapped && qa?.resetWrapped && qa?.deckFingerprint && qa?.prematureNextProtected);
    } catch {
      return false;
    }
  }, null, { timeout: 180000 });

  const first = await page.evaluate(() => window.SVR_PHASE360_QA());
  assert.equal(first.active, true);
  assert.equal(first.randomSource, 'crypto.getRandomValues');
  assert.equal(first.secureRandomAvailable, true);
  assert.equal(first.totalTableChips, 6000);
  assert.equal(first.stackChips + first.committedChips, 6000);
  assert.equal(first.fundedPlayers, 6);
  assert.equal(first.exactDeckRepeats, 0);
  assert.equal(first.pass, true);
  assert.ok(first.deckFingerprint);

  const firstFingerprint = first.deckFingerprint;
  const firstHandNo = first.handNo;
  const prematureNext = await page.evaluate(() => window.SVR_PHASE360_SECURE_NEXT_HAND());
  assert.equal(prematureNext, false, 'Quest NEXT HAND must be rejected while a hand is active');
  const guarded = await page.evaluate(() => window.SVR_PHASE360_QA());
  assert.equal(guarded.handNo, firstHandNo);
  assert.equal(guarded.rejectedPrematureNext >= 1, true);
  assert.equal(guarded.totalTableChips, 6000);

  await page.evaluate(() => window.SVR_PHASE360_FRESH_HAND());
  await page.waitForFunction((fingerprint) => {
    const qa = window.SVR_PHASE360_QA?.();
    return Boolean(qa?.deckFingerprint && qa.deckFingerprint !== fingerprint);
  }, firstFingerprint, { timeout: 30000 });
  const second = await page.evaluate(() => window.SVR_PHASE360_QA());
  assert.notEqual(second.deckFingerprint, firstFingerprint);
  assert.equal(second.exactDeckRepeats, 0);
  assert.equal(second.totalTableChips, 6000);
  assert.equal(second.pass, true);

  await page.evaluate(() => window.SVR_PHASE360_LEAVE_TABLE());
  await page.waitForFunction(() => window.SVR_PHASE360_QA?.().leaveResetArmed === true, null, { timeout: 10000 });
  const left = await page.evaluate(() => window.SVR_PHASE360_QA());
  assert.equal(left.leaveResetArmed, true);
  assert.equal(left.continuous, false);
  assert.equal(left.totalTableChips, 6000);

  await page.evaluate(() => window.SVR_PHASE360_JOIN_TABLE());
  await page.waitForFunction(() => {
    const qa = window.SVR_PHASE360_QA?.();
    return Boolean(qa && qa.leaveResetArmed === false && qa.handNo === 1 && qa.counters.joinResets >= 1);
  }, null, { timeout: 30000 });
  const joined = await page.evaluate(() => window.SVR_PHASE360_QA());
  assert.equal(joined.handNo, 1);
  assert.equal(joined.totalTableChips, 6000);
  assert.equal(joined.fundedPlayers, 6);
  assert.equal(joined.continuous, true);
  assert.notEqual(joined.deckFingerprint, second.deckFingerprint);
  assert.equal(joined.exactDeckRepeats, 0);
  assert.equal(joined.pass, true);

  assert.deepEqual(errors.pageErrors, []);
  assert.deepEqual(errors.consoleErrors, []);
  assert.deepEqual(errors.requestFailures, []);
  assert.deepEqual(errors.httpErrors, []);
  await context.close();

  return {
    platform: 'quest',
    route: '/game/index.html?platform=quest&acceptance=1&v=phase360',
    phase360Active: true,
    randomSource: joined.randomSource,
    firstHandNo,
    secondHandNo: second.handNo,
    joinedHandNo: joined.handNo,
    fingerprintsDifferent: firstFingerprint !== second.deckFingerprint && second.deckFingerprint !== joined.deckFingerprint,
    prematureNextRejected: prematureNext === false,
    rejectedPrematureNext: joined.rejectedPrematureNext,
    leaveResetArmed: left.leaveResetArmed,
    joinResets: joined.counters.joinResets,
    exactDeckRepeats: joined.exactDeckRepeats,
    totalTableChips: joined.totalTableChips,
    errors
  };
}

async function verifyAndroidPhase363(browser) {
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/132.0 Mobile Safari/537.36',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  const errors = diagnostics(page);

  await page.goto(`${base}/game/android.html?channel=stable&v=phase363&phase360compat=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });
  await page.waitForFunction(() => (
    typeof window.SVR_PHASE363_SECURE_SHUFFLE_QA === 'function'
    && typeof window.SVR_PHASE363_JOIN_CONTROL_QA === 'function'
    && typeof window.SVR_PHASE363_CONSISTENCY_QA === 'function'
    && window.SVR_PHASE363_STATE?.gameState === 'LOBBY'
    && window.SVR_PHASE363_JOINED_IMMEDIATE === false
  ), null, { timeout: 120000 });
  await page.waitForTimeout(700);

  const lobby = await page.evaluate(() => ({
    phase360Type: typeof window.SVR_PHASE360_QA,
    secure: window.SVR_PHASE363_SECURE_SHUFFLE_QA(),
    join: window.SVR_PHASE363_JOIN_CONTROL_QA(),
    consistency: window.SVR_PHASE363_CONSISTENCY_QA(),
    joined: Boolean(window.SVR_PHASE363_STATE?.joined),
    gameState: window.SVR_PHASE363_STATE?.gameState,
    phase: window.SVR_PHASE336_POKER_STATE?.phase,
    seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || null,
    audit: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null
  }));
  assert.equal(lobby.phase360Type, 'undefined', 'Android must not load the retired Phase 360 auto-session controller');
  assert.equal(lobby.secure.pass, true);
  assert.equal(lobby.secure.randomSource, 'crypto.getRandomValues');
  assert.equal(lobby.join.pass, true);
  assert.equal(lobby.joined, false);
  assert.equal(lobby.gameState, 'LOBBY');
  assert.equal(lobby.phase, 'idle');
  assert.equal(lobby.seatText, 'JOIN TABLE');
  assert.equal(lobby.consistency.effectiveTableChips, 90000);
  assert.equal((lobby.audit.players || []).every((player) => player.hand.length === 0), true);

  await tap(page.locator('#svr347Actions [data-ui="seat"]'));
  await page.waitForFunction(() => {
    const qa = window.SVR_PHASE363_SECURE_SHUFFLE_QA?.();
    return Boolean(
      window.SVR_PHASE363_STATE?.joined === true
      && window.SVR_PHASE363_JOINED_IMMEDIATE === true
      && qa?.deckFingerprint
      && window.SVR_PHASE336_POKER_STATE?.handNo === 1
      && window.SVR_PHASE336_POKER_STATE?.phase === 'preflop'
    );
  }, null, { timeout: 30000 });
  const first = await page.evaluate(() => ({
    secure: window.SVR_PHASE363_SECURE_SHUFFLE_QA(),
    consistency: window.SVR_PHASE363_CONSISTENCY_QA(),
    join: window.SVR_PHASE363_JOIN_CONTROL_QA(),
    audit: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null
  }));
  assert.equal(first.secure.pass, true);
  assert.equal(first.secure.exactDeckRepeats, 0);
  assert.equal(first.secure.effectiveTableChips, 90000);
  assert.equal(first.consistency.effectiveTableChips, 90000);
  assert.equal(first.join.pass, true);
  assert.equal(first.audit.players[0].hand.length, 2);
  const firstFingerprint = first.secure.deckFingerprint;

  await page.waitForTimeout(700);
  await tap(page.locator('#svr347Actions [data-ui="seat"]'));
  await page.waitForFunction(() => (
    window.SVR_PHASE363_STATE?.joined === false
    && window.SVR_PHASE336_POKER_STATE?.phase === 'idle'
    && window.SVR_PHASE363_CONSISTENCY_QA?.()?.lobbyCardsCleared === true
  ), null, { timeout: 15000 });
  const left = await page.evaluate(() => ({
    joined: Boolean(window.SVR_PHASE363_STATE?.joined),
    phase: window.SVR_PHASE336_POKER_STATE?.phase,
    join: window.SVR_PHASE363_JOIN_CONTROL_QA(),
    consistency: window.SVR_PHASE363_CONSISTENCY_QA(),
    audit: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null
  }));
  assert.equal(left.joined, false);
  assert.equal(left.phase, 'idle');
  assert.equal(left.join.pass, true);
  assert.equal(left.consistency.lobbyCardsCleared, true);
  assert.equal((left.audit.players || []).every((player) => player.hand.length === 0), true);

  await page.waitForTimeout(700);
  await tap(page.locator('#svr347Actions [data-ui="seat"]'));
  await page.waitForFunction((previous) => {
    const qa = window.SVR_PHASE363_SECURE_SHUFFLE_QA?.();
    return Boolean(
      window.SVR_PHASE363_STATE?.joined === true
      && window.SVR_PHASE336_POKER_STATE?.handNo === 1
      && qa?.deckFingerprint
      && qa.deckFingerprint !== previous
    );
  }, firstFingerprint, { timeout: 30000 });
  const rejoined = await page.evaluate(() => ({
    secure: window.SVR_PHASE363_SECURE_SHUFFLE_QA(),
    consistency: window.SVR_PHASE363_CONSISTENCY_QA(),
    join: window.SVR_PHASE363_JOIN_CONTROL_QA(),
    audit: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null,
    handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
    phase: window.SVR_PHASE336_POKER_STATE?.phase
  }));
  assert.equal(rejoined.secure.pass, true);
  assert.equal(rejoined.secure.randomSource, 'crypto.getRandomValues');
  assert.notEqual(rejoined.secure.deckFingerprint, firstFingerprint);
  assert.equal(rejoined.secure.exactDeckRepeats, 0);
  assert.equal(rejoined.secure.secureJoins >= 2, true);
  assert.equal(rejoined.consistency.effectiveTableChips, 90000);
  assert.equal(rejoined.join.pass, true);
  assert.equal(rejoined.handNo, 1);
  assert.equal(rejoined.phase, 'preflop');
  assert.equal(rejoined.audit.players.length, 6);
  assert.equal(rejoined.audit.players[0].hand.length, 2);

  assert.deepEqual(errors.pageErrors, []);
  assert.deepEqual(errors.consoleErrors, []);
  assert.deepEqual(errors.requestFailures, []);
  assert.deepEqual(errors.httpErrors, []);
  await context.close();

  return {
    platform: 'android',
    phase360AutoSessionLoaded: false,
    phase363SecureShuffle: true,
    randomSource: rejoined.secure.randomSource,
    firstFingerprint,
    secondFingerprint: rejoined.secure.deckFingerprint,
    fingerprintsDifferent: firstFingerprint !== rejoined.secure.deckFingerprint,
    exactDeckRepeats: rejoined.secure.exactDeckRepeats,
    secureJoins: rejoined.secure.secureJoins,
    leaveClearedCards: left.consistency.lobbyCardsCleared,
    totalTableChips: rejoined.consistency.effectiveTableChips,
    errors
  };
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
  });
  try {
    const quest = await verifyQuestPhase360(browser);
    const android = await verifyAndroidPhase363(browser);
    console.log(JSON.stringify({
      pass: true,
      contract: 'Phase 360 secure session on Quest; Phase 363 secure deliberate JOIN on Android',
      quest,
      android
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
