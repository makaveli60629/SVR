/* PHASE-389-CAMERA3-WEBSITE-LIVE-ROUTE-LOCK */
(() => {
  const CAMERA3_ROUTE = '../game/camera3-live.html?v=phase389&embed=1&autocam=1&source=site-live-preview';
  const routeCamera3 = () => {
    document.querySelectorAll('iframe').forEach((iframe) => {
      const src = String(iframe.getAttribute('src') || '');
      if (/preview=1|cam=director|camera3\.html|cam3\.html/i.test(src)) iframe.src = CAMERA3_ROUTE;
    });
    document.querySelectorAll('a[href]').forEach((anchor) => {
      const href = String(anchor.getAttribute('href') || '');
      if (/preview=1|cam=director|camera3\.html|cam3\.html/i.test(href)) anchor.href = CAMERA3_ROUTE.replace('&embed=1', '');
    });
  };
  routeCamera3();
  const frame = document.getElementById('svrLiveGameFrame');
  const fallback = document.getElementById('previewFallback');
  if (frame && fallback) {
    let loaded = false;
    frame.addEventListener('load', () => {
      loaded = true;
      fallback.classList.add('is-hidden');
    });
    setTimeout(() => {
      if (!loaded) {
        fallback.innerHTML = '<strong>Camera 3 is still loading.</strong><span>Open the dedicated live feed while the table and lighting finish loading.</span>';
        fallback.classList.add('is-warning');
      }
    }, 8000);
  }

  const setMeter = (id, text, width, ok = true) => {
    const textEl = document.getElementById(`${id}Text`);
    const bar = document.getElementById(`${id}Bar`);
    if (textEl) {
      textEl.textContent = text;
      textEl.style.color = ok ? '#8dffb4' : '#ffd98a';
    }
    if (bar) bar.style.width = `${width}%`;
  };

  let deployHealth = null;
  let androidRelease = null;

  (async () => {
    const box = document.getElementById('releaseStatus');
    try {
      const [healthResponse, releaseResponse] = await Promise.all([
        fetch(`../deploy-health.json?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`../game/android-release.json?t=${Date.now()}`, { cache: 'no-store' })
      ]);
      deployHealth = await healthResponse.json();
      androidRelease = await releaseResponse.json();
      setMeter('server', deployHealth.status === 'ok' ? 'UP' : 'CHECK', 100, deployHealth.status === 'ok');
      setMeter('game', String(deployHealth.questBuild || deployHealth.build || 'LIVE').replace('PHASE-', 'P'), 100, true);
      if (androidRelease.releaseReady && androidRelease.apkUrl) {
        setMeter('apk', 'RC2 READY', 100, true);
        if (box) box.innerHTML = `<strong>Server, full website, Camera 3, Quest runtime and APK ${androidRelease.apkVersionName} are published.</strong> Android web play uses the responsive Phase 389 layout.`;
      } else {
        setMeter('apk', 'BROWSER LIVE', 72, true);
        if (box) box.innerHTML = '<strong>Browser play and Camera 3 are live.</strong> Open the APK Center for the current package status.';
      }
    } catch (error) {
      setMeter('server', 'RETRY', 35, false);
      setMeter('game', 'AVAILABLE', 72, true);
      setMeter('apk', 'AVAILABLE', 72, true);
      if (box) box.textContent = 'The full website, Camera 3 and game routes are available; live status data will retry on refresh.';
    }
  })();

  const answers = {
    status: () => deployHealth?.status === 'ok'
      ? `Server is up. Build: ${deployHealth.build}. Camera 3: ${deployHealth.camera3Build || 'Phase 389'}. Quest: ${deployHealth.questBuild || 'Phase 389'}. Android: ${deployHealth.androidBuild || 'Phase 389'}.`
      : 'The website, Camera 3 and game routes are available. Live status is still checking.',
    android: () => 'Use Play Android — Join Now. Phase 389 adapts the table controls for portrait and landscape screens.',
    quest: () => 'Launch Quest / VR for the original uploaded table, Eric dealer runtime, single seat authority, overlay cleanup and poker audio.',
    profile: () => 'Open Player Profile for the live saved-avatar demo, then use Dressing Room to change the outfit.',
    store: () => 'Open SVR Store to browse the store portal and future in-world item concepts.',
    events: () => 'Open Tournaments for the event schedule and competition path.',
    sponsor: () => 'Open Sponsorship, Advertising or Billboards to review partnership and presentation options.',
    support: () => 'Open Contact SVR for project, technical, membership, sponsor or support questions.',
    default: () => 'I can help with Camera 3, system status, Android, Quest, APK installation, profiles, the dressing room, store, tournaments, membership, sponsors, news or support.'
  };

  const reply = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return;
    const q = raw.toLowerCase();
    const key = q.includes('status') || q.includes('server') || q.includes('camera') ? 'status'
      : q.includes('quest') || q.includes('vr') ? 'quest'
      : q.includes('android') || q.includes('play') || q.includes('apk') ? 'android'
      : q.includes('profile') || q.includes('eric') || q.includes('dress') || q.includes('avatar') ? 'profile'
      : q.includes('store') ? 'store'
      : q.includes('tournament') || q.includes('event') ? 'events'
      : q.includes('sponsor') || q.includes('advert') || q.includes('billboard') ? 'sponsor'
      : q.includes('contact') || q.includes('support') || q.includes('help') ? 'support'
      : 'default';
    const safe = raw.replace(/[<>]/g, '');
    const log = document.getElementById('aiLog');
    if (log) {
      log.innerHTML += `<br><br><b>You:</b> ${safe}<br><b>SVR AI:</b> ${answers[key]()}`;
      log.scrollTop = log.scrollHeight;
    }
  };

  const input = document.getElementById('aiInput');
  const send = document.getElementById('aiSend');
  if (send && input) {
    send.addEventListener('click', () => { reply(input.value); input.value = ''; });
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter') send.click(); });
  }
  document.querySelectorAll('[data-ai]').forEach((button) => button.addEventListener('click', () => reply(button.dataset.ai)));

  window.SVR_PHASE389_FULL_SITE = {
    build: 'PHASE-389-FULL-AUDIT-VISIBLE-FIXES-LOCK',
    camera3Route: '/game/camera3-live.html?v=phase389',
    fullHomepage: true,
    androidResponsive: true,
    questRuntimeConsolidated: true,
    avatarProfileVisibleRefresh: true,
    terminatedPartnerMaterialExcluded: true
  };
})();
