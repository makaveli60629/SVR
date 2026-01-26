// SCARLETT ONE — SVR Permanent World
// RULES: Hands-only. Safe-load textures. Never black-screen.

let hand1, hand2;
const textureRoot = 'assets/textures/';

// Safe material loader (never fails)
function safeMat(THREE, file, fallback = 0x202020, repeat = 4) {
    const mat = new THREE.MeshStandardMaterial({
        color: fallback,
        roughness: 0.35,
        metalness: 0.15
    });

    const loader = new THREE.TextureLoader();
    loader.load(
        textureRoot + file,
        tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(repeat, repeat);
            mat.map = tex;
            mat.needsUpdate = true;
            console.log('[tex] loaded:', file);
        },
        undefined,
        () => console.warn('[tex] missing (fallback):', file)
    );

    return mat;
}

export function createWorld(THREE, scene, camera, renderer, playerGroup) {
    // Background & fog (never black)
    scene.background = new THREE.Color(0x070a14);
    scene.fog = new THREE.Fog(0x070a14, 6, 160);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.05));

    const sun = new THREE.DirectionalLight(0x00ffff, 1.35);
    sun.position.set(6, 12, 6);
    scene.add(sun);

    const mag = new THREE.PointLight(0xff00ff, 0.8, 30);
    mag.position.set(-4, 3, -4);
    scene.add(mag);

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(120, 120),
        safeMat(THREE, 'floor.jpg', 0x151515, 6)
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Grid (debug depth)
    scene.add(new THREE.GridHelper(120, 120, 0x00ff88, 0x112233));

    // Landmarks (you WILL see these)
    addLandmarks(THREE, scene);

    // Hands-only
    hand1 = renderer.xr.getHand(0);
    hand2 = renderer.xr.getHand(1);
    playerGroup.add(hand1);
    playerGroup.add(hand2);

    camera.position.set(0, 1.6, 2);
    camera.lookAt(0, 1.4, -3);

    console.log('[World] initialized');
}

function addLandmarks(THREE, scene) {
    // Floating rainbow cubes
    const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const mat = new THREE.MeshNormalMaterial();

    for (let i = -2; i <= 2; i += 2) {
        const c = new THREE.Mesh(geo, mat);
        c.position.set(i, 1.5, -3);
        scene.add(c);
    }

    // Monolith ring
    const monoMat = new THREE.MeshStandardMaterial({ color: 0x222244 });
    const r = 8;

    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 4, 0.6),
            monoMat
        );
        m.position.set(Math.cos(a) * r, 2, Math.sin(a) * r);
        scene.add(m);
    }
}

export function updateWorld(delta, playerGroup) {
    if (!hand1 || !hand1.visible) return;

    const speed = 3.0;
    const z = hand1.position.z;
    const x = hand1.position.x;

    if (z < -0.15) playerGroup.translateZ(-speed * delta);
    if (z >  0.15) playerGroup.translateZ( speed * delta);

    if (x >  0.25) playerGroup.rotation.y -= Math.PI / 4;
    if (x < -0.25) playerGroup.rotation.y += Math.PI / 4;
}
