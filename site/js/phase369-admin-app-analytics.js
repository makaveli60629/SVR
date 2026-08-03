(() => {
  const BUILD = 'PHASE-369-ADMIN-APP-ANALYTICS-FOUNDATION';
  const API_BASE = String(window.SVR_SERVER_API_BASE || window.SVR_API_BASE || 'https://api.svrpoker.com').replace(/\/$/, '');
  const QUEUE_KEY = 'svr_phase369_telemetry_queue';
  const token = () => sessionStorage.getItem('svr_admin_token') || '';
  const $ = (id) => document.getElementById(id);

  function localEvents() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
  }

  function localMetrics() {
    const events = localEvents();
    const installs = new Set(events.map((event) => event.installationId).filter(Boolean));
    const cutoff = Date.now() - 30 * 86400000;
    const active = new Set(events.filter((event) => Date.parse(event.createdAt || 0) >= cutoff).map((event) => event.installationId).filter(Boolean));
    const series = [];
    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
      const day = events.filter((event) => String(event.createdAt || '').slice(0, 10) === date);
      series.push({
        date,
        installs: new Set(day.map((event) => event.installationId).filter(Boolean)).size,
        active: new Set(day.filter((event) => /play|heartbeat|impression/.test(event.name)).map((event) => event.installationId).filter(Boolean)).size,
        downloads: day.filter((event) => /download/.test(event.name)).length
      });
    }
    return {
      totalRegisteredInstallations: installs.size,
      activeInstallations30d: active.size,
      downloads: events.filter((event) => /download/.test(event.name)).length,
      updates: events.filter((event) => event.name === 'apk_update_check').length,
      integrityFailures: 0,
      series,
      installations: []
    };
  }

  async function serverMetrics() {
    const adminToken = token();
    if (!adminToken) throw new Error('ADMIN_LOGIN_REQUIRED');
    const [metricsResponse, installationsResponse] = await Promise.all([
      fetch(`${API_BASE}/api/v1/admin/app-metrics?days=30`, { cache: 'no-store', headers: { Authorization: `Bearer ${adminToken}`, Accept: 'application/json' } }),
      fetch(`${API_BASE}/api/v1/admin/installations?limit=50`, { cache: 'no-store', headers: { Authorization: `Bearer ${adminToken}`, Accept: 'application/json' } })
    ]);
    if (!metricsResponse.ok) throw new Error(`METRICS_${metricsResponse.status}`);
    if (!installationsResponse.ok) throw new Error(`INSTALLATIONS_${installationsResponse.status}`);
    const metrics = await metricsResponse.json();
    const installations = await installationsResponse.json();
    return { ...metrics, installations: installations.items || installations.installations || [] };
  }

  function paintCards(data) {
    $('totalInstalls').textContent = Number(data.totalRegisteredInstallations || 0).toLocaleString();
    $('active30').textContent = Number(data.activeInstallations30d || 0).toLocaleString();
    $('downloads').textContent = Number(data.downloads || 0).toLocaleString();
    $('updates').textContent = Number(data.updates || 0).toLocaleString();
    $('integrityAlerts').textContent = Number(data.integrityFailures || 0).toLocaleString();
  }

  function drawChart(series = []) {
    const canvas = $('activityChart');
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(320, Math.round(rect.width * ratio));
    canvas.height = Math.max(220, Math.round(rect.height * ratio));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const width = canvas.width / ratio, height = canvas.height / ratio;
    ctx.clearRect(0, 0, width, height);
    const pad = { left: 42, right: 16, top: 18, bottom: 34 };
    const max = Math.max(1, ...series.flatMap((item) => [Number(item.active || 0), Number(item.downloads || 0), Number(item.installs || 0)]));
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.fillStyle = '#bfc8dd';
    ctx.font = '11px system-ui';
    for (let i = 0; i <= 4; i += 1) {
      const y = pad.top + (height - pad.top - pad.bottom) * i / 4;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
      ctx.fillText(String(Math.round(max * (1 - i / 4))), 6, y + 4);
    }
    const plot = (key, stroke) => {
      ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.beginPath();
      series.forEach((item, index) => {
        const x = pad.left + (width - pad.left - pad.right) * index / Math.max(1, series.length - 1);
        const y = height - pad.bottom - (height - pad.top - pad.bottom) * Number(item[key] || 0) / max;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };
    plot('active', '#7ffcff'); plot('downloads', '#ffd98a'); plot('installs', '#8dffb4');
    ctx.fillStyle = '#7ffcff'; ctx.fillText('Active', pad.left, height - 10);
    ctx.fillStyle = '#ffd98a'; ctx.fillText('Downloads', pad.left + 60, height - 10);
    ctx.fillStyle = '#8dffb4'; ctx.fillText('Installs', pad.left + 145, height - 10);
  }

  function paintRows(items = []) {
    const body = $('installRows');
    body.innerHTML = '';
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="6">No authenticated server installation records loaded.</td></tr>';
      return;
    }
    items.slice(0, 50).forEach((item) => {
      const row = document.createElement('tr');
      const verdict = String(item.integrityVerdict || 'not_evaluated');
      row.innerHTML = `<td>${String(item.displayName || item.username || 'Anonymous').replace(/[<>]/g, '')}</td><td>${String(item.installationId || '').slice(0, 12)}…</td><td>${item.appVersionName || ''} (${item.appVersionCode || ''})</td><td>${item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleString() : ''}</td><td>${item.countryCode || item.region || '—'}</td><td class="${/pass|licensed|play_recognized/.test(verdict) ? 'ok' : /fail|tamper|unlicensed/.test(verdict) ? 'bad' : 'warn'}">${verdict}</td>`;
      body.appendChild(row);
    });
  }

  async function refresh() {
    $('status').textContent = 'Loading metrics…';
    let data;
    try {
      data = await serverMetrics();
      $('dataMode').textContent = 'SECURE API';
      $('dataMode').style.color = '#8dffb4';
      $('status').textContent = 'Secure admin metrics loaded.';
    } catch (error) {
      data = localMetrics();
      $('dataMode').textContent = 'LOCAL FALLBACK';
      $('status').textContent = error.message === 'ADMIN_LOGIN_REQUIRED'
        ? 'Admin login token is not present. Showing this browser’s local banner events only.'
        : `Secure API unavailable. Local fallback active: ${error.message}`;
    }
    paintCards(data); drawChart(data.series || []); paintRows(data.installations || []);
    window.SVR_PHASE369_ADMIN_ANALYTICS_STATE = { build: BUILD, mode: $('dataMode').textContent, metrics: data, checkedAt: new Date().toISOString() };
  }

  $('refresh').addEventListener('click', refresh);
  $('exportLocal').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(localEvents(), null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `svr-local-app-events-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(link.href);
  });
  window.addEventListener('resize', () => drawChart(window.SVR_PHASE369_ADMIN_ANALYTICS_STATE?.metrics?.series || []));
  refresh();
})();
