const { chromium } = require('playwright');

const BASE = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const QUEST_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) OculusBrowser/32.0.0.0.67 SamsungBrowser/4.0 Chrome/126.0 Mobile VR Safari/537.36';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36';

async function waitFor(page, fn, timeout = 120000) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeout) {
    try {
      last = await page.evaluate(fn);
      if (last) return last;
    } catch {}
    await page.waitForTimeout(350);
  }
  throw new Error(`Timed out waiting for runtime: ${JSON.stringify(last)}`);
}

async function runDevice(browser, name, userAgent, path, viewport) {
  const context = await browser.newContext({ userAgent, viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failed = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => failed.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`));
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 120000 });

  const qa = await waitFor(page, () => {
    if (typeof window.SVR_PHASE364_QA !== 'function') return null;
    const result = window.SVR_PHASE364_QA();
    return result?.tablePass ? result : null;
  });

  if (!qa.tablePass) throw new Error(`${name}: table geometry failed ${JSON.stringify(qa)}`);
  const size = qa.measuredTable.size;
  if (Math.abs(size.x - 2.74) > 0.09 || Math.abs(size.y - 0.80) > 0.09 || Math.abs(size.z - 1.46) > 0.09) throw new Error(`${name}: wrong table size ${JSON.stringify(size)}`);
  if (Math.abs(qa.measuredTable.minY) > 0.03) throw new Error(`${name}: table not on floor ${qa.measuredTable.minY}`);

  let interaction = null;
  if (name === 'quest') {
    interaction = await waitFor(page, () => {
      const button = document.querySelector('#svr364EnterVr');
      if (!button || typeof window.SVR_PHASE361_PLAY_GAME !== 'function') return null;
      window.SVR_PHASE364_LOBBY_SPAWN?.();
      return {
        customVrButtons: document.querySelectorAll('#svr364EnterVr').length,
        oldVrButtons: document.querySelectorAll('.svr-vr-button,#VRButton').length,
        xrSupported: window.SVR_PHASE364_STATE?.xrSupported,
        lobby: window.SVR_PHASE364_STATE?.lobbySpawn,
        seat: window.SVR_PHASE364_STATE?.seatAnchor,
        phase361: window.SVR_PHASE361_QA?.() || null
      };
    });
    if (interaction.customVrButtons !== 1 || interaction.oldVrButtons !== 0) throw new Error(`quest: VR button authority invalid ${JSON.stringify(interaction)}`);
    if (!interaction.lobby || !interaction.seat) throw new Error('quest: anchors unavailable');
    if (interaction.lobby.z - interaction.seat.z < 2.4) throw new Error(`quest: lobby spawn too close ${JSON.stringify(interaction)}`);

    const seated = await page.evaluate(async () => {
      window.SVR_PHASE361_PLAY_GAME?.();
      await new Promise((resolve) => setTimeout(resolve, 650));
      window.SVR_PHASE364_SEAT?.();
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { qa: window.SVR_PHASE364_QA?.(), phase361: window.SVR_PHASE361_STATE };
    });
    if (!seated.phase361?.seated) throw new Error(`quest: PLAY GAME did not seat ${JSON.stringify(seated)}`);

    const visibleEric = await page.evaluate(() => {
      const scene = window.__SVR_SCENE__;
      let visible = 0;
      const seen = new Set();
      const stack = scene ? [scene] : [];
      while (stack.length && seen.size < 18000) {
        const object = stack.pop();
        if (!object || seen.has(object)) continue;
        seen.add(object);
        if (/eric/i.test(String(object.name || '')) && object.visible !== false) visible += 1;
        for (const child of object.children || []) if (child && !seen.has(child)) stack.push(child);
      }
      return visible;
    });
    if (visibleEric !== 0) throw new Error(`quest: visible Eric roots remain ${visibleEric}`);
  } else {
    interaction = await waitFor(page, () => {
      if (typeof window.SVR_PHASE363_JOIN_TABLE !== 'function') return null;
      window.SVR_PHASE363_JOIN_TABLE('phase364-browser');
      window.SVR_PHASE364_ANDROID_SEAT?.();
      const q = window.SVR_PHASE364_QA?.();
      const activeCamera = window.__SVR_CAMERA__;
      return q?.androidJoined ? { q, cameraY: activeCamera?.position?.y } : null;
    });
    const targetY = interaction.q.measuredTable.maxY + 0.55;
    if (Math.abs(interaction.cameraY - targetY) > 0.14) throw new Error(`android: camera/table height mismatch ${JSON.stringify(interaction)}`);
  }

  const filteredConsole = consoleErrors.filter((line) => !/favicon|WebXR.*not available|THREE\.WebGLRenderer/i.test(line));
  const filteredFailed = failed.filter((line) => !/favicon/i.test(line));
  if (pageErrors.length || filteredConsole.length || filteredFailed.length) throw new Error(`${name}: runtime errors ${JSON.stringify({ pageErrors, consoleErrors: filteredConsole, failed: filteredFailed })}`);

  await context.close();
  return { name, qa, interaction, pageErrors: 0, consoleErrors: 0, failedRequests: 0 };
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  try {
    const quest = await runDevice(browser, 'quest', QUEST_UA, '/game/index.html?platform=quest&v=phase364', { width: 1024, height: 1024 });
    const android = await runDevice(browser, 'android', ANDROID_UA, '/game/android.html?channel=stable&v=phase364', { width: 412, height: 915 });
    console.log(JSON.stringify({ pass: true, quest, android }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
