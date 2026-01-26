const SDK = {
    init() {
        this.rig = document.querySelector('#rig');
        this.scene = document.querySelector('a-scene');
        this.setupDiagnostics();
        console.log("SCARLETT SDK: INITIALIZED");
    },

    setupDiagnostics() {
        setInterval(() => {
            // Update Position
            const p = this.rig.getAttribute('position');
            document.getElementById('val-pos').innerText = `${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}`;
            
            // Check Module Health
            if (window.scarlettModule) {
                document.getElementById('status-poker').style.color = "#00FFFF";
                document.getElementById('status-store').style.color = "#00FFFF";
                document.getElementById('status-audio').style.color = "#00FFFF";
            }

            // Stick Detection
            const pads = navigator.getGamepads();
            document.getElementById('val-input').innerText = (pads[0] || pads[1]) ? "STICK CONNECTED" : "TOUCH/HANDS";
        }, 100);
    },

    toggleHUD() {
        const hud = document.getElementById('dev-container');
        hud.style.display = hud.style.display === 'none' ? 'block' : 'none';
    },

    toggleMesh() {
        const meshes = document.querySelectorAll('a-entity');
        meshes.forEach(m => {
            let obj = m.getObject3D('mesh');
            if(obj) obj.traverse(node => { if(node.isMesh) node.material.wireframe = !node.material.wireframe; });
        });
    },

    showHitboxes() {
        this.scene.setAttribute('debug', '');
        console.log("SDK: Hitboxes Visible");
    }
};

window.onload = () => SDK.init();
