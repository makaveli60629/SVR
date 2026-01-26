/** * SCARLETT SDK v5.7 - QUAD-SYNC
 * Manages HUD, Stick Telemetry, and Jumbotron Texture Refresh.
 */
const SDK = {
    init() {
        this.rig = document.querySelector('#rig');
        this.startLoops();
        console.log("SPINE 5.7: CONTRACTS ACTIVE");
    },
    startLoops() {
        setInterval(() => {
            // HUD Telemetry
            const p = this.rig.getAttribute('position');
            document.getElementById('val-pos').innerText = `${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}`;
            
            // Handshake Logic
            if (window.scarlettModule && !window.__scarlettInitDone) {
                window.__scarlettInitDone = true;
                window.scarlettModule.init();
                document.getElementById('mod-load').innerText = "ACTIVE";
                document.getElementById('mod-load').style.color = "#00FF00";
            }

            // Texture Refresh (Forces 4 Canvases to show Module Logs)
            ['NE', 'NW', 'SE', 'SW'].forEach(id => {
                const el = document.getElementById(`jumbo_${id}`);
                if (el && el.getObject3D('mesh')) {
                    el.getObject3D('mesh').material.map.needsUpdate = true;
                }
            });
        }, 100);
    }
};
window.onload = () => SDK.init();
