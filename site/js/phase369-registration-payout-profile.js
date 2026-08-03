import { account } from './phase345-player-account-client.js?v=phase346';

export const BUILD = 'PHASE-369-REGISTRATION-PAYOUT-PROFILE-COMPLIANCE-LOCK';

const LOCAL_KEY = 'svr_phase369_payout_profile_v1';
const originalRegister = account.register.bind(account);
const originalUpdateProfile = account.updateProfile.bind(account);

function cleanCashAppTag(value = '') {
  const tag = String(value || '').trim();
  if (!tag) return '';
  const normalized = tag.startsWith('$') ? tag : `$${tag}`;
  if (!/^\$[A-Za-z][A-Za-z0-9_]{1,19}$/.test(normalized)) throw new Error('INVALID_CASH_APP_TAG');
  return normalized;
}

function normalizePayoutProfile(input = {}) {
  const method = ['none', 'cash_app', 'ach_pending'].includes(input.payoutMethod)
    ? input.payoutMethod
    : 'none';
  return {
    method,
    cashAppTag: method === 'cash_app' ? cleanCashAppTag(input.cashAppTag) : '',
    achStatus: method === 'ach_pending' ? 'verification-required' : 'not-requested',
    complianceConsent: input.payoutConsent === true || input.payoutConsent === 'on',
    automatedPayoutsEnabled: false,
    prizeEligibilityStatus: 'pending-legal-and-identity-review',
    updatedAt: new Date().toISOString()
  };
}

function saveLocal(profile) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
  return profile;
}

async function saveApi(profile) {
  const base = String(account.state?.config?.apiBase || '').replace(/\/$/, '');
  if (!base || account.snapshot().mode !== 'api') return saveLocal(profile);
  const response = await fetch(`${base}/player/payout-profile`, {
    method: 'PUT',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-SVR-Client': BUILD
    },
    body: JSON.stringify(profile)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    saveLocal({ ...profile, serverPending: true, error: payload.error || `API_${response.status}` });
    return profile;
  }
  return payload.payoutProfile || payload;
}

account.register = async function phase369Register(input = {}) {
  const payoutProfile = normalizePayoutProfile(input);
  const result = await originalRegister({
    displayName: input.displayName,
    email: input.email,
    password: input.password
  });
  if (payoutProfile.method !== 'none' || payoutProfile.complianceConsent) await saveApi(payoutProfile);
  return result;
};

account.updatePayoutProfile = async function updatePayoutProfile(input = {}) {
  return saveApi(normalizePayoutProfile(input));
};

account.readPayoutProfile = function readPayoutProfile() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); } catch { return null; }
};

account.updateProfile = async function phase369UpdateProfile(patch = {}) {
  const result = await originalUpdateProfile(patch);
  if (patch.payoutMethod || patch.cashAppTag || patch.payoutConsent) await account.updatePayoutProfile(patch);
  return result;
};

function injectFields() {
  const form = document.getElementById('registerForm');
  if (!form || form.querySelector('[data-svr369-payout-fields]')) return false;
  const group = document.createElement('fieldset');
  group.dataset.svr369PayoutFields = '1';
  group.style.cssText = 'display:grid;gap:10px;margin:4px 0;padding:12px;border:1px solid rgba(255,217,138,.28);border-radius:14px;background:rgba(255,217,138,.045)';
  group.innerHTML = `
    <legend style="padding:0 7px;color:#ffd98a;font-weight:900">Future Prize Payout Profile</legend>
    <label>Payout Preference
      <select name="payoutMethod" style="width:100%;box-sizing:border-box;border:1px solid rgba(105,232,255,.3);border-radius:13px;background:#090b15;color:#fff;padding:12px;font:700 16px Rajdhani,system-ui">
        <option value="none">Set up later</option>
        <option value="cash_app">Cash App tag</option>
        <option value="ach_pending">ACH after identity verification</option>
      </select>
    </label>
    <label data-cash-app-field hidden>Cash App tag
      <input name="cashAppTag" maxlength="21" placeholder="$YourCashtag" autocomplete="off">
    </label>
    <label style="display:flex;grid-template-columns:auto 1fr;align-items:flex-start;gap:8px;font-size:13px;line-height:1.3">
      <input name="payoutConsent" type="checkbox" style="width:auto;margin-top:3px">
      <span>I understand this saves a payout preference only. It does not guarantee a cash prize or authorize automatic transfers. Identity, eligibility, tax, contest, payment-provider, and legal review are required before any payout.</span>
    </label>`;
  const submit = form.querySelector('button[type="submit"]');
  form.insertBefore(group, submit || null);
  const select = group.querySelector('select[name="payoutMethod"]');
  const cashField = group.querySelector('[data-cash-app-field]');
  const sync = () => { cashField.hidden = select.value !== 'cash_app'; };
  select.addEventListener('change', sync);
  sync();
  return true;
}

function installStyle() {
  if (document.getElementById('svr369-payout-style')) return;
  const style = document.createElement('style');
  style.id = 'svr369-payout-style';
  style.textContent = `
#registerForm fieldset label{display:grid;gap:6px;color:#d9cdec;font-weight:800}
#registerForm fieldset input,#registerForm fieldset select{font-family:Rajdhani,system-ui}
#registerForm fieldset input[type="checkbox"]{accent-color:#7ffcff}
`;
  document.head.appendChild(style);
}

installStyle();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectFields, { once: true });
else injectFields();

window.SVR_PHASE369_PAYOUT_PROFILE_QA = () => {
  const form = document.getElementById('registerForm');
  return {
    build: BUILD,
    fieldsInstalled: Boolean(form?.querySelector('[data-svr369-payout-fields]')),
    cashAppField: Boolean(form?.querySelector('[name="cashAppTag"]')),
    achCollectsBankNumbers: false,
    automatedPayoutsEnabled: false,
    accountWrapperInstalled: typeof account.updatePayoutProfile === 'function',
    pass: Boolean(form?.querySelector('[data-svr369-payout-fields]') && typeof account.updatePayoutProfile === 'function'),
    checkedAt: new Date().toISOString()
  };
};

window.dispatchEvent(new CustomEvent('svr:phase369-payout-profile-ready', { detail: { build: BUILD } }));
