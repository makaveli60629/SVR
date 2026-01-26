export const Bus = {
  log(msg) {
    const term = document.getElementById('term');
    if (term) {
      term.innerHTML += `<br>> ${escapeHtml(String(msg))}`;
      term.scrollTop = term.scrollHeight;
    }
    console.log('[SCARLETT]', msg);
  }
};
function escapeHtml(s){
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}
