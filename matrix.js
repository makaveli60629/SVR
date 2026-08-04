(() => {
  const BUILD = 'PHASE-371-PUBLIC-APP-AI-MATRIX-POLISH-LOCK';
  const CAMERA3 = '/game/camera3.html?v=phase371';

  function routeCamera3() {
    document.querySelectorAll('iframe[src*="cam=director"],iframe[src*="autocam=1"]').forEach((frame) => {
      if (frame.dataset.svrCamera3Routed === BUILD) return;
      frame.dataset.svrCamera3Routed = BUILD;
      frame.src = CAMERA3;
      frame.loading = frame.id === 'svrLiveGameFrame' ? 'eager' : 'lazy';
      frame.setAttribute('allow', 'autoplay; fullscreen');
    });
    document.querySelectorAll('a[href*="cam=director"],a[href*="autocam=1"]').forEach((link) => {
      link.href = CAMERA3;
    });
  }

  function installAndroidAppSlide() {
    if (!/\/site\/index\.html$/i.test(location.pathname)) return;
    const deck = document.querySelector('[data-svr-slide-deck]');
    if (!deck || deck.querySelector('[data-slide-id="slide-android-app"]')) return;
    if (!document.getElementById('svr371-app-slide-style')) {
      const style = document.createElement('style');
      style.id = 'svr371-app-slide-style';
      style.textContent = `
        .svr371-app-slide{position:relative;overflow:hidden;background:radial-gradient(circle at 50% 38%,rgba(155,77,255,.46),rgba(4,7,17,.98) 67%)}
        .svr371-app-slide::before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,rgba(127,252,255,.12),transparent 38%,rgba(255,217,138,.1));pointer-events:none}
        .svr371-app-banner{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,.7fr);align-items:center;gap:18px;padding:clamp(20px,5vw,58px);color:#fff}
        .svr371-app-copy{max-width:720px}.svr371-app-copy .eyebrow{color:#7ffcff;font:900 12px Orbitron,system-ui;letter-spacing:.12em}.svr371-app-copy h2{margin:8px 0;font:900 clamp(28px,5vw,58px) Orbitron,system-ui;line-height:1}.svr371-app-copy p{max-width:650px;margin:0 0 16px;color:#e6e5ed;font:700 clamp(15px,2vw,20px) Rajdhani,system-ui}.svr371-app-actions{display:flex;flex-wrap:wrap;gap:9px}
        .svr371-app-logo{display:grid;place-items:center}.svr371-app-logo img{width:min(260px,34vw);height:min(260px,34vw);object-fit:contain;filter:drop-shadow(0 0 38px rgba(127,252,255,.34)) drop-shadow(0 0 50px rgba(155,77,255,.32))}.svr371-app-logo strong{margin-top:8px;color:#ffd98a;font:900 13px Orbitron,system-ui;letter-spacing:.08em;text-align:center}
        @media(max-width:720px){.svr371-app-banner{grid-template-columns:1fr;text-align:center;padding:20px}.svr371-app-copy{display:grid;justify-items:center}.svr371-app-logo{grid-row:1}.svr371-app-logo img{width:112px;height:112px}.svr371-app-copy h2{font-size:28px}.svr371-app-copy p{font-size:15px}.svr371-app-actions{justify-content:center}}
      `;
      document.head.appendChild(style);
    }
    deck.querySelectorAll('.svr-slide.is-active').forEach((slide) => slide.classList.remove('is-active'));
    const slide = document.createElement('article');
    slide.className = 'svr-slide svr-art-slide svr371-app-slide is-active';
    slide.dataset.slideId = 'slide-android-app';
    slide.dataset.slideType = 'android-app';
    slide.innerHTML = `
      <div class="svr371-app-banner">
        <div class="svr371-app-copy">
          <span class="eyebrow">SVR POKER APP</span>
          <h2>Android Playtest Ready</h2>
          <p>Open the Android table, press JOIN TABLE, and play the current protected Hold’em test build. The full immersive experience continues on Quest VR.</p>
          <div class="svr371-app-actions"><a class="btn primary" href="../game/android.html?channel=stable&v=phase369">Open Android Game</a><a class="btn secondary" href="../downloads/">App & Downloads</a></div>
        </div>
        <div class="svr371-app-logo"><img src="../logo.png" alt="SVR Poker app logo"><strong>ANDROID APP PLAYTEST</strong></div>
      </div>`;
    deck.prepend(slide);
  }

  function installPublicAiStatus() {
    const publicRoot = !/\/site\//i.test(location.pathname) && (location.pathname === '/' || /\/index\.html$/i.test(location.pathname));
    if (!publicRoot) return;
    const badge = document.querySelector('.system-status-badge');
    const admin = document.getElementById('admin-status') || document.querySelector('.admin-status');
    if (!badge || !admin) return;
    if (!document.getElementById('svr371-ai-status-style')) {
      const style = document.createElement('style');
      style.id = 'svr371-ai-status-style';
      style.textContent = `.ai-status{display:none!important;align-items:center;gap:7px}.ai-status.is-active{display:inline-flex!important;color:#baffc9!important;border-color:rgba(73,255,121,.7)!important}.ai-status .ai-dot{width:9px;height:9px;border-radius:50%;background:#34ff72;box-shadow:0 0 12px rgba(52,255,114,.9)}`;
      document.head.appendChild(style);
    }
    let ai = document.getElementById('ai-status');
    if (!ai) {
      ai = document.createElement('span');
      ai.id = 'ai-status';
      ai.className = 'status-item ai-status';
      ai.innerHTML = '<span class="ai-dot"></span><span>AI ACTIVE</span>';
      ai.setAttribute('aria-label', 'AI support active while admin is offline');
      badge.appendChild(ai);
    }
    const adminOnline = admin.dataset.state === 'online' || admin.classList.contains('online');
    ai.classList.toggle('is-active', !adminOnline);
    ai.dataset.state = adminOnline ? 'standby' : 'active';
    window.SVR_PUBLIC_AI_STATUS = {
      build: BUILD,
      active: !adminOnline,
      reason: adminOnline ? 'admin-online' : 'admin-offline-support-fallback',
      checkedAt: new Date().toISOString()
    };
  }

  function loadSitePolish() {
    if (!/^\/site\/(?:index|profile|avatar|login|register)\.html$/i.test(location.pathname)) return;
    if (!document.querySelector('link[data-svr-phase370]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/site/css/phase370-account-profile-mobile-clean.css?v=phase371';
      link.dataset.svrPhase370 = '1';
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[data-svr-phase370]')) {
      const script = document.createElement('script');
      script.src = '/site/js/phase370-account-profile-mobile-polish.js?v=phase371';
      script.defer = true;
      script.dataset.svrPhase370 = '1';
      document.head.appendChild(script);
    }
  }

  routeCamera3();
  installAndroidAppSlide();
  installPublicAiStatus();
  loadSitePolish();
  new MutationObserver(() => {
    routeCamera3();
    installAndroidAppSlide();
    installPublicAiStatus();
    loadSitePolish();
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'data-state'] });

  const canvas = document.getElementById('binary-rain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  const media = (query) => window.matchMedia?.(query)?.matches === true;
  const reducedMotion = media('(prefers-reduced-motion: reduce)');
  const coarsePointer = media('(pointer: coarse)');
  const lowPower = coarsePointer || Number(navigator.deviceMemory || 4) <= 3;
  const glyphs = ['0', '1'];
  const phrases = ['I LOVE SHY', 'I LOVE SCARLETT'];
  const targetFrameMs = reducedMotion ? 90 : lowPower ? 48 : 28;
  const phraseIntervalSeconds = reducedMotion ? 25 : coarsePointer ? 19 : 16;
  const phraseStaggerSeconds = coarsePointer ? 1.05 : 0.88;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let fontSize = 14;
  let columns = [];
  let drops = [];
  let highlights = [];
  let lastFrame = 0;
  let lastAdvance = 0;
  let phraseClock = 0;
  let paused = document.hidden;
  let resizeTimer = 0;
  let phraseBursts = 0;

  const randomGlyph = () => glyphs[Math.random() < 0.5 ? 0 : 1];
  const createDrop = () => ({
    row: -Math.random() * Math.max(12, height / fontSize),
    speed: (lowPower ? 5.5 : 7.5) + Math.random() * (lowPower ? 5.5 : 8),
    length: (lowPower ? 6 : 8) + Math.floor(Math.random() * (lowPower ? 6 : 8)),
    seed: Math.random() * Math.PI * 2
  });

  function resize() {
    dpr = Math.min(lowPower ? 1 : 1.25, Math.max(1, window.devicePixelRatio || 1));
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    fontSize = Math.max(lowPower ? 14 : 13, Math.min(17, Math.round(width / (lowPower ? 66 : 82))));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textBaseline = 'top';
    ctx.font = `500 ${fontSize}px Orbitron, ui-monospace, monospace`;
    const spacing = fontSize * 1.28;
    const count = Math.ceil(width / spacing) + 3;
    columns = Array.from({ length: count }, (_, index) => index * spacing - spacing);
    drops = Array.from({ length: count }, createDrop);
    highlights = [];
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
  }

  function spawnPhrase() {
    if (!columns.length || highlights.length) return;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const chars = [...phrase].filter((char) => char !== ' ');
    const available = Array.from({ length: columns.length }, (_, index) => index);
    for (let index = available.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [available[index], available[swap]] = [available[swap], available[index]];
    }
    chars.slice(0, Math.min(chars.length, available.length)).forEach((char, index) => {
      highlights.push({
        char,
        column: available[index],
        row: -4 - Math.random() * 9,
        speed: (coarsePointer ? 6.5 : 8) + Math.random() * 2.5,
        alpha: 0,
        delay: index * phraseStaggerSeconds + Math.random() * 0.25,
        age: 0,
        pulse: Math.random() * Math.PI * 2
      });
    });
    phraseBursts += 1;
  }

  function drawTrail(drop, columnIndex, timestamp) {
    const headRow = Math.floor(drop.row);
    const x = columns[columnIndex];
    for (let trail = 0; trail < drop.length; trail += 1) {
      const y = (headRow - trail) * fontSize;
      if (y < -fontSize || y > height + fontSize) continue;
      const alpha = trail === 0 ? 0.46 : Math.max(0.01, 0.16 * (1 - trail / drop.length));
      const pulse = 0.55 + 0.45 * Math.sin(timestamp * 0.001 + drop.seed + y * 0.01);
      const red = 126 + Math.floor(26 * pulse);
      const green = 44 + Math.floor(22 * pulse);
      ctx.fillStyle = `rgba(${red},${green},226,${alpha})`;
      if (trail === 0 && !lowPower) {
        ctx.shadowColor = 'rgba(190,105,255,.22)';
        ctx.shadowBlur = 3;
      }
      ctx.fillText(randomGlyph(), x, y);
      ctx.shadowBlur = 0;
    }
  }

  function drawHighlights(timestamp, delta) {
    for (const item of highlights) {
      item.age += delta;
      if (item.age < item.delay) continue;
      item.row += item.speed * delta;
      const y = item.row * fontSize;
      const visibleAge = item.age - item.delay;
      const fadeIn = Math.min(1, visibleAge / 0.62);
      const fadeOut = Math.max(0, 1 - Math.max(0, y - height * 0.64) / Math.max(1, height * 0.36));
      item.alpha = Math.min(0.78, fadeIn * fadeOut);
      const pulse = 0.65 + 0.35 * Math.sin(timestamp * 0.0024 + item.pulse);
      ctx.fillStyle = `rgba(255,${150 + Math.floor(36 * pulse)},238,${item.alpha})`;
      if (!lowPower) {
        ctx.shadowColor = `rgba(100,225,255,${0.12 + pulse * 0.14})`;
        ctx.shadowBlur = 5;
      }
      ctx.fillText(item.char, columns[item.column] || 0, y);
      ctx.shadowBlur = 0;
    }
    highlights = highlights.filter((item) => item.age < item.delay || item.row * fontSize < height + fontSize * 2);
  }

  function frame(timestamp) {
    requestAnimationFrame(frame);
    if (paused || timestamp - lastFrame < targetFrameMs) return;
    const delta = Math.min(0.05, (timestamp - (lastAdvance || timestamp)) / 1000);
    lastAdvance = timestamp;
    lastFrame = timestamp;
    phraseClock += delta;
    ctx.fillStyle = reducedMotion ? 'rgba(0,0,0,.43)' : lowPower ? 'rgba(0,0,0,.34)' : 'rgba(0,0,0,.30)';
    ctx.fillRect(0, 0, width, height);
    for (let index = 0; index < drops.length; index += 1) {
      const drop = drops[index];
      drop.row += drop.speed * delta;
      drawTrail(drop, index, timestamp);
      if ((drop.row - drop.length) * fontSize > height + fontSize * 2) drops[index] = createDrop();
    }
    drawHighlights(timestamp, delta);
    if (phraseClock >= phraseIntervalSeconds && highlights.length === 0) {
      phraseClock = 0;
      spawnPhrase();
    }
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 160);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) {
      lastAdvance = performance.now();
      lastFrame = 0;
    }
  });

  resize();
  requestAnimationFrame(frame);
  window.SVR_MATRIX_RAIN_STATE = {
    build: BUILD,
    active: true,
    thinnerRain: true,
    phraseLettersIndividuallyStaggered: true,
    phraseIntervalSeconds,
    phraseStaggerSeconds,
    phraseBursts: () => phraseBursts,
    profileLegendModule: false,
    phase370SitePolish: /^\/site\//i.test(location.pathname),
    androidAppLeadSlide: /\/site\/index\.html$/i.test(location.pathname),
    publicAiFallback: !/\/site\//i.test(location.pathname),
    camera3Route: CAMERA3,
    reducedMotion,
    lowPower,
    checkedAt: new Date().toISOString()
  };
})();
