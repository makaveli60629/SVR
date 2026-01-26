/** * SCARLETT SDK v5.6 - HARDENED SPINE
 * Ensures the world stays visible and correctly handshakes with ChatGPT modules.
 */
const SDK = {
    init() {
        this.rig = document.querySelector('#rig');
        // Get all 4 Jumbotron contexts
        this.jumbos = {
            NE: document.getElementById('jumboCanvas_NE').getContext('2d'),
            NW: document.getElementById('jumboCanvas_NW').getContext('2d'),
            SE: document.getElementById('jumboCanvas_SE').getContext('2d'),
            SW: document.getElementById('jumboCanvas_SW').getContext('2d')
        };
        this.startLoops();
        console.log("SPINE 5.6: HARDENED & READY");
    },
    startLoops() {
        setInterval(() => {
            // 1. Update Telemetry
            const p = this.rig.getAttribute('position');
            document.getElementById('val-pos').innerText = `${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}`;
            
            // 2. Handshake Check
            const modStatus = document.getElementById('mod-load');
            if (window.scarlettModule) {
                modStatus.innerText = "ACTIVE";
                modStatus.style.color = "#00FF00";
                // Only run init once
                if (!window.__scarlettInitDone) {
                    window.__scarlettInitDone = true;
                    window.scarlettModule.init();
                }
            }

            // 3. Keep Jumbotrons Alive
            this.updateJumbos();
        }, 100);
    },
    updateJumbos() {
        const time = Date.now() / 1000;
        Object.keys(this.jumbos).forEach(key => {
            const ctx = this.jumbos[key];
            ctx.fillStyle = "#00050a";
            ctx.fillRect(0, 0, 1024, 512);
            ctx.fillStyle = "#00FFFF";
            ctx.font = "bold 40px Courier New";
            ctx.fillText(`ZONE_${key}: SCARLETT_EMPIRE_OS`, 50, 80);
            ctx.fillText(`STATUS: ${window.scarlettModule ? 'LINK_ESTABLISHED' : 'WAITING_FOR_MODULE'}`, 50, 140);
            
            // Texture Update Guard
            const el = document.getElementById(`jumbo_${key}`);
            if (el && el.getObject3D('mesh')) {
                el.getObject3D('mesh').material.map.needsUpdate = true;
            }
        });
    }
};
window.onload = () => SDK.init();
