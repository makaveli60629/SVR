(() => {
  const BUILD = 'PHASE-370-ACCOUNT-PROFILE-AVATAR-MOBILE-POLISH-LOCK';
  const state = {
    build: BUILD,
    menuInstalled: false,
    accountLinksInstalled: false,
    menuRefreshes: 0,
    profileNoiseRemoved: 0,
    portraitReady: false,
    mobile: matchMedia('(max-width:900px),(pointer:coarse)').matches,
    checkedAt: null
  };

  function accountHref(mode = 'login') {
    const prefix = /\/site\//i.test(location.pathname) ? '' : '/site/';
    return mode === 'register' ? `${prefix}login.html?mode=register` : `${prefix}login.html`;
  }

  function installAccountLinks() {
    const host = document.querySelector('.links,.avatar-links,.market-links');
    if (!host) return false;
    const anchors = [...host.querySelectorAll('a')];
    const hasLogin = anchors.some((link) => {
      const href = String(link.getAttribute('href') || '').toLowerCase();
      return /(?:^|\/)login\.html(?:$|\?)/.test(href) && !/[?&]mode=register/.test(href);
    });
    const hasRegister = anchors.some((link) => {
      const href = String(link.getAttribute('href') || '').toLowerCase();
      const text = String(link.textContent || '').trim().toLowerCase();
      return /(?:^|\/)register\.html(?:$|\?)/.test(href)
        || /(?:^|\/)login\.html\?[^#]*mode=register/.test(href)
        || text === 'register';
    });

    const profileLink = anchors.find((link) => /(?:^|\/)profile\.html(?:$|[?#])/.test(String(link.getAttribute('href') || '').toLowerCase()));
    const registerLink = anchors.find((link) => {
      const href = String(link.getAttribute('href') || '').toLowerCase();
      const text = String(link.textContent || '').trim().toLowerCase();
      return /(?:^|\/)register\.html(?:$|\?)/.test(href)
        || /(?:^|\/)login\.html\?[^#]*mode=register/.test(href)
        || text === 'register';
    });

    if (!hasLogin) {
      const login = document.createElement('a');
      login.href = accountHref('login');
      login.textContent = 'Login';
      login.dataset.svr370AccountLink = 'login';
      if (/\/site\/login\.html$/i.test(location.pathname) && !new URLSearchParams(location.search).has('mode')) {
        login.setAttribute('aria-current', 'page');
      }
      host.insertBefore(login, registerLink || profileLink || host.firstChild);
    }

    if (!hasRegister) {
      const register = document.createElement('a');
      register.href = accountHref('register');
      register.textContent = 'Register';
      register.dataset.svr370AccountLink = 'register';
      if (/\/site\/login\.html$/i.test(location.pathname) && new URLSearchParams(location.search).get('mode') === 'register') {
        register.setAttribute('aria-current', 'page');
      }
      const refreshedProfile = [...host.querySelectorAll('a')].find((link) => /(?:^|\/)profile\.html(?:$|[?#])/.test(String(link.getAttribute('href') || '').toLowerCase()));
      host.insertBefore(register, refreshedProfile || null);
    }

    const finalLinks = [...host.querySelectorAll('a')];
    state.accountLinksInstalled = finalLinks.some((link) => String(link.textContent || '').trim() === 'Login')
      && finalLinks.some((link) => String(link.textContent || '').trim() === 'Register');
    return state.accountLinksInstalled;
  }

  function linksFromNav(nav) {
    const sources = nav?.querySelectorAll?.('.links a,.avatar-links a,.market-links a') || [];
    return [...sources].map((link) => ({
      href: link.getAttribute('href') || '#',
      text: String(link.textContent || '').trim(),
      current: link.getAttribute('aria-current') === 'page'
    })).filter((entry) => entry.text);
  }

  function menuSignature(links) {
    return JSON.stringify(links.map((entry) => [entry.href, entry.text, entry.current]));
  }

  function menuHtml(links) {
    return links.map((entry) => `<a href="${entry.href}"${entry.current ? ' aria-current="page"' : ''}>${entry.text}</a>`).join('');
  }

  function rebuildMenuPanel() {
    const nav = document.querySelector('.nav,.avatar-nav,.market-nav');
    const panel = document.getElementById('svr370MenuPanel');
    if (!nav || !panel) return false;
    const links = linksFromNav(nav);
    const signature = menuSignature(links);
    if (panel.dataset.svr370Signature === signature) return false;
    panel.dataset.svr370Signature = signature;
    panel.innerHTML = menuHtml(links);
    state.menuRefreshes += 1;
    return true;
  }

  function installMenu() {
    const nav = document.querySelector('.nav,.avatar-nav,.market-nav');
    if (!nav) return;
    const existingButton = document.getElementById('svr370MenuButton');
    if (existingButton) {
      rebuildMenuPanel();
      state.menuInstalled = true;
      return;
    }
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
    panel.dataset.svr370Signature = menuSignature(links);
    panel.innerHTML = menuHtml(links);
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
    const menuLinks = [...document.querySelectorAll('#svr370MenuPanel a')].map((link) => String(link.textContent || '').trim());
    const desktopLinks = [...document.querySelectorAll('.links a,.avatar-links a,.market-links a')].map((link) => String(link.textContent || '').trim());
    const result = {
      ...state,
      menuButtons: document.querySelectorAll('#svr370MenuButton').length,
      menuPanels: document.querySelectorAll('#svr370MenuPanel').length,
      desktopLoginLinks: desktopLinks.filter((text) => text === 'Login').length,
      desktopRegisterLinks: desktopLinks.filter((text) => text === 'Register').length,
      menuLoginLinks: menuLinks.filter((text) => text === 'Login').length,
      menuRegisterLinks: menuLinks.filter((text) => text === 'Register').length,
      menuSignatureReady: Boolean(document.getElementById('svr370MenuPanel')?.dataset.svr370Signature),
      noisyLegendNodes: document.querySelectorAll('[id*="legend" i],[class*="legend-pedestal" i],[data-phase356-profile-legend]').length,
      pass: Boolean(
        state.menuInstalled
        && state.accountLinksInstalled
        && document.querySelectorAll('#svr370MenuButton').length === 1
        && desktopLinks.includes('Login')
        && desktopLinks.includes('Register')
        && menuLinks.includes('Login')
        && menuLinks.includes('Register')
        && document.getElementById('svr370MenuPanel')?.dataset.svr370Signature
      ),
      checkedAt: state.checkedAt
    };
    window.SVR_PHASE370_SITE_QA_STATE = result;
    return result;
  }

  function install() {
    installAccountLinks();
    installMenu();
    removeProfileNoise();
    installPortrait();
    enforceAvatarConcept();
    installRegistrationSupportNotice();
    const observer = new MutationObserver(() => {
      installAccountLinks();
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
