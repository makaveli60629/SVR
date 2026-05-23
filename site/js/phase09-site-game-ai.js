(() => {
  const PHASE = 'PHASE-92-FULL-PROFILE-DASHBOARD-LOCK';
  const state = {
    profile: {
      name:'SVR Guest Member',
      handle:'@svr-preview',
      tier:'Preview VIP',
      chips:'25,000',
      room:'Scorpion Room',
      status:'Ready',
      avatar:'SVR',
      memberSince:'Preview 2026',
      lastSeen:'Today',
      primaryDevice:'Quest / Desktop Ready'
    },
    wallet: [
      ['Play Chips','25,000','Demo balance'],
      ['Reward Points','1,250','Sponsor/store rewards'],
      ['Event Tickets','3','Preview events'],
      ['Membership','Preview VIP','Staged access']
    ],
    inventory: [
      ['SVR Watch Skin','Equipped','Wrist console'],
      ['Neon Table Theme','Available','Scorpion table'],
      ['Purple Gloves','Ready','Hand-tracking visual'],
      ['Espresso Ad Badge','Preview','Sponsor sample']
    ],
    history: [
      ['Lobby Preview','Visited','Live game view'],
      ['Scorpion Room','Ready','Private poker route'],
      ['VR Store','Ready','Store portal'],
      ['AI Chat Room','Ready','Support path']
    ],
    players: [['Guest Player','Preview VIP','25,000','Ready'],['Sponsor Seat','Partner','10,000','Reserved'],['Moderator','Staff','50,000','Online'],['Event Guest','Public','5,000','Ready']],
    rooms: [['Main Lobby','Open','Store, Sponsors, Preview'],['Scorpion Room','Member','Poker Table'],['PGA Range','Guest','Golf Training'],['VR Store','Open','Shopping Portal'],['Reiki Room','Approval Lock','SVR Placeholder'],['Smoker Lounge','Member','Private Social']],
    ads: [['Espresso With Cream','Building Wall','Phase 91 Active'],['SVR Store Drop','Store Hero','Preview'],['PGA Training','Golf Hub','Preview'],['Community Impact','Event Board','Preview']]
  };
  const $ = (s) => document.querySelector(s);
  function statusOnline(){
    document.querySelectorAll('.svr-status-stack,.system-status-badge').forEach(el=>{
      el.querySelectorAll('.admin-status,[data-admin-label]').forEach(x=>x.textContent='ADMIN ONLINE');
      el.classList.add('online'); el.classList.remove('offline');
    });
  }
  function table(sel, heads, data){
    const el=$(sel); if(!el) return;
    el.innerHTML='<div class="table-wrap"><table><thead><tr>'+heads.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+data.map(r=>'<tr>'+r.map((c,i)=>'<td>'+(i===1||i===3?'<span class="pill">'+c+'</span>':c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  }
  function profile(){
    const el=$('[data-profile-card]'); if(!el) return;
    const p=state.profile;
    el.innerHTML='<div class="profile-top"><div class="profile-avatar">'+p.avatar+'</div><div><strong>'+p.name+'</strong><span>'+p.handle+'</span><em>'+p.primaryDevice+'</em></div></div><div class="grid2 profile-mini"><div class="tile"><strong>Tier</strong>'+p.tier+'</div><div class="tile"><strong>Chips</strong>'+p.chips+'</div><div class="tile"><strong>Room</strong>'+p.room+'</div><div class="tile"><strong>Status</strong><span class="pill">'+p.status+'</span></div></div>';
  }
  function renderCards(sel, rows){
    const el=$(sel); if(!el) return;
    el.innerHTML = rows.map(r => '<article class="tile"><strong>'+r[0]+'</strong><span>'+r[1]+'</span><p>'+r[2]+'</p></article>').join('');
  }
  function chat(){
    const log=$('#ai-chat-log'), form=$('#ai-chat-form'), input=$('#ai-chat-input'); if(!log||!form||!input) return;
    const add=(type,msg)=>{const d=document.createElement('div');d.className='chat-msg '+type;d.textContent=msg;log.appendChild(d);log.scrollTop=log.scrollHeight;};
    add('ai','SVR AI room online. Ask about poker rooms, sponsors, store, profile, events, or support.');
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      const text=input.value.trim(); if(!text) return;
      input.value=''; add('user',text);
      const lower=text.toLowerCase();
      let reply='I can help with SVR Poker navigation, sponsor info, store access, profile setup, event pages, and game preview.';
      if(lower.includes('sponsor')||lower.includes('ad')) reply='Sponsor options include website banners, VR billboard surfaces, storefront cards, event pages, and Espresso-style wall ads.';
      if(lower.includes('game')||lower.includes('poker')) reply='Use Preview Game to enter the browser game route. The site pages are structured so VR can open login, profile, store, and ads as web panels.';
      if(lower.includes('store')) reply='The store route supports SVR items, partner categories, event drops, and future VR portal shopping.';
      if(lower.includes('profile')||lower.includes('login')) reply='The login/profile system is staged for member identity, tier, chips, room access, inventory, and event permissions.';
      add('ai',reply);
    });
  }
  function bridge(){
    window.SVR_SITE_BRIDGE = {
      version:PHASE,
      getProfile:()=>state.profile,
      getRooms:()=>state.rooms,
      getAds:()=>state.ads,
      getWallet:()=>state.wallet,
      getInventory:()=>state.inventory,
      openRoute:(route)=>{ location.href=route; }
    };
    window.addEventListener('message', e=>{
      if(!e.data || typeof e.data !== 'object') return;
      if(e.data.type==='SVR_GET_PROFILE') e.source && e.source.postMessage({type:'SVR_PROFILE', profile:state.profile}, '*');
      if(e.data.type==='SVR_GET_ROOMS') e.source && e.source.postMessage({type:'SVR_ROOMS', rooms:state.rooms}, '*');
      if(e.data.type==='SVR_GET_ADS') e.source && e.source.postMessage({type:'SVR_ADS', ads:state.ads}, '*');
      if(e.data.type==='SVR_GET_INVENTORY') e.source && e.source.postMessage({type:'SVR_INVENTORY', inventory:state.inventory}, '*');
    });
  }
  function boot(){
    statusOnline(); profile();
    table('[data-player-table]',['Player','Tier','Chips','Status'],state.players);
    table('[data-room-table]',['Room','Access','Purpose'],state.rooms);
    table('[data-ad-table]',['Sponsor','Placement','Status'],state.ads);
    table('[data-wallet-table]',['Item','Value','Use'],state.wallet);
    table('[data-inventory-table]',['Item','Status','Use'],state.inventory);
    table('[data-history-table]',['Area','Status','Notes'],state.history);
    renderCards('[data-wallet-cards]', state.wallet);
    renderCards('[data-inventory-cards]', state.inventory);
    chat(); bridge();
    window.SVR_PROFILE_DASHBOARD_PHASE = PHASE;
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();
