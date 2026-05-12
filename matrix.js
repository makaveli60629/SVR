(() => {
  const canvas = document.getElementById('binary-rain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const glyphs = ['0', '1'];
  const phrases = ['I LOVE SHY', 'I LOVE SCARLETT'];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let fontSize = 12;
  let columns = [];
  let drops = [];
  let bursts = [];
  let last = 0;
  let burstTimer = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fontSize = Math.max(10, Math.min(13, Math.round(width / 120)));
    const count = Math.ceil(width / fontSize) + 4;
    columns = Array.from({ length: count }, (_, i) => i * fontSize);
    drops = Array.from({ length: count }, () => ({
      row: -Math.random() * (height / fontSize),
      speed: 16 + Math.random() * 20,
      length: 18 + Math.floor(Math.random() * 20)
    }));
    bursts = [];
    ctx.font = `700 ${fontSize}px Orbitron, monospace`;
    ctx.textBaseline = 'top';
  }

  function randomChar() {
    return glyphs[Math.random() < 0.5 ? 0 : 1];
  }

  function spawnPhrase() {
    const phrase = phrases[(Math.random() * phrases.length) | 0];
    const chars = [...phrase].filter((c) => c !== ' ');
    const used = new Set();
    for (const ch of chars) {
      let index = 0;
      do {
        index = (Math.random() * drops.length) | 0;
      } while (used.has(index) && used.size < drops.length / 3);
      used.add(index);
      bursts.push({
        column: index,
        char: ch,
        row: -4 - Math.random() * 14,
        speed: 20 + Math.random() * 12,
        alpha: 0.95,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  function drawGlyph(x, y, ch, alpha, head, glowSeed) {
    const pulse = 0.55 + 0.45 * Math.sin(glowSeed + y * 0.014);
    const r = 156 + Math.floor(24 * pulse);
    const g = 74 + Math.floor(24 * pulse);
    const b = 255;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    if (head) {
      ctx.shadowColor = 'rgba(214, 132, 255, 0.42)';
      ctx.shadowBlur = 8;
    }
    ctx.fillText(ch, x, y);
    if (head) ctx.shadowBlur = 0;
  }

  function drawHighlight(x, y, ch, alpha, ts) {
    const pulse = 0.62 + 0.38 * Math.sin(ts * 0.004 + y * 0.02);
    ctx.fillStyle = `rgba(255, ${145 + Math.floor(55 * pulse)}, 244, ${alpha})`;
    ctx.shadowColor = `rgba(96, 226, 255, ${0.22 + pulse * 0.22})`;
    ctx.shadowBlur = 12;
    ctx.fillText(ch, x, y);
    ctx.shadowBlur = 0;
  }

  function frame(ts) {
    if (!last) last = ts;
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    burstTimer += dt;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i];
      drop.row += drop.speed * dt;
      const headRow = Math.floor(drop.row);
      const x = columns[i];

      if ((headRow - drop.length) * fontSize > height + fontSize * 2) {
        drop.row = -Math.random() * 30 - Math.random() * (height / fontSize) * 0.25;
        drop.speed = 16 + Math.random() * 20;
        drop.length = 18 + Math.floor(Math.random() * 20);
      }

      const burstMap = new Map();
      for (const burst of bursts) {
        if (burst.column !== i) continue;
        burstMap.set(Math.floor(burst.row), burst);
      }

      for (let trail = 0; trail < drop.length; trail++) {
        const row = headRow - trail;
        const y = row * fontSize;
        if (y < -fontSize || y > height + fontSize) continue;

        const burst = burstMap.get(row);
        if (burst) {
          drawHighlight(x, y, burst.char, Math.max(0.5, burst.alpha - trail * 0.05), ts + burst.pulse);
          continue;
        }

        const alpha = trail === 0 ? 0.98 : Math.max(0.035, 0.34 - trail * 0.013);
        drawGlyph(x, y, randomChar(), alpha, trail === 0, ts * 0.0014 + i * 0.37);
      }
    }

    for (const burst of bursts) {
      burst.row += burst.speed * dt;
    }
    bursts = bursts.filter((burst) => burst.row * fontSize < height + fontSize * 4);

    if (burstTimer > 2.8) {
      burstTimer = 0;
      spawnPhrase();
    }

    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
