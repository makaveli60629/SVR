import * as THREE from 'three';
const BUILD='PHASE-85-POKER-JS-TRUTH-LOCK';
let scene,camera,root,ui,tableGroup,started=false,autoTimer=null;
const SUITS=['S','H','D','C'];
const RANKS=['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const RV=Object.fromEntries(RANKS.map((r,i)=>[r,i+2]));
const SEATS=[
  {id:0,name:'YOU',human:true,stack:1000,folded:false,bet:0,hand:[]},
  {id:1,name:'NOVA',stack:1000,folded:false,bet:0,hand:[]},
  {id:2,name:'ROOK',stack:1000,folded:false,bet:0,hand:[]},
  {id:3,name:'ACE',stack:1000,folded:false,bet:0,hand:[]},
  {id:4,name:'VEGA',stack:1000,folded:false,bet:0,hand:[]},
  {id:5,name:'IVY',stack:1000,folded:false,bet:0,hand:[]}
];
const state={build:BUILD,handNo:0,dealer:0,smallBlind:10,bigBlind:20,phase:'idle',deck:[],community:[],pot:0,currentBet:0,current:0,lastAction:'Ready',waitingHuman:false,winner:null,actionLog:[]};
function S(){return window.__SVR_SCENE__||null} function C(){return window.__SVR_CAMERA__||null}
function R(){return S()?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT')||S()}
function table(){const r=R();return r?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')||r?.getObjectByName?.('PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT')||null}
function tinfo(){const t=table();if(!t)return null;t.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(t),s=new THREE.Vector3(),c=new THREE.Vector3();b.getSize(s);b.getCenter(c);return{t,b,s,c,top:b.max.y,w:Math.max(1.4,Math.min(s.x*.52,3.4)),d:Math.max(.8,Math.min(s.z*.40,1.7))}}
function mkDeck(){const d=[];for(const s of SUITS)for(const r of RANKS)d.push({r,s,v:RV[r],id:r+s});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d}
function activeSeats(){return SEATS.filter(p=>!p.folded&&p.stack>=0)}
function liveSeats(){return SEATS.filter(p=>!p.folded)}
function nextSeat(i){let x=i;for(let k=0;k<8;k++){x=(x+1)%SEATS.length;if(!SEATS[x].folded&&SEATS[x].stack>0)return x;}return i}
function log(msg){state.lastAction=msg;state.actionLog.unshift(msg);state.actionLog=state.actionLog.slice(0,7)}
function resetBets(){for(const p of SEATS)p.bet=0;state.currentBet=0}
function pay(p,amt){const v=Math.min(p.stack,amt);p.stack-=v;p.bet+=v;state.pot+=v;if(p.bet>state.currentBet)state.currentBet=p.bet;return v}
function startHand(){clearTimeout(autoTimer);state.handNo++;state.dealer=(state.dealer+1)%SEATS.length;state.phase='preflop';state.deck=mkDeck();state.community=[];state.pot=0;state.currentBet=0;state.winner=null;state.actionLog=[];for(const p of SEATS){p.folded=false;p.bet=0;p.hand=[];if(p.stack<=0)p.stack=1000;}for(let round=0;round<2;round++){for(let i=1;i<=SEATS.length;i++){const p=SEATS[(state.dealer+i)%SEATS.length];p.hand.push(state.deck.pop());}}const sb=nextSeat(state.dealer),bb=nextSeat(sb);pay(SEATS[sb],state.smallBlind);pay(SEATS[bb],state.bigBlind);state.current=nextSeat(bb);log(`Hand ${state.handNo}: ${SEATS[sb].name} SB ${state.smallBlind}, ${SEATS[bb].name} BB ${state.bigBlind}`);draw();step();}
function nextPhase(){resetBets();if(state.phase==='preflop'){state.phase='flop';state.community.push(state.deck.pop(),state.deck.pop(),state.deck.pop());}
else if(state.phase==='flop'){state.phase='turn';state.community.push(state.deck.pop());}
else if(state.phase==='turn'){state.phase='river';state.community.push(state.deck.pop());}
else return showdown();state.current=nextSeat(state.dealer);log(`${state.phase.toUpperCase()} dealt`);draw();step();}
function everyoneSettled(){const live=liveSeats();if(live.length<=1)return true;return live.every(p=>p.bet===state.currentBet||p.stack===0)}
function advance(){if(liveSeats().length<=1)return showdown();if(everyoneSettled()&&state.current===nextSeat(state.dealer))return nextPhase();state.current=nextSeat(state.current);if(everyoneSettled()&&state.current===nextSeat(state.dealer))return nextPhase();draw();step();}
function playerAction(type){if(state.phase==='showdown'||state.phase==='idle')return;if(!SEATS[state.current].human)return;act(SEATS[state.current],type);}
function act(p,type){const need=Math.max(0,state.currentBet-p.bet);if(type==='fold'){p.folded=true;log(`${p.name} folds`);}else if(type==='check'){if(need>0){pay(p,need);log(`${p.name} calls ${need}`);}else log(`${p.name} checks`);}else if(type==='call'){pay(p,need);log(`${p.name} calls ${need}`);}else if(type==='raise'){const raise=50;pay(p,need+raise);log(`${p.name} raises to ${p.bet}`);}else if(type==='allin'){pay(p,p.stack);log(`${p.name} all in ${p.bet}`);}state.waitingHuman=false;draw();advance();}
function botChoice(p){const need=Math.max(0,state.currentBet-p.bet);const score=(p.hand[0].v+p.hand[1].v)+(p.hand[0].r===p.hand[1].r?10:0)+(p.hand[0].s===p.hand[1].s?2:0);if(need===0){return score>21&&Math.random()<.25?'raise':'check'}if(need>p.stack*.45&&score<20)return 'fold';if(score>24&&Math.random()<.35)return 'raise';return Math.random()<.12&&score<18?'fold':'call'}
function step(){clearTimeout(autoTimer);const p=SEATS[state.current];if(state.phase==='showdown'||state.phase==='idle')return;if(p.folded)return advance();if(p.human){state.waitingHuman=true;log('Your turn');draw();return;}autoTimer=setTimeout(()=>{act(p,botChoice(p));},900+Math.random()*700);}
function combos(arr,k){const out=[];function rec(start,cur){if(cur.length===k){out.push(cur.slice());return;}for(let i=start;i<arr.length;i++){cur.push(arr[i]);rec(i+1,cur);cur.pop();}}rec(0,[]);return out}
function score5(cards){const vals=cards.map(c=>c.v).sort((a,b)=>b-a);const counts={};for(const v of vals)counts[v]=(counts[v]||0)+1;let unique=[...new Set(vals)].sort((a,b)=>b-a);if(unique.includes(14))unique.push(1);let straight=0;for(let i=0;i<=unique.length-5;i++){const sl=unique.slice(i,i+5);if(sl[0]-sl[4]===4){straight=sl[0];break;}}
const flush=cards.every(c=>c.s===cards[0].s);const groups=Object.entries(counts).map(([v,c])=>({v:+v,c})).sort((a,b)=>b.c-a.c||b.v-a.v);let cat=0,rank=[];
if(straight&&flush){cat=8;rank=[straight];}
else if(groups[0].c===4){cat=7;rank=[groups[0].v,...groups.filter(g=>g.c<4).map(g=>g.v)];}
else if(groups[0].c===3&&groups[1]?.c===2){cat=6;rank=[groups[0].v,groups[1].v];}
else if(flush){cat=5;rank=vals;}
else if(straight){cat=4;rank=[straight];}
else if(groups[0].c===3){cat=3;rank=[groups[0].v,...groups.filter(g=>g.c===1).map(g=>g.v).sort((a,b)=>b-a)];}
else if(groups[0].c===2&&groups[1]?.c===2){cat=2;rank=[groups[0].v,groups[1].v,...groups.filter(g=>g.c===1).map(g=>g.v)];}
else if(groups[0].c===2){cat=1;rank=[groups[0].v,...groups.filter(g=>g.c===1).map(g=>g.v).sort((a,b)=>b-a)];}
else{cat=0;rank=vals;}return [cat,...rank];}
function best7(cards){let best=null;for(const c of combos(cards,5)){const s=score5(c);if(!best||cmp(s,best)>0)best=s;}return best}
function cmp(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const x=a[i]||0,y=b[i]||0;if(x!==y)return x-y;}return 0}
const names=['High Card','Pair','Two Pair','Trips','Straight','Flush','Full House','Quads','Straight Flush'];
function showdown(){state.phase='showdown';state.waitingHuman=false;const live=liveSeats();let win=live[0],best=live[0]?best7([...live[0].hand,...state.community]):null;for(const p of live.slice(1)){const b=best7([...p.hand,...state.community]);if(cmp(b,best)>0){best=b;win=p;}}if(win){win.stack+=state.pot;state.winner={name:win.name,score:best,label:names[best[0]],pot:state.pot};log(`${win.name} wins ${state.pot} with ${names[best[0]]}`);state.pot=0;}draw();}
function cardLabel(c){return c?c.id:'??'}
function ensureUI(){if(ui)return;ui=document.createElement('div');ui.id='svr-p85-poker-ui';ui.style.cssText='position:fixed;right:12px;bottom:12px;z-index:9999;width:320px;max-width:calc(100vw - 24px);padding:12px;border:1px solid #7ffcff;border-radius:14px;background:rgba(0,0,0,.82);color:white;font:13px system-ui;box-shadow:0 0 20px rgba(127,252,255,.25)';document.body.appendChild(ui);document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='f')playerAction('fold');if(k==='c')playerAction('call');if(k==='k')playerAction('check');if(k==='r')playerAction('raise');if(k==='a')playerAction('allin');if(k==='h')startHand();});}
function btn(label,fn){return `<button data-act="${fn}" style="margin:3px;padding:7px 9px;border:1px solid #7ffcff;border-radius:8px;background:#071018;color:white;font-weight:800">${label}</button>`}
function drawUI(){ensureUI();const you=SEATS[0];const turn=SEATS[state.current];ui.innerHTML=`<b>${BUILD}</b><br>Phase: ${state.phase.toUpperCase()} | Pot: ${state.pot} | Bet: ${state.currentBet}<br>Dealer: ${SEATS[state.dealer].name} | Turn: ${turn?.name||'-'}<br>Your stack: ${you.stack} | Cards: ${you.hand.map(cardLabel).join(' ')}<br>Board: ${state.community.map(cardLabel).join(' ')}<hr>${btn('Fold F','fold')}${btn('Check K','check')}${btn('Call C','call')}${btn('Raise R','raise')}${btn('All-In A','allin')}${btn('Next H','next')}<hr><div style="max-height:90px;overflow:auto">${state.actionLog.map(x=>`• ${x}`).join('<br>')}</div>`;ui.querySelectorAll('button').forEach(b=>b.onclick=()=>{const a=b.dataset.act;if(a==='next')startHand();else playerAction(a);});}
function makeTextTexture(txt,bg='rgba(0,0,0,.78)'){const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,512,128);g.strokeStyle='#ffd98a';g.lineWidth=5;g.strokeRect(6,6,500,116);g.fillStyle='#fff';g.font='900 26px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,256,64,480);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function drawTable(){scene=S();camera=C();root=R();if(!scene||!root)return;const inf=tinfo();if(!inf)return;const old=root.getObjectByName?.('PHASE85_POKER_TRUTH_TABLE_LAYER');if(old)old.parent?.remove(old);tableGroup=new THREE.Group();tableGroup.name='PHASE85_POKER_TRUTH_TABLE_LAYER';root.add(tableGroup);const c=inf.c,top=inf.top,w=inf.w,d=inf.d;const mat=(color)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity:.92,side:THREE.DoubleSide,depthWrite:false});const chipMat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.18});function plane(n,x,y,z,ww,hh,text){const m=new THREE.Mesh(new THREE.PlaneGeometry(ww,hh),new THREE.MeshBasicMaterial({map:makeTextTexture(text),transparent:true,depthWrite:false,side:THREE.DoubleSide}));m.name=n;m.position.set(x,y,z);m.rotation.x=-Math.PI/2;m.renderOrder=8500;tableGroup.add(m);return m}function chip(n,x,y,z,color,count){for(let i=0;i<count;i++){const o=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.014,24),chipMat(color));o.name=n+'_'+i;o.position.set(x,y+i*.015,z);o.renderOrder=8501;tableGroup.add(o);}}
state.community.forEach((card,i)=>plane('P85_COMM_'+i,c.x+(i-2)*.24,top+.44,c.z-d*.08,.22,.32,cardLabel(card)));
SEATS.forEach((p,i)=>{const ang=(-Math.PI/2)+(i*(Math.PI*2/6));const x=c.x+Math.cos(ang)*w*.55,z=c.z+Math.sin(ang)*d*.72;const tag=`${p.name} ${p.folded?'FOLD':p.stack}`;const m=new THREE.Mesh(new THREE.PlaneGeometry(.7,.18),new THREE.MeshBasicMaterial({map:makeTextTexture(tag),transparent:true,depthWrite:false,side:THREE.DoubleSide}));m.name='P85_TAG_'+i;m.position.set(x,top+1.2,z);m.lookAt(c.x,top+1.2,c.z);tableGroup.add(m);chip('P85_STACK_'+i,x,top+.01,z,p.human?0x7ffcff:0xffd98a,Math.max(1,Math.min(8,Math.ceil(p.stack/150))));if(p.human||state.phase==='showdown'){p.hand.forEach((ca,j)=>plane('P85_HAND_'+i+'_'+j,x+(j-.5)*.16,top-.035,z-.05,.16,.23,cardLabel(ca)));}});
const pot=new THREE.Mesh(new THREE.PlaneGeometry(.7,.2),new THREE.MeshBasicMaterial({map:makeTextTexture(`POT ${state.pot}`),transparent:true,depthWrite:false,side:THREE.DoubleSide}));pot.name='P85_POT_LABEL';pot.position.set(c.x,top+.08,c.z+d*.15);pot.rotation.x=-Math.PI/2;tableGroup.add(pot);if(state.winner){const win=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.22),new THREE.MeshBasicMaterial({map:makeTextTexture(`${state.winner.name} WINS ${state.winner.label}`,'rgba(60,20,0,.86)'),transparent:true,depthWrite:false,side:THREE.DoubleSide}));win.name='P85_WINNER_BANNER';win.position.set(c.x,top+1.45,c.z-d*.7);win.rotation.x=-.2;tableGroup.add(win);}}
function draw(){drawUI();drawTable();window.SVR_PHASE85_POKER_STATE=state;}
function install(){if(started)return;started=true;ensureUI();window.SVR_POKER_ACTION=playerAction;window.SVR_POKER_NEXT_HAND=startHand;window.SVR_RUN_PHASE85_POKER_AUDIT=()=>({build:BUILD,active:true,phase:state.phase,pot:state.pot,current:SEATS[state.current]?.name,community:state.community.map(cardLabel),players:SEATS.map(p=>({name:p.name,stack:p.stack,bet:p.bet,folded:p.folded,hand:p.human||state.phase==='showdown'?p.hand.map(cardLabel):['??','??']})),winner:state.winner,checkedAt:new Date().toISOString()});startHand();}
[500,1500,3000].forEach(t=>setTimeout(install,t));install();
