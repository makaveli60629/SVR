(() => {
  const BUILD = 'PHASE-356-MATRIX-SECRET-PHRASE-PACING-LOCK';
  const CAMERA3 = '/game/camera3.html?v=phase356';

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

  routeCamera3();
  new MutationObserver(routeCamera3).observe(document.documentElement, { subtree: true, childList: true });

  if (/\/site\/profile\.html$/i.test(location.pathname) && !document.querySelector('script[data-phase356-profile-legend]')) {
    const module = document.createElement('script');
    module.type = 'module';
    module.src = '/site/js/phase356-profile-legend-pedestal.js?v=phase356';
    module.dataset.phase356ProfileLegend = '1';
    document.head.appendChild(module);
  }

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
  const targetFrameMs = reducedMotion ? 80 : lowPower ? 42 : 24;
  const phraseIntervalSeconds = reducedMotion ? 18 : coarsePointer ? 12 : 9;
  const phraseStaggerSeconds = coarsePointer ? 0.34 : 0.28;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let fontSize = 12;
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
    speed: (lowPower ? 7 : 10) + Math.random() * (lowPower ? 8 : 13),
    length: (lowPower ? 8 : 12) + Math.floor(Math.random() * (lowPower ? 8 : 13)),
    seed: Math.random() * Math.PI * 2
  });

  function resize() {
    dpr = Math.min(lowPower ? 1 : 1.35, Math.max(1, window.devicePixelRatio || 1));
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    fontSize = Math.max(lowPower ? 13 : 11, Math.min(15, Math.round(width / (lowPower ? 74 : 100))));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textBaseline = 'top';
    ctx.font = `700 ${fontSize}px Orbitron, ui-monospace, monospace`;
    const count = Math.ceil(width / fontSize) + 3;
    columns = Array.from({ length: count }, (_, index) => index * fontSize - fontSize);
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
    chars.slice(0, Math.min(chars.length, Math.max(5, Math.floor(columns.length * 0.42)))).forEach((char, index) => {
      highlights.push({
        char,
        column: available[index % available.length],
        row: -4 - Math.random() * 7,
        speed: (coarsePointer ? 8 : 10) + Math.random() * 4,
        alpha: 0,
        delay: index * phraseStaggerSeconds,
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
      const alpha = trail === 0 ? 0.68 : Math.max(0.015, 0.25 * (1 - trail / drop.length));
      const pulse = 0.55 + 0.45 * Math.sin(timestamp * 0.0012 + drop.seed + y * 0.012);
      const red = 132 + Math.floor(32 * pulse);
      const green = 48 + Math.floor(28 * pulse);
      ctx.fillStyle = `rgba(${red},${green},240,${alpha})`;
      if (trail === 0 && !lowPower) {
        ctx.shadowColor = 'rgba(190,105,255,.34)';
        ctx.shadowBlur = 5;
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
      const fadeIn = Math.min(1, visibleAge / 0.45);
      const fadeOut = Math.max(0, 1 - Math.max(0, y - height * 0.62) / Math.max(1, height * 0.38));
      item.alpha = Math.min(0.9, fadeIn * fadeOut);
      const pulse = 0.65 + 0.35 * Math.sin(timestamp * 0.003 + item.pulse);
      ctx.fillStyle = `rgba(255,${160 + Math.floor(45 * pulse)},244,${item.alpha})`;
      if (!lowPower) {
        ctx.shadowColor = `rgba(100,225,255,${0.18 + pulse * 0.2})`;
        ctx.shadowBlur = 8;
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
    ctx.fillStyle = reducedMotion ? 'rgba(0,0,0,.38)' : lowPower ? 'rgba(0,0,0,.29)' : 'rgba(0,0,0,.24)';
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
    resizeTimer = setTimeout(resize, 140);
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
    phraseIntervalSeconds,
    phraseStaggerSeconds,
    phraseBursts: () => phraseBursts,
    profileLegendModule: /\/site\/profile\.html$/i.test(location.pathname),
    camera3Route: CAMERA3,
    reducedMotion,
    lowPower,
    checkedAt: new Date().toISOString()
  };
})();
