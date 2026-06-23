(() => {
  const BUILD = 'SITE-SUPPORT-CHAT-BOT-APP-INSTALL-LOCK';
  const API_BASE = window.SVR_SERVER_API_BASE || window.SVR_API_BASE || 'https://api.svrpoker.com';
  const STORE_KEY = 'svr_support_chat_messages';
  const SESSION_KEY = 'svr_support_chat_session';
  const QUICK = [
    { key: 'game', label: 'Game help', text: 'I need help with the VR poker game.' },
    { key: 'sponsor', label: 'Sponsorship', text: 'I want information about sponsorship or advertising.' },
    { key: 'store', label: 'Store support', text: 'I need help with the SVR store or membership.' },
    { key: 'admin', label: 'Contact admin', text: 'Please have admin contact me.' }
  ];

  if (window.SVR_SUPPORT_CHAT_BOT_NATIVE_LOADED) return;
  window.SVR_SUPPORT_CHAT_BOT_NATIVE_LOADED = true;

  function sessionId(){
    try{
      let id = localStorage.getItem(SESSION_KEY);
      if(!id){
        id = `svr-chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    }catch{
      return `svr-chat-${Date.now().toString(36)}`;
    }
  }
  function loadMessages(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
    catch { return []; }
  }
  function saveMessage(msg){
    const list = loadMessages();
    list.push(msg);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(-100))); } catch {}
  }
  function adminOnline(){
    const p = window.SVR_ADMIN_PRESENCE;
    if(p && typeof p.isOnline === 'boolean') return p.isOnline;
    const badge = document.querySelector('.admin-status,.status-pill,[data-admin-pill]');
    return /ADMIN ONLINE/i.test(String(badge?.textContent || ''));
  }
  function injectStyle(){
    if(document.getElementById('svr-support-chat-style')) return;
    const style = document.createElement('style');
    style.id = 'svr-support-chat-style';
    style.textContent = `
      #svrSupportChatNative{position:fixed;right:18px;bottom:18px;z-index:2147483647;width:min(370px,calc(100vw - 24px));font-family:Rajdhani,system-ui,Arial;color:#fff;pointer-events:none}
      #svrSupportChatNative summary{list-style:none;pointer-events:auto;float:right;border:1px solid rgba(127,252,255,.82);border-radius:999px;background:linear-gradient(135deg,rgba(127,252,255,.96),rgba(155,77,255,.94));color:#02040a;font:900 13px Orbitron,system-ui,Arial;padding:13px 16px;box-shadow:0 20px 70px rgba(0,0,0,.72),0 0 24px rgba(127,252,255,.30);cursor:pointer;letter-spacing:.06em;text-transform:uppercase;user-select:none}
      #svrSupportChatNative summary::-webkit-details-marker{display:none}
      #svrSupportChatNative .dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#8dffb4;margin-right:8px;box-shadow:0 0 12px #8dffb4}
      #svrSupportChatNative.is-offline .dot{background:#ffd98a;box-shadow:0 0 12px #ffd98a}
      #svrSupportChatNative[open] summary{margin-bottom:10px}
      .svr-chat-native-panel{clear:both;pointer-events:auto;display:none;border:1px solid rgba(127,252,255,.55);border-radius:22px;background:rgba(3,5,14,.98);box-shadow:0 30px 100px rgba(0,0,0,.84),0 0 28px rgba(127,252,255,.16);backdrop-filter:blur(20px);overflow:hidden;max-height:min(650px,calc(100vh - 110px))}
      #svrSupportChatNative[open] .svr-chat-native-panel{display:block}
      .svr-chat-head{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 10px;border-bottom:1px solid rgba(255,255,255,.10);background:linear-gradient(135deg,rgba(127,252,255,.13),rgba(155,77,255,.10))}
      .svr-chat-head strong{font-family:Orbitron,system-ui,Arial;font-size:14px;color:#bffcff;letter-spacing:.06em}.svr-chat-head span{font-size:12px;color:#ffd98a}
      .svr-chat-body{padding:13px;overflow:auto}.svr-chat-msg{margin:8px 0;padding:10px 12px;border-radius:16px;line-height:1.25;font-size:15px}.svr-chat-msg.bot{background:rgba(127,252,255,.10);border:1px solid rgba(127,252,255,.20);color:#eafcff}.svr-chat-msg.user{background:rgba(255,217,138,.13);border:1px solid rgba(255,217,138,.25);color:#fff8df;margin-left:32px}
      .svr-chat-quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.svr-chat-quick button{border:1px solid rgba(127,252,255,.28);border-radius:13px;background:rgba(255,255,255,.065);color:#fff;font-weight:800;padding:9px;cursor:pointer}
      .svr-chat-form{display:grid;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.22)}.svr-chat-form input,.svr-chat-form textarea{width:100%;box-sizing:border-box;border:1px solid rgba(127,252,255,.26);border-radius:13px;background:rgba(0,0,0,.34);color:#fff;padding:10px;font:700 14px Rajdhani,system-ui,Arial;outline:none}.svr-chat-form textarea{min-height:74px;resize:vertical}.svr-chat-form button[type="submit"]{border:1px solid rgba(255,217,138,.62);border-radius:14px;background:linear-gradient(135deg,rgba(255,217,138,.96),rgba(127,252,255,.80));color:#080812;font:900 13px Orbitron,system-ui,Arial;padding:11px;cursor:pointer;text-transform:uppercase}.svr-chat-note{font-size:12px;color:#bffcff;opacity:.86;text-align:center}.svr-chat-status{font-size:12px;color:#ffd98a;text-align:center;min-height:16px}
      @media(max-width:520px){#svrSupportChatNative{right:12px;bottom:12px;width:calc(100vw - 24px)}}
    `;
    document.head.appendChild(style);
  }
  function addMessage(body, who='bot'){
    const wrap = document.getElementById('svrSupportChatBody');
    if(!wrap) return;
    const msg = document.createElement('div');
    msg.className = `svr-chat-msg ${who}`;
    msg.textContent = body;
    wrap.appendChild(msg);
    wrap.scrollTop = wrap.scrollHeight;
  }
  async function sendToServer(entry){
    const response = await fetch(`${API_BASE}/api/messages`, {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({...entry, provider:'support-chat-bot'})
    });
    const data = await response.json().catch(()=>({}));
    if(!response.ok || data.ok === false) throw new Error(data.error || `Message failed ${response.status}`);
    return data;
  }
  async function submit(text, name='', email=''){
    const clean = String(text||'').trim();
    if(!clean) return;
    const status = document.getElementById('svrSupportChatStatus');
    const entry = {
      name:String(name||'').trim(),
      email:String(email||'').trim(),
      subject:'SVR support chat',
      message:clean,
      source:location.pathname || 'svr-site',
      sessionId:sessionId(),
      createdAt:new Date().toISOString()
    };
    addMessage(clean, 'user');
    if(status) status.textContent = 'Sending...';
    try{
      await sendToServer(entry);
      saveMessage({...entry, sent:true});
      addMessage('Message sent to SVR support. We will review it as soon as possible.', 'bot');
      if(status) status.textContent = 'Sent to SVR support.';
    }catch(e){
      saveMessage({...entry, sent:false, error:String(e.message||e)});
      addMessage('Message saved locally. Live support storage is pending server connection.', 'bot');
      if(status) status.textContent = 'Saved locally. Server pending.';
    }
  }
  function removeOldWidgets(){
    document.getElementById('svrSupportChatLaunch')?.remove();
    document.getElementById('svrSupportChatPanel')?.remove();
    document.getElementById('svr-inline-support-chat')?.remove();
  }
  function ensureAppInstallLoader(){
    if (window.SVR_APP_INSTALL_LOADED || document.getElementById('svr-app-install-loader')) return;
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifest = document.createElement('link');
      manifest.rel = 'manifest';
      manifest.href = '/manifest.webmanifest?v=phase102-pwa';
      document.head.appendChild(manifest);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const theme = document.createElement('meta');
      theme.name = 'theme-color';
      theme.content = '#9b4dff';
      document.head.appendChild(theme);
    }
    const script = document.createElement('script');
    script.id = 'svr-app-install-loader';
    script.src = '/app-install.js?v=phase102-pwa';
    script.defer = true;
    document.head.appendChild(script);
  }
  function inject(){
    if(document.getElementById('svrSupportChatNative')) return;
    removeOldWidgets();
    injectStyle();
    ensureAppInstallLoader();
    const details = document.createElement('details');
    details.id = 'svrSupportChatNative';
    details.innerHTML = `
      <summary><span class="dot"></span>Support</summary>
      <section class="svr-chat-native-panel" aria-label="SVR support chat bot">
        <header class="svr-chat-head"><div><strong>SVR Support Chat</strong><br><span id="svrSupportAdminLine">Checking admin status...</span></div></header>
        <div class="svr-chat-body" id="svrSupportChatBody"></div>
        <form class="svr-chat-form" id="svrSupportChatForm">
          <div class="svr-chat-quick">${QUICK.map(q=>`<button type="button" data-chat="${q.key}">${q.label}</button>`).join('')}</div>
          <input name="name" placeholder="Name optional" autocomplete="name"/>
          <input name="email" placeholder="Email optional" autocomplete="email"/>
          <textarea name="message" placeholder="Type your message for SVR support"></textarea>
          <button type="submit">Send Message</button>
          <div class="svr-chat-status" id="svrSupportChatStatus"></div>
          <div class="svr-chat-note">Support bot is in safe mode. Server messages use the SVR API when available.</div>
        </form>
      </section>
    `;
    document.body.appendChild(details);
    details.querySelectorAll('[data-chat]').forEach(btn=>btn.addEventListener('click',()=>{
      const q = QUICK.find(x=>x.key===btn.dataset.chat);
      if(q){
        const textarea = details.querySelector('textarea[name="message"]');
        if(textarea) textarea.value = q.text;
        addMessage(`Quick topic: ${q.label}`, 'bot');
        details.open = true;
      }
    }));
    details.querySelector('#svrSupportChatForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.currentTarget).entries());
      submit(data.message, data.name, data.email);
      e.currentTarget.querySelector('textarea[name="message"]').value='';
    });
    addMessage('Welcome to SVR Poker support. Choose a topic or send a message. For urgent business contact, use admin@svrpoker.com.', 'bot');
    updateAdminLine();
    setInterval(updateAdminLine, 30000);
  }
  function updateAdminLine(){
    const online = adminOnline();
    const root = document.getElementById('svrSupportChatNative');
    const line = document.getElementById('svrSupportAdminLine');
    if(root) root.classList.toggle('is-offline', !online);
    if(line) line.textContent = online ? 'Admin Online • send a message' : 'Admin Offline • message will be saved';
    window.SVR_SUPPORT_CHAT_BOT = { build:BUILD, active:true, nativeDetails:true, adminOnline:online, apiBase:API_BASE, safeFallback:true, appInstallLoader:true, checkedAt:new Date().toISOString() };
  }
  function boot(){
    ensureAppInstallLoader();
    inject();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
