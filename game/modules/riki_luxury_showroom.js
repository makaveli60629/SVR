import * as THREE from "three";

function makeTexture(title, subtitle = "") {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "rgba(0,0,0,.86)";
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "#7fffd4";
  x.lineWidth = 10;
  x.strokeRect(28,28,c.width-56,c.height-56);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "#7fffd4";
  x.shadowBlur = 18;
  x.fillStyle = "#fff";
  x.font = "900 72px Arial";
  x.fillText(title.toUpperCase(),512,206);
  if (subtitle) {
    x.shadowBlur = 7;
    x.fillStyle = "#7fffd4";
    x.font = "800 34px Arial";
    x.fillText(subtitle.toUpperCase(),512,324);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function panel(root, title, subtitle, x, y, z, rotY, w = 4.5, h = 1.15) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({ map: makeTexture(title, subtitle), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  mesh.position.set(x,y,z);
  mesh.rotation.y = rotY;
  root.add(mesh);
  return mesh;
}

function rope(root, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx,dz);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,len,16), new THREE.MeshBasicMaterial({ color: 0x8c1025 }));
  rail.position.set((x1+x2)/2,.86,(z1+z2)/2);
  rail.rotation.z = Math.PI/2;
  rail.rotation.y = Math.atan2(dx,dz);
  root.add(rail);
  for (const [x,z] of [[x1,z1],[x2,z2]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,1.05,18), new THREE.MeshStandardMaterial({ color: 0xd8dee8, metalness: .85, roughness: .16 }));
    pole.position.set(x,.52,z);
    root.add(pole);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.12,18,12), new THREE.MeshStandardMaterial({ color: 0xf3f7ff, metalness: .9, roughness: .12 }));
    cap.position.set(x,1.08,z);
    root.add(cap);
  }
}

function plant(root, x, z) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,.3,18), new THREE.MeshStandardMaterial({ color: 0x35180f, roughness: .9 }));
  pot.position.set(x,.15,z);
  root.add(pot);
  const leafMat = new THREE.MeshBasicMaterial({ color: 0x2fa95c, transparent: true, opacity: .88, side: THREE.DoubleSide });
  for (let i=0;i<8;i++) {
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(.22,.74), leafMat);
    leaf.position.set(x + Math.sin(i)*.12, .58, z + Math.cos(i)*.12);
    leaf.rotation.y = i * Math.PI/4;
    leaf.rotation.x = .55;
    root.add(leaf);
  }
}

export function installRikiLuxuryShowroom({ scene }) {
  const root = new THREE.Group();
  root.name = "SVR_Riki_Minimal_Luxury_Overlay";
  scene.add(root);

  const glass = new THREE.MeshBasicMaterial({ color: 0x7fffd4, transparent: true, opacity: .105, side: THREE.DoubleSide, depthWrite: false });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(12.8,2.85), new THREE.MeshBasicMaterial({ color: 0x8c1025, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }));
  carpet.rotation.x = -Math.PI/2;
  carpet.position.set(20.15,.055,-4.95);
  root.add(carpet);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(15.4,3.55), glass);
  back.position.set(20.15,1.96,-7.82);
  root.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(5.75,3.12), glass);
  left.position.set(12.45,1.76,-4.95);
  left.rotation.y = Math.PI/2;
  root.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(5.75,3.12), glass);
  right.position.set(27.85,1.76,-4.95);
  right.rotation.y = -Math.PI/2;
  root.add(right);

  rope(root,13.35,-1.78,17.75,-1.78);
  rope(root,22.55,-1.78,26.95,-1.78);
  rope(root,13.35,-2.95,13.35,-7.15);
  rope(root,26.95,-2.95,26.95,-7.15);

  plant(root,12.95,-2.52);
  plant(root,27.35,-2.52);
  plant(root,13.05,-7.28);
  plant(root,27.25,-7.28);

  panel(root,"Riki Luxury Showroom","Glass • Red Carpet • Silver Rails",20.15,4.12,-7.76,0,6.8,1.08);
  panel(root,"Riki Experience","Enter • Face Hologram • Audio Auto",13.0,2.25,-5.28,Math.PI/2,3.0,1.2);
  panel(root,"Status","Hologram Playing • Portal Ready",24.95,2.1,-7.55,0,3.1,1.05);

  return { update(){} };
}
