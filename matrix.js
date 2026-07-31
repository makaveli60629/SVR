(() => {
  const CAMERA3 = '../game/camera3.html?v=phase341';

  function routeCamera3() {
    document.querySelectorAll('iframe[src*="cam=director"],iframe[src*="autocam=1"]').forEach((frame) => {
      if (frame.dataset.svrCamera3Routed === '1') return;
      frame.dataset.svrCamera3Routed = '1';
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

  const canvas = document.getElementById('binary-rain');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  const glyphs = ['0', '1'];
  const phrases = ['I LOVE SHY', 'I LOVE SCARLETT'];
  const prefersReducedMotion = matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  const coarsePointer = matchMedia?.('(pointer: coarse)')?.matches === true;
  const targetFrameMs = prefersReducedMotion ? 66 : coarsePointer ? 28 : 16;

  let width = 0;
  let height = 0;
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

  const randomGlyph = () => glyphs[Math.random() < 0.5 ? 0 : 1];

  function createDrop() {
    return {
      row: -Math.random() * Math.max(12, height / fontSize),
      speed: 12 + Math.random() * 18,
      length: 16 + Math.floor(Math.random() * 22),
      seed: Math.random() * Math.PI * 2
    };
  }

  function resize() {
    dpr = Math.min(1.75, Math.max(1, window.devicePixelRatio || 1));
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    fontSize = Math.max(10, Math.min(14, Math.round(width / 115)));

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textBaseline = 'top';
    ctx.font = `700 ${fontSize}px Orbitron, ui-monospace, monospace`;

    const count = Math.ceil(width / fontSize) + 4;
    columns = Array.from({ length: count }, (_, index) => index * fontSize - fontSize);
    drops = Array.from({ length: count }, createDrop);
    highlights = [];

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
  }

  function spawnPhrase() {
    if (!drops.length) return;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const chars = [...phrase].filter((char) => char !== ' ');
    const available = Array.from({ length: drops.length }, (_, index) => index);

    for (let index = available.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [available[index], available[swap]] = [available[swap], available[index]];
    }

    chars.forEach((char, index) => {
      const column = available[index % available.length];
      highlights.push({
        char,
        column,
        row: -3 - Math.random() * 16,
        speed: 15 + Math.random() * 11,
        alpha: 1,
        pulse: Math.random() * Math.PI * 2
      });
    });
  }

  function drawTrail(drop, columnIndex, timestamp) {
    const headRow = Math.floor(drop.row);
    const x = columns[columnIndex];

    for (let trail = 0; trail < drop.length; trail += 1) {
      const y = (headRow - trail) * fontSize;
      if (y < -fontSize || y > height + fontSize) continue;

      const alpha = trail === 0 ? 0.98 : Math.max(0.025, 0.38 * (1 - trail / drop.length));
      const pulse = 0.55 + 0.45 * Math.sin(timestamp * 0.0014 + drop.seed + y * 0.014);
      const red = 150 + Math.floor(42 * pulse);
      const green = 58 + Math.floor(42 * pulse);

      ctx.fillStyle = `rgba(${red}, ${green}, 255, ${alpha})`;
      if (trail === 0) {
        ctx.shadowColor = 'rgba(214,132,255,.48)';
        ctx.shadowBlur = 9;
      }
      ctx.fillText(randomGlyph(), x, y);
      if (trail === 0) ctx.shadowBlur = 0;
    }
  }

  function drawHighlights(timestamp) {
    for (const item of highlights) {
      const x = columns[item.column] || 0;
      const y = item.row * fontSize;
      const pulse = 0.62 + 0.38 * Math.sin(timestamp * 0.004 + item.pulse);
      ctx.fillStyle = `rgba(255, ${150 + Math.floor(55 * pulse)}, 244, ${item.alpha})`;
      ctx.shadowColor = `rgba(96,226,255,${0.25 + pulse * 0.28})`;
      ctx.shadowBlur = 13;
      ctx.fillText(item.char, x, y);
    }
    ctx.shadowBlur = 0;
  }

  function frame(timestamp) {
    requestAnimationFrame(frame);
    if (paused || timestamp - lastFrame < targetFrameMs) return;

    const delta = Math.min(0.05, (timestamp - (lastAdvance || timestamp)) / 1000);
    lastAdvance = timestamp;
    lastFrame = timestamp;
    phraseClock += delta;

    ctx.fillStyle = prefersReducedMotion ? 'rgba(0,0,0,.34)' : 'rgba(0,0,0,.20)';
    ctx.fillRect(0, 0, width, height);

    for (let index = 0; index < drops.length; index += 1) {
      const drop = drops[index];
      drop.row += drop.speed * delta;
      drawTrail(drop, index, timestamp);

      if ((drop.row - drop.length) * fontSize > height + fontSize * 2) {
        drops[index] = createDrop();
      }
    }

    for (const item of highlights) {
      item.row += item.speed * delta;
      item.alpha = Math.max(0.35, 1 - Math.max(0, item.row * fontSize - height * 0.55) / Math.max(1, height * 0.65));
    }
    highlights = highlights.filter((item) => item.row * fontSize < height + fontSize * 3);
    drawHighlights(timestamp);

    if (phraseClock >= (prefersReducedMotion ? 7 : 3.4)) {
      phraseClock = 0;
      spawnPhrase();
    }
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) {
      lastAdvance = performance.now();
      lastFrame = 0;
    }
  });

  resize();
  spawnPhrase();
  requestAnimationFrame(frame);

  window.SVR_MATRIX_RAIN_STATE = {
    build: 'MATRIX-RAIN-RESTORE-HOTFIX-01',
    active: true,
    fullTrails: true,
    phraseBursts: true,
    camera3Route: CAMERA3,
    reducedMotion: prefersReducedMotion,
    checkedAt: new Date().toISOString()
  };
})();
