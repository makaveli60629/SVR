/* PHASE-383-FULL-SITE-HOMEPAGE-RESTORE-LOCK */
(() => {
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
        fallback.innerHTML = '<strong>Preview is still loading.</strong><span>Use Open Full Game while the 3D lobby finishes loading.</span>';
        fallback.classList.add('is-warning');
      }
    }, 7000);
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
        if (box) box.innerHTML = `<strong>Server, full website, Quest runtime and APK ${androidRelease.apkVersionName} are published.</strong> Android remains on the stable Phase 380 / RC2 channel.`;
      } else {
        setMeter('apk', 'BROWSER LIVE', 72, true);
        if (box) box.innerHTML = '<strong>Browser play is live.</strong> Open the APK Center for the current package status.';
      }
    } catch (error) {
      setMeter('server', 'RETRY', 35, false);
      setMeter('game', 'AVAILABLE', 72, true);
      setMeter('apk', 'AVAILABLE', 72, true);
      if (box) box.textContent = 'The full website and game routes are available; live status data will retry on refresh.';
    }
  })();

  const answers = {
    status: () => deployHealth?.status === 'ok'
      ? `Server is up. Site build: ${deployHealth.siteBuild || deployHealth.build}. Quest runtime: ${deployHealth.questBuild || 'Phase 381'}. Android remains Phase 380 RC2.`
      : 'The website and game routes are available. Live status is still checking.',
    android: () => 'Use Play Android — Join Now. The stable table waits for JOIN NOW before dealing cards.',
    quest: () => 'Launch Quest / VR for the original uploaded table, Eric dealer runtime, seated movement lock, overlay cleanup and poker audio.',
    profile: () => 'Open Player Profile for the dashboard, then use Dressing Room to preview Eric and the avatar system.',
    store: () => 'Open SVR Store to browse the store portal and future in-world item concepts.',
    events: () => 'Open Tournaments for the event schedule and competition path.',
    sponsor: () => 'Open Sponsorship, Advertising or Billboards to review partnership and presentation options.',
    support: () => 'Open Contact SVR for project, technical, membership, sponsor or support questions.',
    default: () => 'I can help with system status, Android, Quest, APK installation, profiles, the dressing room, store, tournaments, membership, sponsors, news or support.'
  };

  const reply = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return;
    const q = raw.toLowerCase();
    const key = q.includes('status') || q.includes('server') ? 'status'
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
    send.addEventListener('click', () => {
      reply(input.value);
      input.value = '';
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') send.click();
    });
  }
  document.querySelectorAll('[data-ai]').forEach((button) => button.addEventListener('click', () => reply(button.dataset.ai)));

  window.SVR_PHASE383_FULL_SITE = {
    build: 'PHASE-383-FULL-SITE-HOMEPAGE-RESTORE-LOCK',
    fullHomepage: true,
    androidStablePreserved: true,
    questRuntimePreserved: true,
    terminatedPartnerMaterialExcluded: true
  };
})();
