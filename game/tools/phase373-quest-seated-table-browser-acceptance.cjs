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
      const preflight = window.SVR_PHASE373_RIG_PREFLIGHT_QA?.();
      const postflight = window.SVR_PHASE373_POSTFLIGHT_QA?.();
      if (!phase373?.pass || !phase373?.tablePass || phase373?.stableAnchor?.mode !== 'lobby') return null;
      if (!phase361?.pass || !preflight?.pass || !postflight?.pass) return null;
      if (preflight.selectedOwnsTable || !preflight.selectedStillSafe) return null;
      return { phase373, phase361, preflight, postflight };
    });

    const joined = await page.evaluate(() => window.SVR_PHASE361_PLAY_GAME?.());
    if (joined === false) throw new Error('Phase 361 PLAY GAME rejected the Phase 373 seat test.');

    const seatedBeforeMove = await waitFor(page, () => {
      window.SVR_PHASE373_STABLE_SEAT?.();
      const qa = window.SVR_PHASE373_QA?.();
      const preflight = window.SVR_PHASE373_RIG_PREFLIGHT_QA?.();
      const postflight = window.SVR_PHASE373_POSTFLIGHT_QA?.();
      if (!window.SVR_PHASE361_STATE?.seated || !qa?.pass || qa?.stableAnchor?.mode !== 'seated' || !qa?.teleportFlagsLocked) return null;
      if (!preflight?.pass || !postflight?.pass || !Object.values(qa.teleportFlags || {}).every((value) => value === false)) return null;
      return { qa, preflight, postflight };
    }, 30000);

    const prohibitedMove = await page.evaluate(() => {
      const rig = window.SVR_TELEPORT_RIG_REF;
      const before = window.SVR_PHASE373_QA?.();
      const beforeTable = before?.tableBounds || null;
      const beforeHead = before?.currentHead || null;
      let returnValue = null;
      if (typeof rig?.setPlayerPose === 'function') returnValue = rig.setPlayerPose(99, 0, 99);
      else if (typeof rig?.teleportTo === 'function') returnValue = rig.teleportTo(99, 0, 99);
      else if (rig?.position) returnValue = rig.position.set(99, 0, 99);
      return { before, beforeTable, beforeHead, returnValue };
    });
    await page.waitForTimeout(1100);

    const seatedAfterMove = await page.evaluate(() => ({
      phase373: window.SVR_PHASE373_QA?.(),
      preflight: window.SVR_PHASE373_RIG_PREFLIGHT_QA?.(),
      postflight: window.SVR_PHASE373_POSTFLIGHT_QA?.()
    }));
    const anchorDistance = Math.hypot(
      Number(seatedAfterMove.phase373?.currentHead?.x || 0) - Number(seatedAfterMove.phase373?.stableAnchor?.x || 0),
      Number(seatedAfterMove.phase373?.currentHead?.z || 0) - Number(seatedAfterMove.phase373?.stableAnchor?.z || 0)
    );
    const prohibitedHeadDrift = Math.hypot(
      Number(seatedAfterMove.phase373?.currentHead?.x || 0) - Number(prohibitedMove.beforeHead?.x || 0),
      Number(seatedAfterMove.phase373?.currentHead?.z || 0) - Number(prohibitedMove.beforeHead?.z || 0)
    );
    const tableVerticalDrift = Math.abs(
      Number(seatedAfterMove.phase373?.tableBounds?.minY || 0) - Number(prohibitedMove.beforeTable?.minY || 0)
    );

    await page.evaluate(() => window.SVR_PHASE361_LEAVE_TABLE?.());
    const lobbyAfterLeave = await waitFor(page, () => {
      const phase373 = window.SVR_PHASE373_QA?.();
      const postflight = window.SVR_PHASE373_POSTFLIGHT_QA?.();
      return window.SVR_PHASE361_STATE?.seated === false
        && phase373?.stableAnchor?.mode === 'lobby'
        && phase373?.teleportFlagsLocked === false
        && postflight?.pass === true
        && postflight?.standingRestored === true
        ? { phase373, postflight }
        : null;
    }, 30000);

    const filteredConsole = consoleErrors.filter((line) => !/favicon|WebXR.*not available|immersive-vr|THREE\.WebGLRenderer/i.test(line));
    const filteredFailures = requestFailures.filter((line) => !/favicon/i.test(line));
    const npcReport = seatedAfterMove.postflight || {};
    const npcPass = npcReport.npcRootsRepaired > 0
      ? npcReport.npcMeshesTextured > 0
        && npcReport.npcRootsUpright > 0
        && npcReport.npcRootsGrounded > 0
        && npcReport.npcRootsFacingTable > 0
      : npcReport.npcRepairApiReady === true
        && npcReport.npcValidation === 'no-humanoid-roots-in-current-scene';

    const pass = lobby.phase373.tablePass === true
      && lobby.phase373.tableVisibleMeshes > 0
      && Math.abs(Number(lobby.phase373.tableBounds?.minY || 0)) <= 0.04
      && lobby.preflight.selectedOwnsTable === false
      && seatedBeforeMove.qa.teleportFlagsLocked === true
      && Object.values(seatedBeforeMove.qa.teleportFlags || {}).every((value) => value === false)
      && seatedAfterMove.phase373.blockedRigMoves > Number(prohibitedMove.before?.blockedRigMoves || 0)
      && prohibitedHeadDrift <= 0.18
      && anchorDistance <= 0.24
      && tableVerticalDrift <= 0.04
      && Math.abs(Number(seatedAfterMove.phase373.tableBounds?.minY || 0)) <= 0.04
      && seatedAfterMove.phase373.tablePass === true
      && seatedAfterMove.preflight?.selectedOwnsTable === false
      && npcPass
      && lobbyAfterLeave.phase373.stableAnchor?.mode === 'lobby'
      && lobbyAfterLeave.phase373.teleportFlagsLocked === false
      && lobbyAfterLeave.postflight.standingRestored === true
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
      prohibitedHeadDrift,
      tableVerticalDrift,
      npcPass,
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