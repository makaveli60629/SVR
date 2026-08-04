export const BUILD = 'PHASE-374-ANDROID-TOURNAMENT-CARD-UI-LOCK';

const ua = navigator.userAgent || '';
const ACTIVE = /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(ua) && !/Quest|Oculus|Meta Quest/i.test(ua));
const DEFAULT_BRAND = Object.freeze({
  id: 'svr-default',
  name: 'SVR POKER',
  logoUrl: '/logo.png'
});

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  brand: { ...DEFAULT_BRAND },
  cardsEnhanced: 0,
  tenRanksExpanded: 0,
  sticksHiddenWhileSeated: true,
  logoVisible: false,
  lastError: null,
  installedAt: null,
  checkedAt: null
};

let logo;
let observer;
let timer = 0;
const SUITS = Object.freeze({
  '♠': { symbol: '♠', className: 'black', name: 'spades' },
  '♣': { symbol: '♣', className: 'black', name: 'clubs' },
  '♥': { symbol: '♥', className: 'red', name: 'hearts' },
  '♦': { symbol: '♦', className: 'red', name: 'diamonds' },
  S: { symbol: '♠', className: 'black', name: 'spades' },
  C: { symbol: '♣', className: 'black', name: 'clubs' },
  H: { symbol: '♥', className: 'red', name: 'hearts' },
  D: { symbol: '♦', className: 'red', name: 'diamonds' }
});

function seated() {
  return Boolean(
    window.SVR_PHASE347_STATE?.seated
    || window.SVR_PHASE363_STATE?.joined
    || document.body.classList.contains('svr347-seated')
    || document.body.classList.contains('svr363-seated')
    || document.body.classList.contains('svr365-seated')
    || document.body.classList.contains('svr367-seated')
  );
}

function installCss() {
  if (document.getElementById('svr374-android-ui-style')) return;
  const style = document.createElement('style');
  style.id = 'svr374-android-ui-style';
  style.textContent = `
    #svr374TournamentLogo{position:fixed;right:max(12px,env(safe-area-inset-right));top:max(58px,calc(env(safe-area-inset-top) + 50px));z-index:2147483590;display:grid;place-items:center;width:68px;height:68px;border:1px solid rgba(255,217,138,.68);border-radius:16px;background:rgba(2,5,12,.72);box-shadow:0 12px 34px rgba(0,0,0,.55),0 0 20px rgba(127,252,255,.14);backdrop-filter:blur(10px);pointer-events:none;overflow:hidden}
    #svr374TournamentLogo img{display:block;max-width:58px;max-height:58px;width:auto;height:auto;object-fit:contain;filter:drop-shadow(0 0 8px rgba(170,100,255,.38))}
    #svr374TournamentLogo span{position:absolute;left:4px;right:4px;bottom:2px;text-align:center;color:#fff;font:900 6px/1 system-ui;letter-spacing:.04em;text-shadow:0 1px 3px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    body.svr347-seated #svr347Move,body.svr347-seated #svr347Look,
    body.svr363-seated #svr347Move,body.svr363-seated #svr347Look,
    body.svr365-seated #svr347Move,body.svr365-seated #svr347Look,
    body.svr367-seated #svr347Move,body.svr367-seated #svr347Look,
    body.svr374-seated #svr347Move,body.svr374-seated #svr347Look{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    .svr347-card.svr374-card-enhanced{position:relative;display:block!important;padding:0!important;overflow:hidden;font-size:0!important;line-height:1!important;background:linear-gradient(145deg,#fffdf5,#ddd5c5)!important;border:1px solid rgba(15,15,18,.95)!important;color:#111!important}
    .svr347-card.svr374-card-enhanced.red{color:#b00020!important}
    .svr374-card-face{position:absolute;inset:0;display:grid;place-items:center;color:inherit}
    .svr374-card-center{font:1000 clamp(25px,7vw,36px)/1 Georgia,serif;transform:translateY(1px)}
    .svr374-card-corner{position:absolute;display:grid;justify-items:center;gap:0;color:inherit;font-family:Arial,sans-serif;font-weight:1000;line-height:.82;text-align:center}
    .svr374-card-corner b{font-size:12px;line-height:.9}.svr374-card-corner i{font-size:10px;font-style:normal;line-height:.9}.svr374-card-corner.top{left:3px;top:3px}.svr374-card-corner.bottom{right:3px;bottom:3px;transform:rotate(180deg)}
    .svr347-community-card.svr374-card-enhanced{width:46px!important;height:64px!important;border-radius:8px!important}
    .svr347-hole-card.svr374-card-enhanced{width:52px!important;height:72px!important;border-radius:9px!important}
    #svr347Community{gap:7px!important;padding:7px 9px!important}
    #svr347Hole{gap:8px!important}
    @media(orientation:landscape){#svr374TournamentLogo{top:max(10px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));width:62px;height:62px}.svr347-community-card.svr374-card-enhanced{width:42px!important;height:59px!important}.svr347-hole-card.svr374-card-enhanced{width:48px!important;height:67px!important}}
    @media(max-width:420px){#svr374TournamentLogo{width:58px;height:58px;top:max(54px,calc(env(safe-area-inset-top) + 46px))}#svr374TournamentLogo img{max-width:49px;max-height:49px}.svr347-community-card.svr374-card-enhanced{width:41px!important;height:58px!important}.svr374-card-center{font-size:28px}}
  `;
  document.head.appendChild(style);
}

function normalizeRank(value) {
  const rank = String(value || '').trim().toUpperCase();
  if (rank === 'T') {
    state.tenRanksExpanded += 1;
    return '10';
  }
  return rank;
}

function parseCard(element) {
  if (!element || element.classList.contains('empty')) return null;
  const raw = String(element.dataset.svr374CardSource || element.textContent || '').replace(/\s+/g, '').toUpperCase();
  const match = raw.match(/^(10|T|[2-9JQKA])([SHDC♠♥♦♣])$/i);
  if (!match) return null;
  const rank = normalizeRank(match[1]);
  const suit = SUITS[match[2].toUpperCase()] || SUITS[match[2]];
  if (!suit) return null;
  return { rank, suit, source: `${rank}${suit.symbol}` };
}

function enhanceCard(element) {
  if (!element?.classList?.contains('svr347-card')) return false;
  if (element.querySelector('.svr374-card-face')) return true;
  const parsed = parseCard(element);
  if (!parsed) {
    element.classList.remove('svr374-card-enhanced');
    delete element.dataset.svr374CardSource;
    return false;
  }
  element.dataset.svr374CardSource = parsed.source;
  element.dataset.svr374Rank = parsed.rank;
  element.dataset.svr374Suit = parsed.suit.name;
  element.classList.add('svr374-card-enhanced');
  element.classList.toggle('red', parsed.suit.className === 'red');
  element.setAttribute('aria-label', `${parsed.rank} of ${parsed.suit.name}`);
  element.innerHTML = `
    <span class="svr374-card-face" aria-hidden="true">
      <span class="svr374-card-corner top"><b>${parsed.rank}</b><i>${parsed.suit.symbol}</i></span>
      <span class="svr374-card-center">${parsed.suit.symbol}</span>
      <span class="svr374-card-corner bottom"><b>${parsed.rank}</b><i>${parsed.suit.symbol}</i></span>
    </span>`;
  state.cardsEnhanced += 1;
  return true;
}

function enhanceCards() {
  for (const card of document.querySelectorAll('.svr347-card')) enhanceCard(card);
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE374_ANDROID_UI_STATE = { ...state };
}

function ensureLogo() {
  if (logo) return logo;
  logo = document.createElement('aside');
  logo.id = 'svr374TournamentLogo';
  logo.setAttribute('aria-label', `${state.brand.name} tournament sponsor`);
  logo.innerHTML = `<img alt="${state.brand.name} logo"><span></span>`;
  document.body.appendChild(logo);
  applyBrand(state.brand);
  return logo;
}

function applyBrand(next = {}) {
  state.brand = {
    id: String(next.id || state.brand.id || DEFAULT_BRAND.id),
    name: String(next.name || state.brand.name || DEFAULT_BRAND.name).slice(0, 48),
    logoUrl: String(next.logoUrl || state.brand.logoUrl || DEFAULT_BRAND.logoUrl)
  };
  ensureLogo();
  const image = logo.querySelector('img');
  const label = logo.querySelector('span');
  image.src = state.brand.logoUrl;
  image.alt = `${state.brand.name} logo`;
  image.onerror = () => {
    if (image.src.endsWith('/logo.png')) return;
    image.src = '/logo.png';
  };
  label.textContent = state.brand.name;
  logo.setAttribute('aria-label', `${state.brand.name} tournament sponsor`);
  state.logoVisible = true;
  window.SVR_ANDROID_BRAND_SLOT = { ...state.brand };
  window.dispatchEvent(new CustomEvent('svr:phase374-tournament-brand', { detail: { ...state.brand } }));
  return { ...state.brand };
}

function syncSeatUi(reason = 'sync') {
  const value = seated();
  document.body.classList.toggle('svr374-seated', value);
  const move = document.getElementById('svr347Move');
  const look = document.getElementById('svr347Look');
  for (const control of [move, look]) {
    if (!control) continue;
    control.setAttribute('aria-hidden', value ? 'true' : 'false');
    if (value) {
      try { control.inert = true; } catch {}
    } else {
      try { control.inert = false; } catch {}
    }
  }
  state.lastSeatReason = reason;
  window.SVR_PHASE374_ANDROID_UI_STATE = { ...state };
  return value;
}

function qa() {
  const cards = [...document.querySelectorAll('.svr347-card:not(.empty)')];
  const readableCards = cards.filter((card) => Boolean(parseCard(card)));
  const enhancedCards = readableCards.filter((card) => card.querySelector('.svr374-card-face'));
  const cardBacks = cards.filter((card) => !parseCard(card));
  const result = {
    ...state,
    logoExists: Boolean(document.getElementById('svr374TournamentLogo')),
    nonEmptyCards: cards.length,
    readableFaceCards: readableCards.length,
    enhancedCards: enhancedCards.length,
    cardBacksPreserved: cardBacks.length,
    sticksCurrentlyHidden: seated()
      ? [document.getElementById('svr347Move'), document.getElementById('svr347Look')].every((control) => !control || getComputedStyle(control).display === 'none')
      : true,
    pass: Boolean(
      ACTIVE
      && state.installed
      && document.getElementById('svr374TournamentLogo')
      && enhancedCards.length === readableCards.length
    ),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE374_ANDROID_UI_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || state.installed) return;
  state.installed = true;
  state.installedAt = new Date().toISOString();
  installCss();
  ensureLogo();
  applyBrand(window.SVR_ANDROID_BRAND_SLOT || DEFAULT_BRAND);
  observer = new MutationObserver(() => {
    queueMicrotask(() => {
      enhanceCards();
      syncSeatUi('mutation');
    });
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  timer = window.setInterval(() => {
    enhanceCards();
    syncSeatUi('interval');
  }, 650);
  window.SVR_PHASE374_SET_TOURNAMENT_BRAND = applyBrand;
  window.SVR_PHASE374_ANDROID_UI_QA = qa;
  window.addEventListener('svr:phase363-immediate-join-state', () => syncSeatUi('join-state'));
  window.addEventListener('svr:phase372-core-ready', () => {
    enhanceCards();
    syncSeatUi('core-ready');
  });
  window.addEventListener('beforeunload', () => {
    clearInterval(timer);
    observer?.disconnect();
  }, { once: true });
  enhanceCards();
  syncSeatUi('installed');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();