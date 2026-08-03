(() => {
  const BUILD = 'PHASE-370-ACCOUNT-PROFILE-AVATAR-MOBILE-POLISH-LOCK';
  const state = {
    build: BUILD,
    menuInstalled: false,
    profileNoiseRemoved: 0,
    portraitReady: false,
    mobile: matchMedia('(max-width:900px),(pointer:coarse)').matches,
    checkedAt: null
  };

  function linksFromNav(nav) {
    const sources = nav?.querySelectorAll?.('.links a,.avatar-links a,.market-links a') || [];
    return [...sources].map((link) => ({
      href: link.getAttribute('href') || '#',
      text: String(link.textContent || '').trim(),
      current: link.getAttribute('aria-current') === 'page'
    })).filter((entry) => entry.text);
  }

  function installMenu() {
    if (document.getElementById('svr370MenuButton')) return;
    const nav = document.querySelector('.nav,.avatar-nav,.market-nav');
    if (!nav) return;
    const links = linksFromNav(nav);
    if (!links.length) return;
    const button = document.createElement('button');
    button.id = 'svr370MenuButton';
    button.className = 'svr370-menu-button';
    button.type = 'button';
    button.setAttribute('aria-label', 'Open navigation menu');
    button.setAttribute('aria-expanded', 'false');
    button.textContent = '☰';
    const panel = document.createElement('div');
    panel.id = 'svr370MenuPanel';
    panel.className = 'svr370-menu-panel';
    panel.innerHTML = links.map((entry) => `<a href="${entry.href}"${entry.current ? ' aria-current="page"' : ''}>${entry.text}</a>`).join('');
    nav.appendChild(button);
    document.body.appendChild(panel);
    button.addEventListener('click', () => {
      const open = panel.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? '×' : '☰';
    });
    document.addEventListener('click', (event) => {
      if (event.target === button || panel.contains(event.target)) return;
      panel.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
      button.textContent = '☰';
    });
    state.menuInstalled = true;
  }

  function removeProfileNoise() {
    if (!/\/site\/(?:profile|avatar)\.html$/i.test(location.pathname)) return;
    const noisy = [
      '[id*="legend" i]', '[class*="legend-pedestal" i]', '[data-phase356-profile-legend]',
      '.profile-legend-panel', '.legend-overlay', '.founder-legend'
    ];
    let removed = 0;
    document.querySelectorAll(noisy.join(',')).forEach((element) => {
      if (element.closest?.('.profile-card') || element.closest?.('.wardrobe-card')) return;
      element.remove();
      removed += 1;
    });
    document.querySelectorAll('body *').forEach((element) => {
      if (element.children.length || element.closest?.('nav,footer,.profile-card,.wardrobe-card')) return;
      const text = String(element.textContent || '').trim().replace(/\s+/g, ' ').toUpperCase();
      if (!['SVR LEGEND / ERIC', 'FOUNDER LEGEND', 'SVR LEGEND'].includes(text)) return;
      element.remove();
      removed += 1;
    });
    state.profileNoiseRemoved += removed;
  }

  function installPortrait() {
    if (!/\/site\/profile\.html$/i.test(location.pathname)) return;
    const card = document.querySelector('.profile-summary .profile-card');
    if (!card || document.getElementById('svr370ProfilePortrait')) return;
    const wrap = document.createElement('div');
    wrap.id = 'svr370ProfilePortrait';
    wrap.className = 'svr370-profile-portrait';
    wrap.innerHTML = '<img src="/logo.png" alt="Player avatar portrait"><div><strong>PLAYER AVATAR</strong><span>Eric default • live 3D profile</span></div>';
    card.prepend(wrap);
    const image = wrap.querySelector('img');
    const capture = () => {
      const canvas = document.getElementById('profileShowroomCanvas');
      try {
        const data = canvas?.toDataURL?.('image/png');
        if (data && data.length > 200) {
          image.src = data;
          state.portraitReady = true;
        }
      } catch {}
    };
    window.addEventListener('svr:profile-showroom-ready', () => setTimeout(capture, 900));
    setTimeout(capture, 3500);
  }

  function enforceAvatarConcept() {
    if (!/\/site\/avatar\.html$/i.test(location.pathname)) return;
    const rotate = document.getElementById('autoRotate');
    if (rotate) {
      rotate.checked = true;
      rotate.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const title = document.querySelector('.viewer-title span');
    if (title) title.textContent = 'DEFAULT ERIC AVATAR PREVIEW';
  }

  function installRegistrationSupportNotice() {
    if (!/\/site\/login\.html$/i.test(location.pathname)) return;
    const register = document.getElementById('registerForm');
    if (!register || register.querySelector('.svr370-register-support')) return;
    const notice = document.createElement('div');
    notice.className = 'svr370-register-support';
    notice.innerHTML = '<strong>Development support:</strong> Cash App <strong>$SVRhelp</strong>. Payment is optional and is never required to register or test SVR Poker. Never enter a Cash App password, PIN, or card number here.';
    register.appendChild(notice);
  }

  function audit() {
    state.checkedAt = new Date().toISOString();
    const result = {
      ...state,
      menuButtons: document.querySelectorAll('#svr370MenuButton').length,
      menuPanels: document.querySelectorAll('#svr370MenuPanel').length,
      noisyLegendNodes: document.querySelectorAll('[id*="legend" i],[class*="legend-pedestal" i],[data-phase356-profile-legend]').length,
      pass: state.menuInstalled && document.querySelectorAll('#svr370MenuButton').length === 1,
      checkedAt: state.checkedAt
    };
    window.SVR_PHASE370_SITE_QA_STATE = result;
    return result;
  }

  function install() {
    installMenu();
    removeProfileNoise();
    installPortrait();
    enforceAvatarConcept();
    installRegistrationSupportNotice();
    const observer = new MutationObserver(() => {
      installMenu();
      removeProfileNoise();
      installPortrait();
      enforceAvatarConcept();
      installRegistrationSupportNotice();
    });
    observer.observe(document.body, { subtree: true, childList: true });
    window.SVR_PHASE370_SITE_QA = audit;
    window.SVR_PHASE370_SITE_STATE = state;
    setTimeout(audit, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
