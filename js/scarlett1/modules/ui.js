export function initUI({ Bus }) {
  const storePanel = document.getElementById('storePanel');
  const settingsPanel = document.getElementById('settingsPanel');

  window.openSettings = () => {
    if (!settingsPanel) return;
    const open = settingsPanel.style.display !== 'none';
    settingsPanel.style.display = open ? 'none' : 'block';
    if (!open && storePanel) storePanel.style.display = 'none';
    Bus.log(open ? 'SETTINGS CLOSED' : 'OPENING OS SETTINGS...');
  };

  Bus.log('UI ONLINE');
}
