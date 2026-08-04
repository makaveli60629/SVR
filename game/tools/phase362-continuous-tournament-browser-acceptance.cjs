const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';

function attachDiagnostics(page) {
  const report = { pageErrors: [], consoleErrors: [], requestFailures: [] };
  page.on('pageerror', (error) => report.pageErrors.push(String(error?.message || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') report.consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    report.requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`);
  });
  return report;
}

async function waitForPhase362(page, timeout = 180000, requireAndroidLeft = false) {
  await page.waitForFunction((needsAndroidLeft) => {
    try {
      const policyReady = typeof window.SVR_PHASE362_QA === 'function'
        && Boolean(window.SVR_PHASE362_STATE)
        && Boolean(window.SVR_PHASE362_CONSTANTS);
      const settlementReady = typeof window.SVR_PHASE362_SETTLEMENT_QA === 'function'
        && Boolean(window.SVR_PHASE362_SETTLEMENT_STATE);
      const leftReady = !needsAndroidLeft || window.SVR_PHASE362_QA_LEFT_READY === true;
      return policyReady && settlementReady && leftReady;
    } catch {
      return false;
    }
  }, requireAndroidLeft, { timeout });
}

async function policySnapshot(page) {
  return page.evaluate(() => ({
    qa: window.SVR_PHASE362_QA(),
    settlement: window.SVR_PHASE362_SETTLEMENT_QA?.() || null,
    engine: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null,
    phase361: window.SVR_PHASE361_QA?.() || null,
    phase347: window.SVR_PHASE347_STATE || null
  }));
}

function assertClean(report, label) {
  assert.deepEqual(report.pageErrors, [], `${label} page errors`);
  assert.deepEqual(report.consoleErrors, [], `${label} console errors`);
  assert.deepEqual(report.requestFailures, [], `${label} request failures`);
}

async function testAndroid(browser) {
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SVR Phase362 QA) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36'
  });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  await page.goto(`${base}/game/android.html?channel=stable&v=phase362&phase362qa=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });
  await waitForPhase362(page, 180000, true);

  let snapshot = await policySnapshot(page);
  assert.equal(snapshot.settlement.runtimePlatform, 'android');
  assert.equal(snapshot.settlement.androidQaForceLeft, true);
  assert.equal(snapshot.settlement.qaLeftReady, true);
  assert.equal(snapshot.qa.startingStack, 10000);
  assert.equal(snapshot.qa.tableBankroll, 60000);
  assert.equal(snapshot.qa.turnSeconds, 15);
  assert.equal(snapshot.qa.totalTableChips, 60000);
  assert.equal(snapshot.qa.awayFromTable, true, 'Android clock must pause before SIT');

  await page.evaluate(() => {
    window.SVR_POKER_QA_PASSIVE_BOTS = true;
    window.SVR_PHASE362_JOIN_TABLE();
  });
  await page.waitForFunction(() => {
    const qa = window.SVR_PHASE362_QA?.();
    return Boolean(qa?.pass && qa.awayFromTable === false && qa.totalTableChips === 60000);
  }, null, { timeout: 30000 });
  await page.waitForFunction(() => {
    const qa = window.SVR_PHASE362_QA?.();
    return qa?.currentPlayer === 'YOU' && Number(qa.remainingSeconds) >= 13;
  }, null, { timeout: 45000 });

  const beforeTimeout = await page.evaluate(() => ({
    timeoutFolds: window.SVR_PHASE362_STATE.timeoutFolds,
    handNo: window.SVR_PHASE336_POKER_STATE.handNo,
    deadlineDelta: window.SVR_PHASE362_STATE.deadline - Date.now(),
    current: window.SVR_PHASE362_STATE.currentPlayerName
  }));
  assert.equal(beforeTimeout.current, 'YOU');
  assert.ok(beforeTimeout.deadlineDelta > 12000 && beforeTimeout.deadlineDelta <= 15100);

  await page.waitForFunction((prior) => {
    return Number(window.SVR_PHASE362_STATE?.timeoutFolds || 0) > prior;
  }, beforeTimeout.timeoutFolds, { timeout: 22000 });
  const afterTimeout = await page.evaluate(() => ({
    timeoutFolds: window.SVR_PHASE362_STATE.timeoutFolds,
    lastTimeout: window.SVR_PHASE362_STATE.lastTimeout,
    current: window.SVR_PHASE362_STATE.currentPlayerName,
    engine: window.SVR_RUN_PHASE336_POKER_AUDIT()
  }));
  assert.equal(afterTimeout.timeoutFolds, beforeTimeout.timeoutFolds + 1);
  assert.equal(afterTimeout.lastTimeout.playerName, 'YOU');
  assert.equal(afterTimeout.engine.players[0].lastAction, 'Timeout Fold');

  await page.waitForFunction((handNo) => {
    const active = window.SVR_PHASE336_POKER_STATE;
    return Number(active?.handNo || 0) > handNo;
  }, beforeTimeout.handNo, { timeout: 90000 });
  const continued = await policySnapshot(page);
  assert.equal(continued.qa.totalTableChips, 60000);
  assert.ok(continued.qa.handNo > beforeTimeout.handNo, 'continuous play must advance to another hand');

  await page.evaluate(() => window.SVR_PHASE362_LEAVE_TABLE());
  await page.waitForFunction(() => window.SVR_PHASE362_QA?.().awayFromTable === true, null, { timeout: 10000 });
  const left = await policySnapshot(page);
  assert.equal(left.qa.continuous, false);

  const resetsBefore = await page.evaluate(() => window.SVR_PHASE362_STATE.rejoinResets);
  await page.evaluate(() => window.SVR_PHASE362_JOIN_TABLE());
  await page.waitForFunction((prior) => {
    const qa = window.SVR_PHASE362_QA?.();
    return Boolean(qa && qa.awayFromTable === false && qa.handNo === 1
      && qa.totalTableChips === 60000
      && window.SVR_PHASE362_STATE.rejoinResets > prior);
  }, resetsBefore, { timeout: 30000 });
  const rejoined = await policySnapshot(page);
  assert.equal(rejoined.qa.handNo, 1);
  assert.equal(rejoined.qa.fundedPlayers, 6);
  assert.equal(rejoined.qa.totalTableChips, 60000);
  for (const player of rejoined.engine.players) {
    assert.equal(player.stack + player.contributed, 10000, `${player.name} must rejoin with a 10,000-chip buy-in`);
  }

  await page.evaluate(async () => {
    const engine = await import('./modules/phase336_authoritative_engine.js');
    engine.players.forEach((player, index) => {
      player.stack = index === 2 ? 60000 : 0;
      player.contributed = 0;
      player.bet = 0;
      player.folded = index !== 2;
      player.allIn = false;
    });
    engine.state.phase = 'showdown';
    engine.state.waitingHuman = false;
  });
  const championAccepted = await page.evaluate(() => window.SVR_PHASE362_NEXT_HAND());
  assert.equal(championAccepted, true);
  await page.waitForFunction(() => {
    const qa = window.SVR_PHASE362_QA?.();
    return Boolean(qa && qa.handNo === 1 && qa.fundedPlayers === 6 && qa.totalTableChips === 60000);
  }, null, { timeout: 30000 });
  const championReset = await policySnapshot(page);
  assert.equal(championReset.qa.champion.name, 'ROOK');
  for (const player of championReset.engine.players) {
    assert.equal(player.stack + player.contributed, 10000);
  }

  assertClean(diagnostics, 'Android');
  await context.close();
  return {
    timeoutPlayer: afterTimeout.lastTimeout.playerName,
    timeoutFolds: afterTimeout.timeoutFolds,
    continuedToHand: continued.qa.handNo,
    rejoinHand: rejoined.qa.handNo,
    champion: championReset.qa.champion.name,
    totalTableChips: championReset.qa.totalTableChips
  };
}

async function testQuest(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; Quest 3; SVR Phase362 QA) AppleWebKit/537.36 Chrome/140 Safari/537.36'
  });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  await page.goto(`${base}/game/index.html?platform=quest&v=phase362&phase362qa=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });
  await waitForPhase362(page, 220000);
  await page.waitForFunction(() => window.SVR_PHASE361_STATE?.mode === 'lobby', null, { timeout: 30000 });

  let snapshot = await policySnapshot(page);
  assert.equal(snapshot.settlement.runtimePlatform, 'quest');
  assert.equal(snapshot.settlement.androidQaForceLeft, false);
  assert.equal(snapshot.qa.awayFromTable, true);
  assert.equal(snapshot.phase361.mode, 'lobby');
  assert.equal(snapshot.phase361.seated, false);
  assert.equal(snapshot.qa.totalTableChips, 60000);

  await page.evaluate(() => {
    window.SVR_POKER_QA_PASSIVE_BOTS = true;
    window.SVR_PHASE361_PLAY_GAME();
  });
  await page.waitForFunction(() => {
    const qa = window.SVR_PHASE362_QA?.();
    return Boolean(window.SVR_PHASE361_STATE?.seated
      && window.SVR_PHASE361_STATE?.mode === 'seated'
      && qa?.awayFromTable === false
      && qa.totalTableChips === 60000
      && Number(qa.remainingSeconds) > 0);
  }, null, { timeout: 45000 });
  const seated = await policySnapshot(page);
  assert.equal(seated.phase361.seated, true);
  assert.equal(seated.qa.turnSeconds, 15);
  assert.equal(seated.qa.totalTableChips, 60000);
  assert.equal(await page.locator('#svr362TurnClock').count(), 1);

  await page.evaluate(() => window.SVR_PHASE361_LEAVE_TABLE());
  await page.waitForFunction(() => {
    return window.SVR_PHASE361_STATE?.mode === 'lobby'
      && window.SVR_PHASE362_QA?.().awayFromTable === true;
  }, null, { timeout: 15000 });
  const left = await policySnapshot(page);
  assert.equal(left.phase361.seated, false);
  assert.equal(left.qa.continuous, false);

  const resetsBefore = await page.evaluate(() => window.SVR_PHASE362_STATE.rejoinResets);
  await page.evaluate(() => window.SVR_PHASE361_PLAY_GAME());
  await page.waitForFunction((prior) => {
    const qa = window.SVR_PHASE362_QA?.();
    return Boolean(window.SVR_PHASE361_STATE?.seated
      && qa?.awayFromTable === false
      && qa.handNo === 1
      && qa.totalTableChips === 60000
      && window.SVR_PHASE362_STATE.rejoinResets > prior);
  }, resetsBefore, { timeout: 45000 });
  const rejoined = await policySnapshot(page);
  assert.equal(rejoined.qa.fundedPlayers, 6);
  for (const player of rejoined.engine.players) {
    assert.equal(player.stack + player.contributed, 10000);
  }

  assertClean(diagnostics, 'Quest');
  await context.close();
  return {
    startsInLobby: true,
    seated: seated.phase361.seated,
    leaveReturnsLobby: left.phase361.mode === 'lobby',
    rejoinHand: rejoined.qa.handNo,
    turnSeconds: rejoined.qa.turnSeconds,
    totalTableChips: rejoined.qa.totalTableChips
  };
}

async function testDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  await page.goto(`${base}/game/index.html?desktop=1&v=phase362&phase362qa=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });
  await waitForPhase362(page, 180000);
  await page.waitForFunction(() => window.SVR_PHASE362_QA?.().pass === true, null, { timeout: 30000 });
  const snapshot = await policySnapshot(page);
  assert.equal(snapshot.settlement.runtimePlatform, 'desktop');
  assert.equal(snapshot.settlement.androidQaForceLeft, false);
  assert.equal(snapshot.qa.platform, 'desktop');
  assert.equal(snapshot.qa.totalTableChips, 60000);
  assert.equal(snapshot.qa.turnSeconds, 15);
  assert.equal(snapshot.qa.awayFromTable, false);
  assertClean(diagnostics, 'Desktop');
  await context.close();
  return {
    pass: snapshot.qa.pass,
    totalTableChips: snapshot.qa.totalTableChips,
    turnSeconds: snapshot.qa.turnSeconds
  };
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--disable-dev-shm-usage']
  });
  try {
    const android = await testAndroid(browser);
    const quest = await testQuest(browser);
    const desktop = await testDesktop(browser);
    console.log(JSON.stringify({
      pass: true,
      build: 'PHASE-362-CONTINUOUS-10000-TURN-CLOCK-REJOIN-RESET-LOCK',
      android,
      quest,
      desktop
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
