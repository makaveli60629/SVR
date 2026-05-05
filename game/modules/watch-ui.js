window.SVRWatchUI = {
  setData(data){
    const canvas = document.getElementById('watchCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle="#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle="#00ffcc";
    ctx.font="48px monospace";

    ctx.fillText(`Chips: ${data.chips}`,40,100);
    ctx.fillText(`Pot: ${data.pot}`,40,200);
    ctx.fillText(`Bet: ${data.bet}`,40,300);
  }
};
(function () {
  const STATE = {
    title: 'SVR POKER',
    subtitle: 'FOREARM HUD',
    seat: 'SEAT 3 • LIVE',
    pot: '15,200',
    stack: '68,500',
    blinds: '200 / 400',
    cards: ['A♠', 'K♠'],
    board: ['9♥', '7♠', '10♦', '6♣', 'J♣'],
    actions: ['FOLD', 'CHECK', 'CALL', 'ALL IN'],
    options: ['MENU', 'STORE', 'VIEW', 'AUTO']
  };

  function cardColor(card) {
    return /♥|♦/.test(card) ? '#ff5a5a' : '#eef2ff';
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCard(ctx, x, y, w, h, label, accent) {
    ctx.fillStyle = '#f8fbff';
    roundedRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = '#11151d';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = 'bold 34px Arial';
    ctx.fillText(label, x + 12, y + 38);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = accent;
    ctx.font = 'bold 72px Arial';
    ctx.fillText(label, x + 12, y + h - 18);
    ctx.globalAlpha = 1;
  }

  function drawLogo(ctx) {
    const img = document.getElementById('logoMain');
    if (!img || !img.complete) return;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(img, 980, 22, 250, 86);
    ctx.restore();
  }

  function drawUI() {
    const canvas = document.getElementById('watchCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#03040a');
    bg.addColorStop(0.45, '#0a1220');
    bg.addColorStop(1, '#111a29');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#9b5bff';
    ctx.lineWidth = 14;
    roundedRect(ctx, 12, 12, w - 24, h - 24, 28);
    ctx.stroke();

    const accent = ctx.createLinearGradient(0, 0, 0, 120);
    accent.addColorStop(0, 'rgba(185,122,255,0.22)');
    accent.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = accent;
    roundedRect(ctx, 18, 18, w - 36, 120, 24);
    ctx.fill();

    ctx.fillStyle = '#f4d5ff';
    ctx.font = 'bold 62px Arial';
    ctx.fillText(STATE.title, 34, 72);

    ctx.fillStyle = '#7fd2ff';
    ctx.font = '24px Arial';
    ctx.fillText(STATE.subtitle, 38, 106);
    ctx.fillText(STATE.seat, 282, 106);
    drawLogo(ctx);

    ctx.fillStyle = '#c9d9ff';
    ctx.font = '22px Arial';
    ctx.fillText('STACK', 36, 150);
    ctx.fillText('POT', 286, 150);
    ctx.fillText('BLINDS', 482, 150);

    ctx.fillStyle = '#00f0a2';
    ctx.font = 'bold 54px Arial';
    ctx.fillText(STATE.stack, 36, 206);

    ctx.fillStyle = '#ffd75a';
    ctx.fillText(STATE.pot, 286, 206);

    ctx.fillStyle = '#b6c6ff';
    ctx.fillText(STATE.blinds, 482, 206);

    ctx.fillStyle = '#173922';
    roundedRect(ctx, 28, 228, 776, 152, 18);
    ctx.fill();
    ctx.strokeStyle = '#74dca5';
    ctx.lineWidth = 4;
    ctx.stroke();

    STATE.board.forEach(function (card, i) {
      drawCard(ctx, 56 + i * 148, 248, 102, 116, card, cardColor(card));
    });

    ctx.fillStyle = '#eef2ff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('BOARD', 34, 414);
    ctx.fillText('HAND', 36, 476);

    STATE.cards.forEach(function (card, i) {
      drawCard(ctx, 120 + i * 118, 396, 96, 102, card, cardColor(card));
    });

    const actionColors = ['#445bff', '#18b773', '#f7a526', '#eb3f4a'];
    STATE.actions.forEach(function (label, i) {
      const x = 420 + i * 200;
      const y = 408;
      ctx.fillStyle = actionColors[i];
      roundedRect(ctx, x, y, i === 3 ? 182 : 170, 70, 18);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(label, x + 22, y + 45);
    });

    STATE.options.forEach(function (label, i) {
      const x = 886 + i * 90;
      const y = 146;
      ctx.fillStyle = 'rgba(165,122,255,0.18)';
      roundedRect(ctx, x, y, 78, 38, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(214,194,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#f4e3ff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(label, x + 11, y + 24);
    });
  }

  window.SVRWatchUI = {
    setState: function (next) {
      Object.assign(STATE, next || {});
      drawUI();
    },
    draw: drawUI
  };

  window.addEventListener('DOMContentLoaded', function () {
    const img = document.getElementById('logoMain');
    if (img) img.addEventListener('load', drawUI, { once: true });
    drawUI();
  });
})();
