import * as THREE from "three";
import { makeCanvasLabel, roundRect } from "./utils.js";

const SUITS = ["S", "H", "D", "C"];
const SUIT_SYMBOL = { S:"♠", H:"♥", D:"♦", C:"♣" };
const SUIT_COLOR = { S:"#101218", C:"#101218", H:"#c71f44", D:"#c71f44" };
const RANK_LABEL = { 14:"A", 13:"K", 12:"Q", 11:"J", 10:"10", 9:"9", 8:"8", 7:"7", 6:"6", 5:"5", 4:"4", 3:"3", 2:"2" };
const BOT_NAMES = ["BOT NOVA", "BOT VEGA", "BOT ORBIT", "YOU", "BOT ACE", "BOT LUX"];
const CHIP_PALETTES = [[0x7d4dff,0x2bd4ff,0xf2d269],[0xff6fb1,0x2bd4ff,0xf2d269],[0x7d4dff,0x55ffb3,0xf2d269],[0xf2d269,0x2bd4ff,0xff6fb1],[0xff9457,0x2bd4ff,0x7d4dff],[0x55ffb3,0xff6fb1,0xf2d269]];

export function createPokerDemo({ scene, seats = [], chairRings = [], tableTopY = 0.90, statusCb = () => {}, log = console.log }){
  const group = new THREE.Group();
  group.name = "PHASE169_LEFT_TO_RIGHT_POKER_DEMO_LOCK";
  scene.add(group);

  const dealerOrigin = new THREE.Vector3(0.0, tableTopY + 0.42, -1.02);
  const textureCache = new Map();
  const cardObjects = [];
  const animations = [];
  const potStack = new THREE.Group();
  group.add(potStack);

  const statusPanel = makeDynamicPanel(1400, 260, 3.2, 0.58);
  statusPanel.mesh.position.set(0, tableTopY + 1.22, -0.06);
  group.add(statusPanel.mesh);

  const seatRecords = seats.map((seat, i)=>({ seat, originalIndex:i, ring:chairRings[i] || null }));
  const dealRecords = [...seatRecords].sort((a,b)=>{
    const ax = a.seat?.x ?? 0, bx = b.seat?.x ?? 0;
    if (Math.abs(ax - bx) > 0.05) return ax - bx;
    return (a.seat?.z ?? 0) - (b.seat?.z ?? 0);
  });

  const players = dealRecords.map((rec, dealIndex)=>{
    const seat = rec.seat;
    const inward = new THREE.Vector3(-seat.x, 0, -seat.z).normalize();
    const tangent = new THREE.Vector3(-inward.z, 0, inward.x).normalize();
    const center = new THREE.Vector3(seat.x, tableTopY + 0.70, seat.z).addScaledVector(inward, 0.92);
    return {
      dealIndex,
      originalIndex:rec.originalIndex,
      ring:rec.ring,
      seat,
      name:BOT_NAMES[rec.originalIndex] || `P${rec.originalIndex + 1}`,
      cards:[
        { position:center.clone().addScaledVector(tangent, -0.16), rotationY:0 },
        { position:center.clone().addScaledVector(tangent,  0.16), rotationY:0 }
      ],
      chips:[],
      hand:[]
    };
  });

  const boardAnchors = [-0.64,-0.32,0,0.32,0.64].map((x)=>({ position:new THREE.Vector3(x, tableTopY + 0.96, -0.02), rotationY:0 }));
  const burnAnchors = [-0.46,-0.34,-0.22].map((x)=>({ position:new THREE.Vector3(x, tableTopY + 0.72, -0.46), rotationY:0 }));

  let nowS = 0;
  let handNumber = 0;
  let queue = [];
  let stepIndex = 0;
  let current = null;

  buildSeatChips();
  paintStatus("Left-to-right deal locked", "Cards start at left seat, then next player, next player, around the table");
  window.SVR_PHASE169_DEAL_ORDER = players.map(p=>({ dealIndex:p.dealIndex, originalIndex:p.originalIndex, name:p.name, x:p.seat.x, z:p.seat.z }));

  function makeDynamicPanel(width, height, worldW, worldH){
    const { canvas, ctx, texture } = makeCanvasLabel({ width, height, draw(drawCtx,w,h){ drawCtx.clearRect(0,0,w,h); } });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(worldW, worldH), new THREE.MeshBasicMaterial({ map:texture, transparent:true, depthWrite:false, side:THREE.DoubleSide }));
    return { mesh, canvas, ctx, texture };
  }
  function paintStatus(title, subtitle, accent = "rgba(126,240,208,0.95)"){
    const { ctx, canvas, texture } = statusPanel;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.52)"; roundRect(ctx,18,18,canvas.width-36,canvas.height-36,42); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 8; roundRect(ctx,18,18,canvas.width-36,canvas.height-36,42); ctx.stroke();
    ctx.fillStyle = "#f5f0ff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "bold 76px system-ui"; ctx.fillText(title, canvas.width/2, 92);
    ctx.fillStyle = "rgba(236,232,255,0.92)"; ctx.font = "38px system-ui"; ctx.fillText(subtitle, canvas.width/2, 176);
    texture.needsUpdate = true;
  }
  function getCardTexture(card){
    const key = card ? `${card.rank}${card.suit}` : "back";
    if (textureCache.has(key)) return textureCache.get(key);
    const { texture } = makeCanvasLabel({ width:512, height:768, draw(ctx,w,h){
      ctx.clearRect(0,0,w,h); ctx.fillStyle = "#ffffff"; roundRect(ctx,12,12,w-24,h-24,38); ctx.fill(); ctx.strokeStyle = "#d6d9e7"; ctx.lineWidth = 8; roundRect(ctx,12,12,w-24,h-24,38); ctx.stroke();
      if (!card){ ctx.fillStyle = "#160d28"; roundRect(ctx,38,38,w-76,h-76,30); ctx.fill(); ctx.strokeStyle = "rgba(180,140,255,0.85)"; ctx.lineWidth = 10; roundRect(ctx,54,54,w-108,h-108,22); ctx.stroke(); ctx.fillStyle = "#efe9ff"; ctx.font = "bold 86px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("SVR",w/2,h/2-30); ctx.font = "bold 44px system-ui"; ctx.fillText("ALL IN",w/2,h/2+44); return; }
      const color = SUIT_COLOR[card.suit], rank = RANK_LABEL[card.rank], suit = SUIT_SYMBOL[card.suit];
      ctx.fillStyle = color; ctx.font = "bold 108px Georgia,serif"; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(rank,44,28); ctx.font = "bold 86px Georgia,serif"; ctx.fillText(suit,48,138);
      ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText(rank,w-44,h-136); ctx.font = "bold 86px Georgia,serif"; ctx.fillText(suit,w-48,h-28);
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "bold 220px Georgia,serif"; ctx.globalAlpha = .92; ctx.fillText(suit,w/2,h/2+18); ctx.globalAlpha = 1;
    }});
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(key, texture);
    return texture;
  }
  function createCardMesh(card, scale = 1){
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24*scale,0.34*scale), new THREE.MeshStandardMaterial({ map:getCardTexture(card), roughness:.80, metalness:.02, emissive:0x130814, emissiveIntensity:.06, side:THREE.DoubleSide, depthWrite:true }));
    mesh.userData.card = card;
    mesh.position.copy(dealerOrigin);
    return mesh;
  }
  function addCard(card, target, delay = .42, scale = 1){
    const mesh = createCardMesh(card, scale);
    group.add(mesh); cardObjects.push(mesh);
    animations.push({ mesh, fromPos:dealerOrigin.clone(), toPos:target.position.clone(), start:nowS, end:nowS+delay });
    return mesh;
  }
  function clearCards(){ while(cardObjects.length){ cardObjects.pop().parent?.remove(cardObjects.at(-1)); } group.children.filter(o=>o.userData?.phase169Card).forEach(o=>o.parent?.remove(o)); animations.length = 0; }
  function clearAllCards(){ while(cardObjects.length){ const mesh = cardObjects.pop(); mesh.parent?.remove(mesh); } animations.length = 0; }
  function createDeck(){ const deck = []; for(const suit of SUITS) for(let rank=2; rank<=14; rank++) deck.push({ rank, suit }); return deck; }
  function shuffle(deck){ for(let i=deck.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; } return deck; }
  function formatCards(cards){ return cards.map(c=>`${RANK_LABEL[c.rank]}${SUIT_SYMBOL[c.suit]}`).join(" "); }

  function buildSeatChips(){
    players.forEach((player, idx)=>{
      const inward = new THREE.Vector3(-player.seat.x,0,-player.seat.z).normalize();
      const tangent = new THREE.Vector3(-inward.z,0,inward.x).normalize();
      const base = new THREE.Vector3(player.seat.x, tableTopY+.02, player.seat.z).addScaledVector(inward,.72).addScaledVector(tangent,-.22);
      const palette = CHIP_PALETTES[idx % CHIP_PALETTES.length];
      for(let stack=0; stack<3; stack++){
        const root = new THREE.Group();
        for(let i=0; i<6+stack*2; i++){
          const color = palette[stack % palette.length];
          const chip = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.016,20), new THREE.MeshStandardMaterial({ color, roughness:.34, metalness:.16, emissive:color, emissiveIntensity:.18 }));
          chip.rotation.x = Math.PI*.5; chip.position.y = i*.017; root.add(chip);
        }
        root.position.copy(base).addScaledVector(tangent, stack*.18).addScaledVector(inward, (stack%2)*.06); root.userData.baseY = root.position.y; group.add(root); player.chips.push(root);
      }
    });
  }
  function clearPotStack(){ while(potStack.children.length) potStack.remove(potStack.children[0]); }
  function refreshPotStack(count = 28){
    clearPotStack();
    const palette = [0xf2d269,0x7d4dff,0x2bd4ff,0xff6fb1];
    for(let i=0;i<count;i++){
      const chip = new THREE.Mesh(new THREE.CylinderGeometry(.066,.066,.016,20), new THREE.MeshStandardMaterial({ color:palette[i%palette.length], roughness:.34, metalness:.14, emissive:palette[i%palette.length], emissiveIntensity:.25 }));
      const layer = Math.floor(i/7), offset = i%7; chip.rotation.x = Math.PI/2; chip.position.set((offset-3)*.028, tableTopY+.026+layer*.018, .16+Math.sin(i*1.7)*.012); chip.userData.baseY = chip.position.y; potStack.add(chip);
    }
  }
  function resetRingHighlights(){ chairRings.forEach((ring)=>{ if (!ring?.material) return; ring.material.opacity = .52; ring.scale.setScalar(1); }); }
  function applyActionHighlight(player){
    chairRings.forEach((ring)=>{ if (ring?.material){ ring.material.opacity = .42; ring.scale.setScalar(1); } });
    if (player.ring?.material){ player.ring.material.color.set(0x8ce5ff); player.ring.material.opacity = .94; player.ring.scale.setScalar(1.04); }
  }
  function applyWinnerHighlight(player){ if (player.ring?.material){ player.ring.material.color.set(0xf2d269); player.ring.material.opacity = .98; player.ring.scale.setScalar(1.08); } }
  function schedule(at, fn){ queue.push({ at, fn }); }

  function planHand(){
    handNumber++;
    clearAllCards(); clearPotStack(); resetRingHighlights(); queue = []; stepIndex = 0;
    const deck = shuffle(createDeck());
    players.forEach(p=>{ p.hand = [deck.shift(), deck.shift()]; });
    const board = [deck.shift(),deck.shift(),deck.shift(),deck.shift(),deck.shift()];
    const winner = players[(handNumber + 2) % players.length] || players[0];
    current = { handNumber, board, winner, pot:30 };
    refreshPotStack(16);
    let t = nowS + .75;
    schedule(t,()=>{ paintStatus(`Hand ${handNumber} • left-to-right`, `Start: ${players[0]?.name || "left seat"} → next player → next player`); statusCb(`HAND ${handNumber} • left-to-right dealing locked`); });
    for(let round=0; round<2; round++){
      for(let i=0; i<players.length; i++){
        const player = players[i];
        t += .42;
        schedule(t,()=>{ addCard(player.hand[round], player.cards[round], .46, 1.0); applyActionHighlight(player); paintStatus(`Dealing ${player.name}`, `Round ${round+1} • seat ${i+1}/${players.length} • ${formatCards(player.hand.slice(0, round+1))}`); });
      }
    }
    t += .70; schedule(t,()=>{ addCard(null, burnAnchors[0], .34, .74); paintStatus("Burn", `Before flop • pot $${current.pot}`); });
    t += .55; schedule(t,()=>{ for(let i=0;i<3;i++) addCard(board[i], boardAnchors[i], .52, 1.18); current.pot += 90; refreshPotStack(30); paintStatus(`Flop • ${formatCards(board.slice(0,3))}`, `pot $${current.pot}`); });
    t += 1.15; schedule(t,()=>{ addCard(null, burnAnchors[1], .34, .74); paintStatus("Burn", `Before turn • pot $${current.pot}`); });
    t += .55; schedule(t,()=>{ addCard(board[3], boardAnchors[3], .52, 1.18); current.pot += 60; refreshPotStack(34); paintStatus(`Turn • ${formatCards(board.slice(0,4))}`, `pot $${current.pot}`); });
    t += 1.15; schedule(t,()=>{ addCard(null, burnAnchors[2], .34, .74); paintStatus("Burn", `Before river • pot $${current.pot}`); });
    t += .55; schedule(t,()=>{ addCard(board[4], boardAnchors[4], .52, 1.18); current.pot += 60; refreshPotStack(38); paintStatus(`River • ${formatCards(board)}`, `pot $${current.pot}`); });
    t += 1.25; schedule(t,()=>{ applyWinnerHighlight(winner); paintStatus(`${winner.name} wins`, `Pot $${current.pot} • left-to-right deal order verified`, "rgba(244,210,105,0.98)"); statusCb(`HAND ${handNumber} • ${winner.name} wins • deal order left-to-right`); log("Phase169 poker hand", { order:players.map(p=>p.name), winner:winner.name }); });
    t += 4.0; schedule(t,()=>planHand());
    paintStatus("Shuffling live deck", `Hand ${handNumber} • left-to-right deal order locked`);
  }
  function orientCardToCamera(mesh){ const cam = scene.userData?._camera; if (!cam) return; const ry = Math.atan2(cam.position.x - mesh.position.x, cam.position.z - mesh.position.z); mesh.rotation.set(0, ry, 0); }
  function updateAnimations(){ for(let i=animations.length-1;i>=0;i--){ const anim=animations[i]; const span=Math.max(.0001, anim.end-anim.start); const t=THREE.MathUtils.clamp((nowS-anim.start)/span,0,1); const eased=1-Math.pow(1-t,3); anim.mesh.position.lerpVectors(anim.fromPos,anim.toPos,eased); anim.mesh.position.y += Math.sin(eased*Math.PI)*.22; orientCardToCamera(anim.mesh); if(t>=1) animations.splice(i,1); } }
  function updateCardsHover(){ cardObjects.forEach((mesh,i)=>{ if(animations.find(a=>a.mesh===mesh)) return; if(mesh.userData.baseY===undefined) mesh.userData.baseY=mesh.position.y; mesh.position.y=mesh.userData.baseY+Math.sin(nowS*2.1+i*.4)*.018; orientCardToCamera(mesh); }); }
  function updatePotStack(){ potStack.children.forEach((chip,i)=>{ chip.position.y=chip.userData.baseY+Math.sin(nowS*2.8+i*.4)*.002; chip.rotation.z=Math.sin(nowS*1.1+i*.18)*.04; }); }
  function updateSeatChips(){ players.forEach((p,idx)=>p.chips.forEach((s,j)=>{ s.position.y=s.userData.baseY+Math.sin(nowS*1.6+idx*.5+j*.7)*.005; })); }
  function updateStatusFacing(){ const cam=scene.userData?._camera; if(!cam) return; const ry=Math.atan2(cam.position.x-statusPanel.mesh.position.x, cam.position.z-statusPanel.mesh.position.z); statusPanel.mesh.rotation.set(0,ry,0); }
  function update(now){ nowS=now; if(!current) planHand(); while(queue[stepIndex] && nowS>=queue[stepIndex].at){ const ref=queue; queue[stepIndex].fn(); if(queue!==ref) break; stepIndex++; } updateAnimations(); updateCardsHover(); updatePotStack(); updateSeatChips(); updateStatusFacing(); }
  return { update, forceNextHand(){ planHand(); } };
}
