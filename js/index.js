const SDK = {
    canvas: null,
    ctx: null,
    scanline: 0,

    init() {
        this.canvas = document.getElementById('jumboCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.rig = document.querySelector('#rig');
        
        this.startDiagnosticLoop();
        this.startJumbotronLoop();
        console.log("SDK 5.0: SYSTEMS ONLINE");
    },

    startDiagnosticLoop() {
        const modStatus = document.getElementById('mod-load');
        const inputStatus = document.getElementById('val-input');
        
        setInterval(() => {
            // Update Position
            const p = this.rig.getAttribute('position');
            document.getElementById('val-pos').innerText = `${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}`;
            
            // Check Android/Quest Sticks
            const pads = navigator.getGamepads();
            if(pads[0] || pads[1]) {
                inputStatus.innerText = "STICKS CONNECTED";
                inputStatus.style.color = "#00FFFF";
            }

            // Check Scarlett One Module
            if (window.scarlettModule) {
                modStatus.innerText = "ACTIVE";
                modStatus.style.color = "#00FF00";
            }
        }, 100);
    },

    startJumbotronLoop() {
        setInterval(() => {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            // Background & Grid
            ctx.fillStyle = "#00050a";
            ctx.fillRect(0,0,w,h);
            ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
            for(let i=0; i<w; i+=50){ ctx.strokeRect(i,0,1,h); }

            // Dynamic Text
            ctx.fillStyle = "#00FFFF";
            ctx.font = "bold 50px Courier New";
            ctx.fillText("SCARLETT_CASINO: HIGH_STAKES", 60, 100);
            
            // Scanline Effect
            this.scanline = (this.scanline + 5) % h;
            ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
            ctx.fillRect(0, this.scanline, w, 15);

            // Force A-Frame update
            const mesh = document.getElementById('jumbotron-mesh');
            if(mesh && mesh.getObject3D('mesh')) {
                mesh.getObject3D('mesh').material.map.needsUpdate = true;
            }
        }, 33);
    },

    toggleWireframe() {
        const scene = document.querySelector('a-scene');
        scene.setAttribute('debug', scene.getAttribute('debug') ? '' : 'physics: true');
    }
};

window.onload = () => SDK.init();
