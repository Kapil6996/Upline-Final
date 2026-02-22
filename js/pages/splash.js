/* ===== Splash Page ===== */
function renderSplash() {
    const splash = document.createElement('div');
    splash.className = 'splash-page';
    splash.id = 'splash-screen';
    splash.innerHTML = `
    <div class="splash-logo">🏥</div>
    <div class="splash-title">UPLINE</div>
    <div class="splash-tagline">Offline Emergency Triage Assistant</div>
    <div class="splash-loading">
      <div class="splash-dot"></div>
      <div class="splash-dot"></div>
      <div class="splash-dot"></div>
    </div>
  `;
    return splash;
}

function hideSplash() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.classList.add('hide');
        setTimeout(() => splash.remove(), 600);
    }
}
