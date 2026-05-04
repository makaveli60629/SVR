(function () {
  const THREE = AFRAME.THREE;
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  // ─── Card deck ───────────────────────────────────────────────────────────────
  const SUITS = ['♠','♥','♦','♣'];
  const RANKS = ['A','K','Q','J','10','9','8','7','6','5','4','3','2'];
  function buildDeck() {
    const d = [];
    SUITS.forEach(s => RANKS.forEach(r => d.push(r + s)));
    return d;
  }
  function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function makeCardTexture(label) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 356;
    const ctx = canvas.getContext('2d');
    // background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // border
    ctx.strokeStyle = '#11161f';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
    // suit colour
    const isRed = /♥|♦/.test(label);
    ctx.fillStyle = isRed ? '#d82f2f' : '#101318';
    // top-left rank
    ctx.font = 'bold 72px Arial';
    ctx.fillText(label, 22, 88);
    // ghost centre
    ctx.globalAlpha = 0.13;
    ctx.font = 'bold 190px Arial';
    ctx.fillText(label, 20, 300);
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeCardBack() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 356;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    // diamond pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < canvas.height; y += 18) {
      for (let x = 0; x < canvas.width; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x + 9, y);
        ctx.lineTo(x + 18, y + 9);
        ctx.lineTo(x + 9, y + 18);
        ctx.lineTo(x, y + 9);
        ctx.closePath();
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Pre-build card texture cache
  const TEX_CACHE = {};
  function getCardTex(label) {
    if (!TEX_CACHE[label]) TEX_CACHE[label] = makeCardTexture(label);
    return TEX_CACHE[label];
  }
  const CARD_BACK_TEX = makeCardBack();

  // ─── Chip texture ─────────────────────────────────────────────────────────
  function makeChipTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.stroke();
    // inner ring
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(64, 64, 44, 0, Math.PI * 2);
    ctx.stroke();
    // dashes
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.save();
      ctx.translate(64, 64);
      ctx.rotate(a);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(46, -3, 12, 6);
      ctx.restore();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const CHIP_COLORS = { 25: '#ffffff', 100: '#e53935', 500: '#1565c0', 1000: '#2e7d32', 5000: '#6a1b9a' };

  // ─── Human figure builder ─────────────────────────────────────────────────
  function buildHumanFigure(skinColor, shirtColor, hairColor, isDealer) {
    const group = new THREE.Group();

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.38, 0.48, 0.22);
    const torsoMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.85, metalness: 0.0 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.24;
    group.add(torso);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.1, 12);
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 0.53;
    group.add(neck);

    // Head
    const headGeo = new THREE.SphereGeometry(0.145, 20, 16);
    const head = new THREE.Mesh(headGeo, skinMat.clone());
    head.scale.set(1, 1.15, 0.95);
    head.position.y = 0.7;
    group.add(head);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.152, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.95, metalness: 0.0 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.72;
    group.add(hair);

    // Eyes (two small spheres)
    const eyeGeo = new THREE.SphereGeometry(0.022, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: '#111111' });
    [-0.05, 0.05].forEach(xOff => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(xOff, 0.72, 0.128);
      group.add(eye);
    });

    // Left arm
    const armGeo = new THREE.CylinderGeometry(0.055, 0.048, 0.38, 10);
    const armMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.85 });

    const leftArm = new THREE.Group();
    const leftArmMesh = new THREE.Mesh(armGeo, armMat);
    leftArmMesh.position.y = -0.19;
    leftArm.add(leftArmMesh);
    leftArm.position.set(-0.225, 0.46, 0);
    leftArm.rotation.z = 0.32;
    group.add(leftArm);

    // Right arm
    const rightArm = new THREE.Group();
    const rightArmMesh = new THREE.Mesh(armGeo, armMat.clone());
    rightArmMesh.position.y = -0.19;
    rightArm.add(rightArmMesh);
    rightArm.position.set(0.225, 0.46, 0);
    rightArm.rotation.z = -0.32;
    group.add(rightArm);

    // Hands
    const handGeo = new THREE.SphereGeometry(0.052, 10, 8);
    const handMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });

    const leftHand = new THREE.Mesh(handGeo, handMat);
    leftHand.position.set(-0.305, 0.19, 0.04);
    group.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, handMat.clone());
    rightHand.position.set(0.305, 0.19, 0.04);
    group.add(rightHand);

    // Seated legs (bent at hips)
    const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.36, 10);
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#1a1a2e', roughness: 0.9 });

    // Thighs (horizontal, going forward)
    [-0.1, 0.1].forEach(xOff => {
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.38), pantsMat);
      thigh.position.set(xOff, 0.0, 0.18);
      group.add(thigh);
    });

    // Dealer badge
    if (isDealer) {
      const badgeGeo = new THREE.CircleGeometry(0.055, 16);
      const badgeMat = new THREE.MeshStandardMaterial({
        color: '#ffd700',
        emissive: '#ffaa00',
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.8
      });
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      badge.position.set(0.16, 0.42, 0.115);
      group.add(badge);

      // D text on badge
      const dbCanvas = document.createElement('canvas');
      dbCanvas.width = 64; dbCanvas.height = 64;
      const dbCtx = dbCanvas.getContext('2d');
      dbCtx.fillStyle = '#ffd700';
      dbCtx.beginPath();
      dbCtx.arc(32, 32, 30, 0, Math.PI * 2);
      dbCtx.fill();
      dbCtx.fillStyle = '#000000';
      dbCtx.font = 'bold 38px Arial';
      dbCtx.textAlign = 'center';
      dbCtx.fillText('D', 32, 44);
      const dbTex = new THREE.CanvasTexture(dbCanvas);
      const dbPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 0.1),
        new THREE.MeshBasicMaterial({ map: dbTex, transparent: true })
      );
      dbPlane.position.set(0.16, 0.42, 0.118);
      group.add(dbPlane);
    }

    return group;
  }

  // ─── Chip stack builder ───────────────────────────────────────────────────
  function buildChipStack(denomination, count, color) {
    const group = new THREE.Group();
    const chipTex = makeChipTexture(color);
    for (let i = 0; i < count; i++) {
      const chip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.048, 0.014, 20),
        new THREE.MeshStandardMaterial({ map: chipTex, roughness: 0.5, metalness: 0.2 })
      );
      chip.position.y = i * 0.015;
      group.add(chip);
    }
    return group;
  }

  // ─── Seat positions (8 seats around oval table) ──────────────────────────
  // Dealer at far end (z negative), player at near end, NPCs around sides
  const SEAT_CONFIGS = [
    { id: 'dealer', pos: [0,   0, -0.95], rotY: 0,           isDealer: true,  skin: '#f5c5a0', shirt: '#1a1a2e', hair: '#1a0a00', name: 'DEALER'  },
    { id: 'npc1',   pos: [-0.85, 0, -0.55], rotY:  0.62,     isDealer: false, skin: '#8d5524', shirt: '#1b5e20', hair: '#0d0500', name: 'MARCUS'  },
    { id: 'npc2',   pos: [-0.95, 0,  0.05], rotY:  1.05,     isDealer: false, skin: '#fddbb4', shirt: '#880e4f', hair: '#3e1f00', name: 'DIANA'   },
    { id: 'npc3',   pos: [-0.72, 0,  0.72], rotY:  1.48,     isDealer: false, skin: '#c68642', shirt: '#0d47a1', hair: '#1a0a00', name: 'RICO'    },
    { id: 'npc4',   pos: [ 0.72, 0,  0.72], rotY: -1.48,     isDealer: false, skin: '#f5cba7', shirt: '#4a148c', hair: '#ffffff', name: 'SOFIA'   },
    { id: 'npc5',   pos: [ 0.95, 0,  0.05], rotY: -1.05,     isDealer: false, skin: '#d4956a', shirt: '#006064', hair: '#0d0500', name: 'JAMES'   },
    { id: 'npc6',   pos: [ 0.85, 0, -0.55], rotY: -0.62,     isDealer: false, skin: '#fde8d8', shirt: '#bf360c', hair: '#1a0a00', name: 'LUNA'    },
  ];

  // ─── Name plate texture ───────────────────────────────────────────────────
  function makeNamePlate(name, stack) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(8,8,18,0.88)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 256, 80, 14);
    ctx.fill();
    ctx.strokeStyle = '#8a44ff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#f4e0ff';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, 128, 32);
    ctx.fillStyle = '#00e5a0';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('$' + stack, 128, 62);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ─── Pot display ─────────────────────────────────────────────────────────
  function makePotTexture(amount) {
    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 100;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 320, 0);
    g.addColorStop(0, '#0a0f1a');
    g.addColorStop(1, '#13192a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(0, 0, 320, 100, 18);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('POT', 160, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('$' + amount.toLocaleString(), 160, 75);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ─── Poker game state machine ─────────────────────────────────────────────
  function PokerGame(numPlayers) {
    this.numPlayers = numPlayers; // includes dealer position (dealer deals but doesn't play)
    this.reset();
  }
  PokerGame.prototype.reset = function () {
    this.deck = shuffle(buildDeck());
    this.pot = 0;
    this.phase = 'deal'; // deal -> flop -> turn -> river -> showdown -> deal
    this.phaseTimer = 0;
    this.communityCards = [];
    this.playerHands = [];
    this.playerStacks = [12400, 8700, 31200, 5500, 19800, 7100]; // 6 NPC stacks
    this.playerBets = new Array(this.numPlayers).fill(0);
    this.foldedPlayers = new Set();
    this.activePlayer = 1; // NPC index 0-5
    this.actionLog = [];
    this.dealCards();
  };
  PokerGame.prototype.dealCards = function () {
    this.deck = shuffle(buildDeck());
    this.communityCards = [];
    this.playerHands = [];
    for (let i = 0; i < this.numPlayers; i++) {
      this.playerHands.push([this.deck.pop(), this.deck.pop()]);
    }
    this.blinds();
  };
  PokerGame.prototype.blinds = function () {
    const sb = 200, bb = 400;
    this.playerStacks[0] = Math.max(0, this.playerStacks[0] - sb);
    this.playerStacks[1] = Math.max(0, this.playerStacks[1] - bb);
    this.playerBets[0] = sb;
    this.playerBets[1] = bb;
    this.pot = sb + bb;
    this.activePlayer = 2;
  };
  PokerGame.prototype.npcAction = function (playerIdx) {
    const stack = this.playerStacks[playerIdx];
    const r = Math.random();
    if (stack <= 0 || r < 0.18) {
      this.foldedPlayers.add(playerIdx);
      return { action: 'FOLD', amount: 0 };
    } else if (r < 0.55) {
      const callAmt = Math.min(400, stack);
      this.playerStacks[playerIdx] -= callAmt;
      this.pot += callAmt;
      return { action: 'CALL', amount: callAmt };
    } else if (r < 0.78) {
      return { action: 'CHECK', amount: 0 };
    } else {
      const raiseAmt = Math.min(800 + Math.floor(Math.random() * 1200), stack);
      this.playerStacks[playerIdx] -= raiseAmt;
      this.pot += raiseAmt;
      return { action: 'RAISE', amount: raiseAmt };
    }
  };
  PokerGame.prototype.advancePhase = function () {
    const phases = ['deal', 'flop', 'turn', 'river', 'showdown'];
    const idx = phases.indexOf(this.phase);
    this.phase = phases[(idx + 1) % phases.length];
    if (this.phase === 'flop') {
      this.communityCards = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
    } else if (this.phase === 'turn') {
      this.communityCards.push(this.deck.pop());
    } else if (this.phase === 'river') {
      this.communityCards.push(this.deck.pop());
    } else if (this.phase === 'showdown') {
      // pick winner
      const winner = Math.floor(Math.random() * this.numPlayers);
      this.playerStacks[winner] = (this.playerStacks[winner] || 0) + this.pot;
      this.winner = winner;
    } else if (this.phase === 'deal') {
      this.reset();
    }
    this.foldedPlayers.clear();
    this.activePlayer = 0;
  };

  // ─── Action bubble texture ────────────────────────────────────────────────
  const ACTION_COLORS = { FOLD:'#c62828', CALL:'#1565c0', CHECK:'#2e7d32', RAISE:'#e65100', 'ALL IN':'#6a1b9a' };
  function makeActionBubble(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = ACTION_COLORS[text] || '#333344';
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 72, 20);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 50);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ─── Main component ───────────────────────────────────────────────────────
  AFRAME.registerComponent('real-table-stage', {
    init: function () {
      this.cardsReady = false;
      this.game = new PokerGame(6);
      this.onLoad = this.onLoad.bind(this);
      this.el.addEventListener('model-loaded', this.onLoad);
      this.seatFigures = [];
      this.namePlates = [];
      this.actionBubbles = [];
      this.actionBubbleTimers = [];
      this.communityMeshes = [];
      this.playerCardMeshes = [];
      this.chipStacks = [];
      this.potMesh = null;
      this.lastPhaseTime = 0;
      this.lastActionTime = 0;
      this.lastAction = 0; // which NPC last acted
      this.phaseInterval = 7000;  // ms between phase changes
      this.actionInterval = 1400; // ms between NPC actions
    },
    remove: function () {
      this.el.removeEventListener('model-loaded', this.onLoad);
    },

    onLoad: function () {
      const model = this.el.getObject3D('mesh');
      if (!model) return;
      model.scale.set(0.001, 0.001, 0.001);
      box.setFromObject(model);
      box.getSize(size);
      box.getCenter(center);
      model.position.x -= center.x;
      model.position.y -= box.min.y;
      model.position.z -= center.z;

      const top = size.y * 0.001;
      const feltW = size.x * 0.001 * 0.69;
      const feltD = size.z * 0.001 * 0.70;
      this.surface = { top, feltW, feltD };

      // ── Felt & logo ───────────────────────────────────────────────────────
      const felt = document.createElement('a-circle');
      felt.setAttribute('radius', '1');
      felt.setAttribute('rotation', '-90 0 0');
      felt.setAttribute('position', `0 ${top + 0.004} 0`);
      felt.setAttribute('scale', `${feltW * 0.52} ${feltD * 0.52} 1`);
      felt.setAttribute('src', '#tableFelt');
      felt.setAttribute('material', 'roughness:0.92; metalness:0.0');
      this.el.appendChild(felt);

      const logo = document.createElement('a-circle');
      logo.setAttribute('radius', '0.38');
      logo.setAttribute('rotation', '-90 0 0');
      logo.setAttribute('position', `0 ${top + 0.005} 0`);
      logo.setAttribute('src', '#logoTable');
      logo.setAttribute('material', 'shader:flat; transparent:true; alphaTest:0.06; side:double; depthWrite:false');
      this.el.appendChild(logo);

      // ── Build seat figures ────────────────────────────────────────────────
      SEAT_CONFIGS.forEach((seat, idx) => {
        const figure = buildHumanFigure(seat.skin, seat.shirt, seat.hair, seat.isDealer);
        figure.position.set(seat.pos[0], top + seat.pos[1], seat.pos[2]);
        figure.rotation.y = seat.rotY;
        this.el.object3D.add(figure);
        this.seatFigures.push(figure);

        // Name plate
        if (!seat.isDealer) {
          const nameTex = makeNamePlate(seat.name, this.game.playerStacks[idx - 1] || 10000);
          const plateMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 0.156),
            new THREE.MeshBasicMaterial({ map: nameTex, transparent: true, depthWrite: false })
          );
          const px = seat.pos[0] * 1.28;
          const pz = seat.pos[2] * 1.28;
          plateMesh.position.set(px, top + 1.1, pz);
          plateMesh.lookAt(new THREE.Vector3(0, top + 1.1, 6));
          this.el.object3D.add(plateMesh);
          this.namePlates.push({ mesh: plateMesh, seatIdx: idx - 1 });

          // Action bubble (hidden until action)
          const bubbleMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.42, 0.13),
            new THREE.MeshBasicMaterial({ map: makeActionBubble('CALL'), transparent: true, depthWrite: false, visible: false })
          );
          bubbleMesh.position.set(px, top + 1.35, pz);
          bubbleMesh.lookAt(new THREE.Vector3(0, top + 1.35, 6));
          this.el.object3D.add(bubbleMesh);
          this.actionBubbles.push(bubbleMesh);
          this.actionBubbleTimers.push(0);
        }
      });

      // ── Community cards ───────────────────────────────────────────────────
      this.cardGroup = new THREE.Group();
      this.el.object3D.add(this.cardGroup);
      const communityX = [-0.52, -0.26, 0, 0.26, 0.52];
      this.communityMeshes = communityX.map((x, i) => {
        const card = new THREE.Mesh(
          new THREE.PlaneGeometry(0.22, 0.30),
          new THREE.MeshBasicMaterial({ map: CARD_BACK_TEX, transparent: false, visible: false })
        );
        card.position.set(x, top + 0.012, 0);
        card.rotation.x = -Math.PI / 2;
        this.cardGroup.add(card);
        return card;
      });

      // ── Player hole cards (face down, by each NPC) ────────────────────────
      SEAT_CONFIGS.forEach((seat, idx) => {
        if (seat.isDealer) return;
        const npcCards = [];
        [-0.07, 0.07].forEach((dx, ci) => {
          const card = new THREE.Mesh(
            new THREE.PlaneGeometry(0.18, 0.24),
            new THREE.MeshBasicMaterial({ map: CARD_BACK_TEX, transparent: false })
          );
          const cx = seat.pos[0] * 0.72 + dx * Math.cos(seat.rotY);
          const cz = seat.pos[2] * 0.72 + dx * Math.sin(seat.rotY);
          card.position.set(cx, top + 0.01, cz);
          card.rotation.x = -Math.PI / 2;
          card.rotation.z = seat.rotY + (ci === 0 ? -0.08 : 0.08);
          this.cardGroup.add(card);
          npcCards.push(card);
        });
        this.playerCardMeshes.push(npcCards);
      });

      // ── Chip stacks near each NPC ─────────────────────────────────────────
      SEAT_CONFIGS.forEach((seat, idx) => {
        if (seat.isDealer) return;
        const chipGroup = buildChipStack(100, 6, '#e53935');
        const cx = seat.pos[0] * 0.6;
        const cz = seat.pos[2] * 0.6;
        chipGroup.position.set(cx, top + 0.01, cz);
        this.el.object3D.add(chipGroup);
        this.chipStacks.push(chipGroup);
      });

      // ── Pot display in center ─────────────────────────────────────────────
      this.potMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.62, 0.19),
        new THREE.MeshBasicMaterial({ map: makePotTexture(this.game.pot), transparent: true, depthWrite: false })
      );
      this.potMesh.position.set(0, top + 0.42, 0);
      this.potMesh.rotation.x = -0.35;
      this.potMesh.lookAt(new THREE.Vector3(0, top + 0.42, 6));
      this.el.object3D.add(this.potMesh);

      // ── Dealer's card shoe / dealing area ─────────────────────────────────
      const deckBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.08, 0.28),
        new THREE.MeshStandardMaterial({ color: '#1a1a2e', metalness: 0.4, roughness: 0.6 })
      );
      deckBox.position.set(0.15, top + 0.04, -0.78);
      this.el.object3D.add(deckBox);
      const deckTop = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 0.24),
        new THREE.MeshBasicMaterial({ map: CARD_BACK_TEX })
      );
      deckTop.rotation.x = -Math.PI / 2;
      deckTop.position.set(0.15, top + 0.082, -0.78);
      this.el.object3D.add(deckTop);

      this.cardsReady = true;
      this._updateCommunityCards();
      this._updateNamePlates();
    },

    // ── Update community cards based on game phase ────────────────────────
    _updateCommunityCards: function () {
      const g = this.game;
      this.communityMeshes.forEach((card, i) => {
        if (i < g.communityCards.length) {
          card.material.map = getCardTex(g.communityCards[i]);
          card.material.needsUpdate = true;
          card.visible = true;
        } else {
          card.material.map = CARD_BACK_TEX;
          card.visible = false;
        }
      });
    },

    // ── Update name plates with current stacks ────────────────────────────
    _updateNamePlates: function () {
      const g = this.game;
      this.namePlates.forEach((np) => {
        const stack = g.playerStacks[np.seatIdx] || 0;
        const seat = SEAT_CONFIGS[np.seatIdx + 1];
        np.mesh.material.map = makeNamePlate(seat.name, stack);
        np.mesh.material.needsUpdate = true;
      });
    },

    // ── Show action bubble for NPC ────────────────────────────────────────
    _showAction: function (npcIdx, actionText) {
      if (npcIdx >= this.actionBubbles.length) return;
      const bubble = this.actionBubbles[npcIdx];
      bubble.material.map = makeActionBubble(actionText);
      bubble.material.needsUpdate = true;
      bubble.visible = true;
      this.actionBubbleTimers[npcIdx] = 2200; // show for 2.2 seconds
    },

    // ── Animate NPC arm reaching toward table ─────────────────────────────
    _animateNPCAction: function (figureIdx, actionType) {
      if (figureIdx >= this.seatFigures.length) return;
      const figure = this.seatFigures[figureIdx];
      // Tilt figure slightly forward on action
      figure.userData.actionAnim = { time: 0, type: actionType };
    },

    tick: function (time, dt) {
      if (!this.cardsReady) return;
      const g = this.game;

      // ── Phase advancement ─────────────────────────────────────────────────
      if (time - this.lastPhaseTime > this.phaseInterval) {
        this.lastPhaseTime = time;
        g.advancePhase();
        this._updateCommunityCards();
        this._updateNamePlates();
        // Update pot display
        this.potMesh.material.map = makePotTexture(g.pot);
        this.potMesh.material.needsUpdate = true;
        // On new deal, hide all player cards briefly then redeal
        if (g.phase === 'flop') {
          this.playerCardMeshes.forEach(cards => cards.forEach(c => { c.visible = true; }));
        } else if (g.phase === 'deal') {
          this.playerCardMeshes.forEach(cards => cards.forEach(c => { c.visible = true; }));
        }
      }

      // ── NPC action cycle ──────────────────────────────────────────────────
      if (time - this.lastActionTime > this.actionInterval) {
        this.lastActionTime = time;
        const npcIdx = this.lastAction % 6;
        this.lastAction++;
        if (!g.foldedPlayers.has(npcIdx)) {
          const result = g.npcAction(npcIdx);
          this._showAction(npcIdx, result.action);
          this._animateNPCAction(npcIdx + 1, result.action); // +1 because dealer is index 0
          // If folded, hide their cards
          if (result.action === 'FOLD' && this.playerCardMeshes[npcIdx]) {
            this.playerCardMeshes[npcIdx].forEach(c => { c.visible = false; });
          }
        }
      }

      // ── Update action bubble timers ───────────────────────────────────────
      this.actionBubbleTimers.forEach((timer, i) => {
        if (timer > 0) {
          this.actionBubbleTimers[i] -= dt;
          if (this.actionBubbleTimers[i] <= 0) {
            this.actionBubbles[i].visible = false;
            this.actionBubbleTimers[i] = 0;
          }
        }
      });

      // ── Bill all meshes toward camera ─────────────────────────────────────
      const camera = this.el.sceneEl && this.el.sceneEl.camera;
      if (camera) {
        const camPos = new THREE.Vector3();
        camera.getWorldPosition(camPos);
        [this.potMesh, ...this.namePlates.map(n => n.mesh), ...this.actionBubbles].forEach(mesh => {
          if (mesh && mesh.visible) {
            const mp = new THREE.Vector3();
            mesh.getWorldPosition(mp);
            mesh.lookAt(camPos.x, mp.y, camPos.z);
          }
        });
      }

      // ── Subtle figure idle animation ──────────────────────────────────────
      this.seatFigures.forEach((fig, i) => {
        if (!fig) return;
        const breathe = Math.sin(time * 0.0008 + i * 1.1) * 0.008;
        fig.position.y = (this.surface ? this.surface.top : 0) + breathe;

        if (fig.userData.actionAnim) {
          const anim = fig.userData.actionAnim;
          anim.time += dt;
          const progress = Math.min(anim.time / 500, 1);
          const lean = Math.sin(progress * Math.PI) * 0.08;
          fig.rotation.x = -lean;
          if (anim.time > 500) {
            fig.rotation.x = 0;
            fig.userData.actionAnim = null;
          }
        }
      });

      // ── Showdown: briefly reveal NPC hands ────────────────────────────────
      if (g.phase === 'showdown') {
        this.playerCardMeshes.forEach((cards, npcIdx) => {
          if (g.foldedPlayers.has(npcIdx)) return;
          const hand = g.playerHands[npcIdx];
          if (hand) {
            cards.forEach((card, ci) => {
              card.material.map = getCardTex(hand[ci] || 'A♠');
              card.material.needsUpdate = true;
              card.visible = true;
            });
          }
        });
      }

      // ── Subtle chip sparkle on pot change ─────────────────────────────────
      this.chipStacks.forEach((stack, i) => {
        stack.rotation.y = time * 0.0004 + i * 0.8;
      });
    }
  });
})();
