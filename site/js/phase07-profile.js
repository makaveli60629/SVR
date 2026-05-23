
(() => {
 const data={
  profile:{name:'SVR Guest Member',handle:'@svr-player',tier:'Preview Member',status:'Ready'},
  inventory:[['Neon Watch Skin','Wearable','Preview'],['Classic SVR Table Theme','Table','Preview'],['Gold Chip Stack','Chips','Preview'],['Espresso Sponsor Badge','Event','Sample']],
  events:[['Scorpion Room Poker Night','Member','Preview'],['PGA Range Challenge','Guest','Preview'],['Espresso With Cream Sponsor Spotlight','Public','Sample'],['Community Impact Tournament','Member','Planning']],
  ads:[['Lobby Wall Ad','Espresso With Cream','Sample'],['Store Banner','SVR Store','Preview'],['PGA Hub Banner','Golf Partner','Preview'],['Event Poster','Community Campaign','Preview']]
 };
 function table(sel,heads,rows){let e=document.querySelector(sel);if(!e)return;e.innerHTML='<div class="table-wrap"><table class="data-table"><thead><tr>'+heads.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((c,i)=>'<td>'+(i==2?'<span class="badge">'+c+'</span>':c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
 function boot(){
  let p=document.querySelector('[data-profile-summary]');
  if(p)p.innerHTML='<div class="profile-grid"><div class="profile-tile"><strong>Name</strong><span>'+data.profile.name+'</span></div><div class="profile-tile"><strong>Handle</strong><span>'+data.profile.handle+'</span></div><div class="profile-tile"><strong>Tier</strong><span>'+data.profile.tier+'</span></div><div class="profile-tile"><strong>Status</strong><span>'+data.profile.status+'</span></div></div>';
  table('[data-inventory-table]',['Item','Type','Status'],data.inventory);
  table('[data-events-table]',['Event','Access','Status'],data.events);
  table('[data-ads-table]',['Placement','Sponsor','Status'],data.ads);
  let f=document.querySelector('#login-form'),r=document.querySelector('#login-result');
  if(f&&r)f.addEventListener('submit',e=>{e.preventDefault();r.textContent='Preview login accepted. Profile panel is ready for game UI integration.'});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
