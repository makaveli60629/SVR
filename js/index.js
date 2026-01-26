/** SCARLETT SDK v6.0 - HARD CONTRACT **/
console.log("SDK: boot");
// Module Load Probe: Catch hidden errors
window.addEventListener('error', (e) => {
    console.error("GLOBAL_ERR:", e.message, "at", e.filename);
    const modStatus = document.getElementById('mod-load');
    if (e.filename.includes('logic.js')) {
        modStatus.innerText = "PATH_ERROR";
        modStatus.style.color = "orange";
    }
});

const SDK = {
    init() {
        this.rig = document.querySelector('#rig');
        this.startLoops();
    },
    startLoops() {
        setInterval(() => {
            const p = this.rig.getAttribute('position');
            document.getElementById('val-pos').innerText = `${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}`;
            
            // Handshake behavior (Build 6.0 Contract)
            if (window.scarlettModule && !window.__scarlettInitDone) {
                window.__scarlettInitDone = true;
                window.scarlettModule.init();
                document.getElementById('mod-load').innerText = "ACTIVE";
                document.getElementById('mod-load').style.color = "#00FF00";
            }
        }, 100);
    }
};
window.onload = () => SDK.init();
