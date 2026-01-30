import { initDiagnostics } from './diagnostics.js';
import { Spine } from './spine.js';

const diag = initDiagnostics({
  build: 'SCARLETT_SPINE_PERMANENT_S1_WORLD_INIT',
});

diag.log('[plain] js running ✅');

// 🔥 THIS WAS MISSING BEFORE
Spine.start({ diag })
  .then(() => {
    window.SCARLETT = Spine;
    diag.log('[boot] spine started ✅');
  })
  .catch(err => {
    diag.error('[boot] spine failed: ' + err.message);
  });
