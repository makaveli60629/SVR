/**
 * /js/scarlett1/world.js — PERMANENT WORLD (Lobby + Pit + Table + Jumbotrons + Bots + Avatars)
 * Goals:
 *  - Visible PIT (big cylinder hole) + floor texture/grid
 *  - Bright lobby walls + ceiling so it’s not “black void”
 *  - 4 Jumbotrons + doors under each
 *  - Poker table on a PEDESTAL sunk into pit (center)
 *  - Bots walking (obvious motion)
 *  - Avatar spawners (male/female/ninja/combat) using your assets
 *
 * IMPORTANT:
 *  - Safe: world has NO imports
 *  - Uses ctx.THREE from spine
 *  - If you still see “nothing”, it’s almost always canvas/CSS layering (HUD covering canvas)
 */

export async function init(ctx){
  const { THREE, scene, camera, rig, renderer, setXRSpawn, log } = ctx;

  // ---------- helpers ----------
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const isXR=()=>!!(renderer && renderer.xr && renderer.xr.isPresenting);

  // ---------- scale knobs ----------
  const holeR     = 7.5;       // pit hole radius (bigger so you SEE it)
  const pitY      = -6.5;      // how deep the pit floor goes
  const outerR    = 42.0;      // lobby radius (circular)
  const wallH     = 14.0;
  const ceilingY  = wallH;

  const pedestalR = 5.2;       // pedestal radius holding the table
  const pedestalTopY = -0.35;  // sink pedestal slightly below floor
  const pedestalH = (0 - pitY) + 2.0; // tall enough to reach down

  const TABLE_SCALE = 0.92;

  // ---------- scene ----------
  scene.background = new THREE.Color(0x050508);

  // XR spawn offset (avoid table-center issue)
  setXRSpawn?.(new THREE.Vector3(0, 0, 18), Math.PI);

  // ---------- lighting (BRIGHT, obvious) ----------
  scene.add(new THREE.AmbientLight(0xffffff, 1.25));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a44, 1.10));

  const dir = new THREE.DirectionalLight(0xffffff, 1.6);
  dir.position.set(18, 26, 10);
  scene.add(dir);

  const top = new THREE.PointLight(0xffffff, 4.0, 250);
  top.position.set(0, ceilingY - 2.0, 0);
  scene.add(top);

  // ring accent lights
  for(let i=0;i<18;i++){
    const a=(i/18)*Math.PI*2;
    const p=new THREE.PointLight(0x8a2be2, 1.7, 140);
    p.position.set(Math.cos(a)*(outerR*0.55), 7.8, Math.sin(a)*(outerR*0.55));
    scene.add(p);
  }

  // ---------- floor + grid ----------
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 240, 1),
    new THREE.MeshStandardMaterial({
      color: 0x0b0b12, roughness: 0.95, metalness: 0.06, side: THREE.DoubleSide
    })
  );
  deck.rotation.x = -Math.PI/2;
  deck.position.y = 0;
  scene.add(deck);

  const grid = new THREE.GridHelper(outerR*2, 120, 0x2a2a44, 0x141422);
  grid.position.y = 0.02;
  scene.add(grid);

  // ---------- pit (open cylinder hole) ----------
  const pit = new THREE.Group();

  const pitDepth = (0 - pitY);
  const pitWall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, pitDepth + 0.6, 240, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x05050b, roughness: 0.97, metalness: 0.06, side: THREE.DoubleSide
    })
  );
  pitWall.position.y = pitY + (pitDepth/2);
  pit.add(pitWall);

  const pitLip = new THREE.Mesh(
    new THREE.TorusGeometry(holeR + 0.10, 0.07, 12, 260),
    new THREE.MeshStandardMaterial({
      color: 0x8a2be2, emissive: 0x8a2be2, emissiveIntensity: 1.35, roughness: 0.35
    })
  );
  pitLip.rotation.x = Math.PI/2;
  pitLip.position.y = 0.04;
  pit.add(pitLip);

  // pit bottom so you can perceive depth (still looks like a hole)
  const pitBottom = new THREE.Mesh(
    new THREE.CircleGeometry(holeR*0.98, 120),
    new THREE.MeshStandardMaterial({
      color: 0x040407, roughness: 1.0, metalness: 0.02
    })
  );
  pitBottom.rotation.x = -Math.PI/2;
  pitBottom.position.y = pitY;
  pit.add(pitBottom);

  scene.add(pit);

  // ---------- lobby walls + ceiling ----------
  const shell = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x07070d, roughness: 0.95, metalness: 0.04, side: THREE.DoubleSide
  });

  const outerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR, outerR, wallH, 260, 1, true),
    wallMat
  );
  outerWall.position.y = wallH/2;
  shell.add(outerWall);

  const ceiling = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 240, 1),
    new THREE.MeshStandardMaterial({
      color: 0x040409, roughness: 1.0, metalness: 0.02, side: THREE.DoubleSide
    })
  );
  ceiling.rotation.x = -Math.PI/2;
  ceiling.position.y = ceilingY;
  shell.add(ceiling);

  // crown neon rings
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0x8a2be2, emissive: 0x8a2be2, emissiveIntensity: 1.55, roughness: 0.45
  });
  for(let i=0;i<3;i++){
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(outerR-2.2-i*1.1, 0.09, 12, 280),
      crownMat
    );
    ring.rotation.x = Math.PI/2;
    ring.position.y = ceilingY - 0.8 - i*0.85;
    shell.add(ring);
  }

  scene.add(shell);

  // ---------- 4 JUMBOTRONS + doors under ----------
  const jumbos = new THREE.Group();
  const jumboW = 10.5, jumboH = 5.8;
  const jumboY = 8.1;
  const jumboR = outerR - 0.9;

  function makeScreenTexture(label){
    const c=document.createElement('canvas');
    c.width=1024; c.height=512;
    const g=c.getContext('2d');
    g.fillStyle='rgba(5,5,12,0.95)'; g.fillRect(0,0,c.width,c.height);
    g.fillStyle='rgba(138,43,226,0.18)'; g.fillRect(0,0,c.width,c.height);
    g.strokeStyle='rgba(255,255,255,0.18)'; g.lineWidth=18; g.strokeRect(22,22,c.width-44,c.height-44);
    g.fillStyle='rgba(255,255,255,0.95)'; g.font='900 82px system-ui, Arial';
    g.textAlign='center'; g.textBaseline='middle';
    g.fillText(label, c.width/2, c.height/2 - 18);
    g.fillStyle='rgba(230,236,252,0.85)'; g.font='700 34px system-ui, Arial';
    g.fillText('SCARLETT VR', c.width/2, c.height/2 + 70);
    const tex=new THREE.CanvasTexture(c);
    tex.needsUpdate=true;
    return tex;
  }

  const screenMat = (label)=>new THREE.MeshStandardMaterial({
    map: makeScreenTexture(label),
    roughness: 0.85, metalness: 0.05,
    emissive: 0xffffff, emissiveIntensity: 0.35
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0b0b12, roughness: 0.5, metalness: 0.45,
    emissive: 0x8a2be2, emissiveIntensity: 0.12
  });

  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x101018, roughness: 0.7, metalness: 0.25
  });

  for(let i=0;i<4;i++){
    const a=i*(Math.PI/2);
    const gx=Math.cos(a)*jumboR;
    const gz=Math.sin(a)*jumboR;

    const group=new THREE.Group();
    group.position.set(gx, 0, gz);
    group.lookAt(0, jumboY, 0);

    const frame=new THREE.Mesh(new THREE.BoxGeometry(jumboW+0.6, jumboH+0.6, 0.35), frameMat);
    frame.position.y = jumboY;
    group.add(frame);

    const screen=new THREE.Mesh(new THREE.PlaneGeometry(jumboW, jumboH), screenMat(`JUMBOTRON ${i+1}`));
    screen.position.set(0, jumboY, 0.19);
    group.add(screen);

    // door under jumbo
    const door=new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.2, 0.35), doorMat);
    door.position.set(0, 2.1, 0.18);
    group.add(door);

    // small neon sign above door
    const sign=new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 0.8),
      new THREE.MeshStandardMaterial({
        map: makeScreenTexture('ENTER'),
        transparent:true,
        emissive: 0xffffff, emissiveIntensity: 0.25,
        roughness: 0.9, metalness: 0.05
      })
    );
    sign.position.set(0, 4.9, 0.21);
    group.add(sign);

    jumbos.add(group);
  }
  scene.add(jumbos);

  // ---------- pedestal (the “table pedestal” sunk into pit) ----------
  const pedestal = new THREE.Group();

  const pedMat = new THREE.MeshStandardMaterial({
    color: 0x07070c, roughness: 0.75, metalness: 0.18,
    emissive: 0x14071f, emissiveIntensity: 0.12
  });

  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(pedestalR, pedestalR, pedestalH, 120, 1, false),
    pedMat
  );
  ped.position.y = (pitY + pedestalTopY)/2; // centered between
  ped.position.y = pitY + (pedestalH/2) + 0.1;
  pedestal.add(ped);

  const pedTop = new THREE.Mesh(
    new THREE.CylinderGeometry(pedestalR*1.02, pedestalR*1.02, 0.45, 120),
    new THREE.MeshStandardMaterial({
      color: 0x0b0b12, roughness: 0.55, metalness: 0.35,
      emissive: 0x8a2be2, emissiveIntensity: 0.15
    })
  );
  pedTop.position.y = pedestalTopY;
  pedestal.add(pedTop);

  const pedRing = new THREE.Mesh(
    new THREE.TorusGeometry(pedestalR*1.03, 0.09, 12, 220),
    new THREE.MeshStandardMaterial({
      color: 0x8a2be2, emissive: 0x8a2be2, emissiveIntensity: 1.15, roughness: 0.35
    })
  );
  pedRing.rotation.x = Math.PI/2;
  pedRing.position.y = pedestalTopY + 0.26;
  pedestal.add(pedRing);

  scene.add(pedestal);

  // ---------- poker table + chairs (on pedestal top) ----------
  const tableGroup = new THREE.Group();
  tableGroup.position.y = pedestalTopY + 0.35;
  tableGroup.scale.setScalar(TABLE_SCALE);

  const tableBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 3.0, 1.25, 60),
    new THREE.MeshStandardMaterial({
      color: 0x0b0b10, roughness: 0.55, metalness: 0.35,
      emissive: 0x8a2be2, emissiveIntensity: 0.22
    })
  );
  tableBase.position.y = 0.7;
  tableGroup.add(tableBase);

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(5.2, 5.2, 0.34, 140),
    new THREE.MeshStandardMaterial({
      color: 0x07070c, roughness: 0.85, metalness: 0.12
    })
  );
  tableTop.position.y = 1.55;
  tableGroup.add(tableTop);

  const tableNeon = new THREE.Mesh(
    new THREE.TorusGeometry(5.35, 0.07, 10, 260),
    new THREE.MeshStandardMaterial({
      color: 0x8a2be2, emissive: 0x8a2be2, emissiveIntensity: 1.1, roughness: 0.4
    })
  );
  tableNeon.rotation.x = Math.PI/2;
  tableNeon.position.y = 1.72;
  tableGroup.add(tableNeon);

  // chairs
  const chairMat = new THREE.MeshStandardMaterial({ color:0x0b0b10, roughness:0.65, metalness:0.25 });
  const chairGlow = new THREE.MeshStandardMaterial({ color:0x8a2be2, emissive:0x8a2be2, emissiveIntensity:0.75, roughness:0.4 });

  const chairDist = 6.9;
  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    const chair=new THREE.Group();
    chair.position.set(Math.cos(a)*chairDist, 0, Math.sin(a)*chairDist);
    chair.lookAt(0, 1.0, 0);

    const seat=new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.98, 0.22, 32), chairMat);
    seat.position.y=0.82;
    chair.add(seat);

    const glow=new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.055, 10, 56), chairGlow);
    glow.rotation.x=Math.PI/2;
    glow.position.y=0.06;
    chair.add(glow);

    tableGroup.add(chair);
  }

  pedestal.add(tableGroup);

  // ---------- bots walking (very visible) ----------
  const bots = new THREE.Group();
  const botGeo = new THREE.CapsuleGeometry(0.26, 1.05, 6, 14);
  const botMats = [
    new THREE.MeshStandardMaterial({ color:0x2b5cff, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0xff3b7a, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0x00c2ff, roughness:0.65 }),
    new THREE.MeshStandardMaterial({ color:0x7cff4a, roughness:0.65 }),
  ];

  const botCount=10;
  const botPathR=12.5;
  const botY=0.55;

  const botData=[];
  for(let i=0;i<botCount;i++){
    const m=new THREE.Mesh(botGeo, botMats[i%4]);
    bots.add(m);
    botData.push({ mesh:m, phase:(i/botCount)*Math.PI*2, speed:0.35 + (i%4)*0.04 });
  }
  scene.add(bots);

  // ---------- avatars (load your GLBs if GLTFLoader exists) ----------
  // Your assets:
  // /assets/avatars/male.glb
  // /assets/avatars/female.glb
  // /assets/avatars/ninja.glb
  // /assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb
  //
  // If spine doesn’t provide GLTFLoader, we spawn placeholders so you STILL SEE something.
  const avatars = new THREE.Group();
  scene.add(avatars);

  async function loadAvatar(url, pos, scale=1.0){
    const loader = ctx.GLTFLoader || ctx.gltfLoader || null;
    if(!loader){
      // placeholder
      const ph = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.35, 1.35, 6, 14),
        new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.6, metalness:0.1 })
      );
      ph.position.copy(pos);
      avatars.add(ph);
      log(`[avatar] loader missing, placeholder used for ${url}`);
      return;
    }
    return new Promise((resolve)=>{
      loader.load(url, (gltf)=>{
        const root = gltf.scene || gltf.scenes?.[0];
        if(!root){ resolve(); return; }
        root.position.copy(pos);
        root.scale.setScalar(scale);
        avatars.add(root);
        log(`[avatar] loaded ${url}`);
        resolve(root);
      }, undefined, (err)=>{
        log(`[avatar] FAILED ${url} :: ${err?.message || err}`);
        // fallback placeholder
        const ph = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.35, 1.35, 6, 14),
          new THREE.MeshStandardMaterial({ color:0xff3355, roughness:0.6, metalness:0.1 })
        );
        ph.position.copy(pos);
        avatars.add(ph);
        resolve();
      });
    });
  }

  // place avatars near one wall so you can spot them fast
  const avZ = -(outerR - 6.5);
  loadAvatar('./assets/avatars/male.glb',   new THREE.Vector3(-3.2, 0.0, avZ), 1.05);
  loadAvatar('./assets/avatars/female.glb', new THREE.Vector3(-1.0, 0.0, avZ), 1.05);
  loadAvatar('./assets/avatars/ninja.glb',  new THREE.Vector3( 1.4, 0.0, avZ), 1.05);
  loadAvatar('./assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb', new THREE.Vector3( 3.8, 0.0, avZ), 1.05);

  // ---------- safe camera spawn (non-XR) ----------
  camera.position.set(0, 1.7, 18);
  camera.lookAt(0, 1.35, 0);

  log('[world] lobby+pits+walls+jumbotrons+table+bots+avatars ✅');

  // ---------- animate ----------
  let t=0;

  return {
    updates:[
      (dt)=>{
        t += dt;

        // pulses
        pitLip.material.emissiveIntensity = 1.25 + Math.sin(t*1.05)*0.22;
        pedRing.material.emissiveIntensity = 1.05 + Math.sin(t*1.2 + 0.5)*0.25;
        tableNeon.material.emissiveIntensity = 1.00 + Math.sin(t*1.35)*0.22;

        // bot loop
        for(const b of botData){
          b.phase += dt * b.speed;
          const a=b.phase;
          b.mesh.position.set(Math.cos(a)*botPathR, botY + Math.sin(t*2.3 + a)*0.04, Math.sin(a)*botPathR);
          b.mesh.lookAt(0, botY, 0);
        }
      }
    ],
    interactables:[]
  };
                            }
