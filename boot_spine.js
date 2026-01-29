import { initDiagnostics } from './diagnostics.js';
import { Spine } from './spine.js';

export const Boot = (() => {
  let diag;
  const $ = (id) => document.getElementById(id);

  async function start() {
    diag = initDiagnostics({
      build: 'SCARLETT_SPINE_PERMANENT_S1',
      href: location.href,
      ua: navigator.userAgent,
    });

    diag.log('[boot] entry');

    // Optional SW registration
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('./sw.js', { scope: './' });
        diag.log('[sw] registered');
      } catch (e) {
        diag.warn('[sw] register failed: ' + (e?.message || e));
      }
    }

    try {
      await Spine.start({ diag });
      diag.log('[boot] ready');
    } catch (e) {
      diag.error('[boot] failed: ' + (e?.stack || e?.message || e));
    }

    // Wire buttons
    $('btnEnterVR')?.addEventListener('click', () => Spine.enterVR().catch(e => diag.error(String(e))));
    $('btnReset')?.addEventListener('click', () => Spine.resetSpawn());
    $('btnHideHUD')?.addEventListener('click', () => {
      const hud = $('hud');
      hud?.classList.toggle('hud--hidden');
    });
    $('btnCopy')?.addEventListener('click', async () => {
      const report = Spine.getReport();
      try {
        await navigator.clipboard.writeText(report);
        diag.log('[hud] report copied');
      } catch {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = report;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        diag.log('[hud] report copied (fallback)');
      }
      diag.render(report);
    });
    $('btnHardReload')?.addEventListener('click', () => {
      const url = new URL(location.href);
      url.searchParams.set('v', String(Date.now()));
      location.replace(url.toString());
    });

    diag.render(Spine.getReport());
  }

  return { start };
})();
