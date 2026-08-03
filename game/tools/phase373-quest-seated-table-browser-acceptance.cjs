const { chromium } = require('playwright');

const BASE = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const URL = `${BASE}/game/index.html?platform=quest&v=phase373`;
const QUEST_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 OculusBrowser/37.0.0.0.0 MetaQuestBrowser/37.0 Quest 3 Safari/537.36';

async function waitFor(page, evaluator, timeout = 120000) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeout) {
    try {
      last = await page.evaluate(evaluator);
      if (last) return last;
    } catch {}
    await page.waitForTimeout(250);
  }
  throw new Error(`Timed out waiting for Phase 373 Quest state: ${JSON.stringify(last)}`);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: QUEST_UA,
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
      const phase373 = window.SVR_PHASE373_QA?.();
      const phase361 = window.SVR_PHASE361_QA?.();
      if (!phase373?.pass || !phase373?.tablePass || phase373?.stableAnchor?.mode !== 'lobby' || !phase361?.pass) return null;
      return { phase373, phase361 };
    });

    const joined = await page.evaluate(() => window.SVR_PHASE361_PLAY_GAME?.());
    if (joined === false) throw new Error('Phase 361 PLAY GAME rejected the Phase 373 seat test.');

    const seatedBeforeMove = await waitFor(page, () => {
      window.SVR_PHASE373_STABLE_SEAT?.();
      const qa = window.SVR_PHASE373_QA?.();
      if (!window.SVR_PHASE361_STATE?.seated || !qa?.pass || qa?.stableAnchor?.mode !== 'seated' || !qa?.teleportFlagsLocked) return null;
      if (!Object.values(qa.teleportFlags || {}).every((value) => value === false)) return null;
      return qa;
    }, 30000);

    const prohibitedMove = await page.evaluate(() => {
      const rig = window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || window.SVR_PLAYER_RIG || window.__SVR_PLAYER_RIG;
      const before = window.SVR_PHASE373_QA?.();
      let returnValue = null;
      if (typeof rig?.setPlayerPose === 'function') returnValue = rig.setPlayerPose(99, 0, 99);
      else if (typeof rig?.teleportTo === 'function') returnValue = rig.teleportTo(99, 0, 99);
      else if (rig?.position) rig.position.set(99, 0, 99);
      return { before, returnValue };
    });
    await page.waitForTimeout(900);

    const seatedAfterMove = await page.evaluate(() => window.SVR_PHASE373_QA?.());
    const anchorDistance = Math.hypot(
      Number(seatedAfterMove?.currentHead?.x || 0) - Number(seatedAfterMove?.stableAnchor?.x || 0),
      Number(seatedAfterMove?.currentHead?.z || 0) - Number(seatedAfterMove?.stableAnchor?.z || 0)
    );

    await page.evaluate(() => window.SVR_PHASE361_LEAVE_TABLE?.());
    const lobbyAfterLeave = await waitFor(page, () => {
      const qa = window.SVR_PHASE373_QA?.();
      return window.SVR_PHASE361_STATE?.seated === false && qa?.stableAnchor?.mode === 'lobby' ? qa : null;
    }, 30000);

    const filteredConsole = consoleErrors.filter((line) => !/favicon|WebXR.*not available|immersive-vr|THREE\.WebGLRenderer/i.test(line));
    const filteredFailures = requestFailures.filter((line) => !/favicon/i.test(line));
    const pass = lobby.phase373.tablePass === true
      && lobby.phase373.tableVisibleMeshes > 0
      && lobby.phase373.tableBounds?.minY >= -0.04
      && lobby.phase373.tableBounds?.minY <= 0.04
      && seatedBeforeMove.teleportFlagsLocked === true
      && Object.values(seatedBeforeMove.teleportFlags || {}).every((value) => value === false)
      && seatedAfterMove.blockedRigMoves > Number(prohibitedMove.before?.blockedRigMoves || 0)
      && anchorDistance <= 0.18
      && seatedAfterMove.tablePass === true
      && seatedAfterMove.npcRootsFound >= 1
      && seatedAfterMove.npcRootsVisible >= 1
      && seatedAfterMove.npcRootsTextured >= 1
      && seatedAfterMove.npcRootsUpright >= 1
      && lobbyAfterLeave.stableAnchor?.mode === 'lobby'
      && lobbyAfterLeave.teleportFlagsLocked === false
      && pageErrors.length === 0
      && filteredConsole.length === 0
      && httpErrors.length === 0
      && filteredFailures.length === 0;

    const report = {
      pass,
      build: 'PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK',
      url: URL,
      lobby,
      seatedBeforeMove,
      prohibitedMoveReturn: prohibitedMove.returnValue,
      seatedAfterMove,
      anchorDistance,
      lobbyAfterLeave,
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