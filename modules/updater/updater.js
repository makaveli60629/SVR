
// Updater script: checks update/version.json and reloads page when version changes
fetch('update/version.json')
  .then(response => response.json())
  .then(data => {
    const current = localStorage.getItem('svr_version');
    const latest = JSON.stringify(data);
    if (current && current !== latest) {
      localStorage.setItem('svr_version', latest);
      location.reload(true);
    } else if (!current) {
      localStorage.setItem('svr_version', latest);
    }
  })
  .catch(err => {
    console.error('Updater error', err);
  });
