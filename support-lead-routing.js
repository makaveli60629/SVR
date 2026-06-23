(() => {
  const BUILD = 'PHASE-152-AI-SUPPORT-LEAD-CAPTURE-ADMIN-ROUTING';
  const LEAD_KEY = 'svr_support_leads';
  if (window.SVR_SUPPORT_LEAD_ROUTING_LOADED) return;
  window.SVR_SUPPORT_LEAD_ROUTING_LOADED = true;

  function norm(v){ return String(v || '').toLowerCase().replace(/[^a-z0-9@.$\s/-]/g,' ').replace(/\s+/g,' ').trim(); }
  function loadLeads(){ try { return JSON.parse(localStorage.getItem(LEAD_KEY) || '[]'); } catch { return []; } }
  function saveLead(lead){ try { const leads = loadLeads(); leads.push(lead); localStorage.setItem(LEAD_KEY, JSON.stringify(leads.slice(-250))); } catch {} }
  function fieldValue(form, name){ return String(form?.querySelector(`[name="${name}"]`)?.value || '').trim(); }
  function classify(message, explicitType=''){
    const q = norm(`${explicitType} ${message}`);
    let type = 'general-support';
    let priority = 'normal';
    if(/black|crash|broken|cannot|can t|not working|error|bug|screen|move|movement|joystick|android/.test(q)) type = 'game-bug';
    if(/android|phone|chrome|tap move|walk off|walk on|recover/.test(q)) type = 'android-issue';
    if(/sponsor|advertis|billboard|banner|brand|campaign|placement/.test(q)) type = 'sponsor-lead';
    if(/partner|partnership|collab|booking|referral|compensation|operator/.test(q)) type = 'partnership-lead';
    if(/hub|room|portal|storefront|pga|reiki|wellness|scorpion|vip/.test(q)) type = /sponsor|business|brand|advertis/.test(q) ? 'sponsor-hub-lead' : 'hub-request';
    if(/store|membership|checkout|cart|profile|register/.test(q)) type = 'store-support';
    if(/admin|owner|call|contact|email|human|urgent/.test(q)) type = 'admin-callback';
    if(/urgent|asap|emergency|broken|black screen|cannot play|can't play|crash/.test(q)) priority = 'high';
    if(/sponsor|partner|hub|business|brand|campaign/.test(q)) priority = priority === 'high' ? 'high' : 'business';
    return { type, priority };
  }
  function currentContext(){
    const form = document.getElementById('svrSupportChatForm');
    const message = fieldValue(form, 'message');
    const explicitType = fieldValue(form, 'leadType');
    const auto = classify(message, explicitType);
    const context = {
      build: BUILD,
      leadType: explicitType || auto.type,
      autoType: auto.type,
      priority: fieldValue(form, 'priority') || auto.priority,
      businessName: fieldValue(form, 'businessName'),
      hubInterest: fieldValue(form, 'hubInterest'),
      deviceIssue: fieldValue(form, 'deviceIssue'),
      route: location.pathname + location.search,
      pageTitle: document.title,
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString()
    };
    window.SVR_SUPPORT_LEAD_CONTEXT = context;
    return context;
  }
  function enhanceForm(){
    const form = document.getElementById('svrSupportChatForm');
    if(!form || form.dataset.phase152LeadCapture === '1') return false;
    form.dataset.phase152LeadCapture = '1';
    const style = document.createElement('style');
    style.id = 'svr-phase152-lead-style';
    style.textContent = `
      .svr-lead-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;border:1px solid rgba(141,255,180,.22);border-radius:14px;padding:9px;background:rgba(141,255,180,.055)}
      .svr-lead-grid label{display:grid;gap:4px;color:#8dffb4;font:900 10px Orbitron,system-ui,Arial;letter-spacing:.06em;text-transform:uppercase}.svr-lead-grid input,.svr-lead-grid select{width:100%;box-sizing:border-box;border:1px solid rgba(141,255,180,.30);border-radius:11px;background:rgba(0,0,0,.38);color:#fff;padding:8px;font:800 13px Rajdhani,system-ui,Arial}.svr-lead-grid option{background:#050812;color:#fff}.svr-lead-note{grid-column:1/-1;color:#bffcff;font-size:11px;opacity:.88;text-align:center}@media(max-width:760px){.svr-lead-grid{grid-template-columns:1fr}}
    `;
    if(!document.getElementById(style.id)) document.head.appendChild(style);
    const grid = document.createElement('div');
    grid.className = 'svr-lead-grid';
    grid.innerHTML = `
      <label>Question type<select name="leadType"><option value="">Auto classify</option><option value="game-bug">Game bug</option><option value="android-issue">Android issue</option><option value="sponsor-lead">Sponsor lead</option><option value="partnership-lead">Partnership lead</option><option value="hub-request">Hub request</option><option value="store-support">Store support</option><option value="admin-callback">Admin callback</option></select></label>
      <label>Priority<select name="priority"><option value="">Auto priority</option><option value="normal">Normal</option><option value="business">Business lead</option><option value="high">High priority</option></select></label>
      <label>Business / sponsor<input name="businessName" placeholder="Business or sponsor name"></label>
      <label>Hub interest<input name="hubInterest" placeholder="PGA, Reiki, Store, Scorpion, custom..."></label>
      <label class="svr-lead-device">Device / issue<input name="deviceIssue" placeholder="Android Chrome, Quest, desktop, black screen..."></label>
      <div class="svr-lead-note">Phase 152: AI classifies this as a support ticket, sponsor lead, partner lead, hub request, or admin callback.</div>
    `;
    const fields = form.querySelector('.svr-chat-fields');
    if(fields) fields.insertAdjacentElement('afterend', grid); else form.appendChild(grid);
    form.addEventListener('submit', () => {
      const ctx = currentContext();
      saveLead({ ...ctx, message: fieldValue(form, 'message'), name: fieldValue(form, 'name'), email: fieldValue(form, 'email') });
    }, true);
    window.SVR_PHASE152_ENHANCED_FORM = true;
    return true;
  }
  function patchFetch(){
    if(window.SVR_PHASE152_FETCH_PATCHED) return;
    window.SVR_PHASE152_FETCH_PATCHED = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function(input, init={}){
      try{
        const url = typeof input === 'string' ? input : input?.url || '';
        if(/\/api\/messages/i.test(url) && init && typeof init.body === 'string'){
          const body = JSON.parse(init.body);
          const lead = currentContext();
          const merged = { ...body, leadRouting: lead, leadType: lead.leadType, priority: lead.priority, businessName: lead.businessName, hubInterest: lead.hubInterest, deviceIssue: lead.deviceIssue };
          init = { ...init, body: JSON.stringify(merged) };
          saveLead({ ...lead, message: body.message || '', name: body.name || '', email: body.email || '', sentAttempt:true });
        }
      }catch(error){ window.SVR_PHASE152_LAST_PATCH_ERROR = String(error?.message || error); }
      return originalFetch(input, init);
    };
  }
  function publish(){
    window.SVR_PHASE152_AI_SUPPORT_LEAD_CAPTURE = {
      build: BUILD,
      active: true,
      enhancedForm: !!document.querySelector('#svrSupportChatForm[data-phase152-lead-capture="1"]'),
      fetchPatched: !!window.SVR_PHASE152_FETCH_PATCHED,
      leadCount: loadLeads().length,
      fields: ['leadType','priority','businessName','hubInterest','deviceIssue'],
      categories: ['game-bug','android-issue','sponsor-lead','partnership-lead','hub-request','store-support','admin-callback','general-support'],
      checkedAt: new Date().toISOString()
    };
  }
  function boot(){ patchFetch(); enhanceForm(); publish(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setInterval(boot, 1000);
})();
