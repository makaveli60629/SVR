/* PHASE-390-CAMERA3-ANDROID-GAMEPLAY-LIVE-ROUTE-LOCK */
(() => {
  const CAMERA3_ROUTE = '../game/camera3-live.html?v=phase390&embed=1&autocam=1&source=site-live-preview';
  const ANDROID_ROUTE = '../game/android.html?channel=stable&v=phase390&source=site-play-android';
  const routeLiveGames = () => {
    document.querySelectorAll('iframe').forEach((iframe) => {
      const src = String(iframe.getAttribute('src') || '');
      if (/preview=1|cam=director|camera3\.html|cam3\.html/i.test(src)) iframe.src = CAMERA3_ROUTE;
    });
    document.querySelectorAll('a[href]').forEach((anchor) => {
      const href = String(anchor.getAttribute('href') || '');
      if (/preview=1|cam=director|camera3\.html|cam3\.html/i.test(href)) {
        anchor.href = CAMERA3_ROUTE.replace('&embed=1', '');
        return;
      }
      if (/\/game\/(?:android|android-play|android-stable|android-tabletop)\.html/i.test(href)) anchor.href = ANDROID_ROUTE;
    });
  };
  routeLiveGames();
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
        fallback.innerHTML = '<strong>Camera 3 is still loading.</strong><span>Open the dedicated live feed while the corrected table, cards, Eric, and lighting finish loading.</span>';
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
        if (box) box.innerHTML = `<strong>Server, full website, furnished Camera 3, corrected Quest runtime, playable Android browser game, and APK ${androidRelease.apkVersionName} are published.</strong>`;
      } else {
        setMeter('apk', 'BROWSER LIVE', 72, true);
        if (box) box.innerHTML = '<strong>Playable Android browser game, Quest route, and Camera 3 are live.</strong> Open the APK Center for package status.';
      }
    } catch (error) {
      setMeter('server', 'RETRY', 35, false);
      setMeter('game', 'AVAILABLE', 72, true);
      setMeter('apk', 'AVAILABLE', 72, true);
      if (box) box.textContent = 'The website, playable Android route, Camera 3, and Quest game routes are available; live status data will retry on refresh.';
    }
  })();

  const answers = {
    status: () => deployHealth?.status === 'ok'
      ? `Server is up. Build: ${deployHealth.build}. Camera 3: ${deployHealth.camera3Build || 'Phase 390'}. Quest: ${deployHealth.questBuild || 'Phase 390'}. Android: ${deployHealth.androidBuild || 'Phase 390'}.`
      : 'The website, furnished Camera 3, playable Android route, and Quest game are available. Live status is still checking.',
    android: () => 'Use Play Android. Phase 390 opens JOIN NOW, five bots, hole cards, community cards, pot chips, poker actions, portrait/landscape layout, and a direct gameplay fallback.',
    quest: () => 'Launch Quest / VR for the original table with a 6.5-inch recessed playing surface, restored cards, upright Eric, and a fixed spawn directly in front of the table.',
    profile: () => 'Open Player Profile for the live saved-avatar demo, then use Dressing Room to change the outfit.',
    store: () => 'Open SVR Store to browse the store portal and future in-world item concepts.',
    events: () => 'Open Tournaments for the event schedule and competition path.',
    sponsor: () => 'Open Sponsorship, Advertising or Billboards to review partnership and presentation options.',
    support: () => 'Open Contact SVR for project, technical, membership, sponsor or support questions.',
    default: () => 'I can help with Camera 3, system status, Android gameplay, Quest, APK installation, profiles, the dressing room, store, tournaments, membership, sponsors, news or support.'
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

  window.SVR_PHASE390_FULL_SITE = {
    build: 'PHASE-390-QUEST-TABLE-GEOMETRY-CARDS-SPAWN-AUTHORITY-LOCK',
    camera3Route: '/game/camera3-live.html?v=phase390',
    androidRoute: '/game/android.html?channel=stable&v=phase390',
    androidGameplayRoute: '/game/android-stable.html?v=phase390&direct=1',
    fullHomepage: true,
    androidPlayable: true,
    questTableGeometryCorrected: true,
    questCardsRestored: true,
    questFrontSpawnLocked: true,
    ericUprightCorrected: true,
    avatarProfileVisibleRefresh: true,
    terminatedPartnerMaterialExcluded: true
  };
})();
