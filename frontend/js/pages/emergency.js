/* ===== Emergency Contacts Page ===== */
let emergencyContacts = null;

async function loadContacts() {
  if (!emergencyContacts) {
    try {
      const res = await fetch('./data/contacts.json');
      const data = await res.json();
      emergencyContacts = data.contacts;
    } catch {
      emergencyContacts = [
        { name: 'Ambulance', number: '108', icon: '🚑', description: 'National Emergency Ambulance Service', priority: 1 },
        { name: 'Emergency', number: '112', icon: '🆘', description: 'Universal Emergency Number', priority: 2 },
        { name: 'Police', number: '100', icon: '🚔', description: 'Police Emergency', priority: 3 },
        { name: 'Fire', number: '101', icon: '🚒', description: 'Fire Brigade', priority: 4 }
      ];
    }
  }
  return emergencyContacts;
}

function renderEmergency() {
  const isArmed = window._emergencyArmed === true;

  if (isArmed) {
    document.body.classList.add('emergency-mode');
  }

  const page = document.createElement('div');
  page.className = `page emergency-page page-scroll${isArmed ? ' armed' : ''}`;

  if (isArmed) {
    // ── FULL OLED EMERGENCY MODE ──────────────────────────────────────────
    page.innerHTML = `
      <div class="em-layout">

        <!-- Armed Header -->
        <div class="em-armed-header">
          <span class="em-status-dot"></span>
          EMERGENCY MODE ACTIVE
          <span class="em-status-dot"></span>
        </div>

        <!-- Live GPS + Battery Strip -->
        <div class="em-hud-strip" id="em-hud-strip">
          <div class="em-hud-pill">
            <span class="em-hud-label">GPS</span>
            <span class="em-hud-value" id="em-gps">ACQUIRING…</span>
          </div>
          <div class="em-hud-pill">
            <span class="em-hud-label">BAT</span>
            <span class="em-hud-value" id="em-battery">—%</span>
          </div>
          <div class="em-hud-pill">
            <span class="em-hud-label">TIME</span>
            <span class="em-hud-value" id="em-clock">──:──</span>
          </div>
        </div>

        <!-- Giant Pulsing SOS Button -->
        <div class="em-sos-zone">
          <div class="em-sos-ring em-ring-3"></div>
          <div class="em-sos-ring em-ring-2"></div>
          <div class="em-sos-ring em-ring-1"></div>
          <button class="em-sos-btn" id="sos-call-btn" onclick="_handleSOS()">
            <span class="em-sos-icon">🆘</span>
            <span class="em-sos-label">S O S</span>
            <span class="em-sos-sub">Tap to call 108</span>
          </button>
        </div>

        <!-- 4-Action Grid -->
        <div class="em-action-grid">
          <a href="tel:108" class="em-action-btn em-btn-red" onclick="if(navigator.vibrate)navigator.vibrate(200)" id="action-108">
            <span class="em-action-icon">🚑</span>
            <span class="em-action-num">108</span>
            <span class="em-action-name">Ambulance</span>
          </a>
          <a href="tel:112" class="em-action-btn em-btn-red" onclick="if(navigator.vibrate)navigator.vibrate(200)" id="action-112">
            <span class="em-action-icon">🆘</span>
            <span class="em-action-num">112</span>
            <span class="em-action-name">Emergency</span>
          </a>
          <button class="em-action-btn em-btn-amber" onclick="_toggleFlashSOS()" id="action-flash">
            <span class="em-action-icon">🔦</span>
            <span class="em-action-num">FLASH</span>
            <span class="em-action-name">Morse SOS</span>
          </button>
          <button class="em-action-btn em-btn-teal" onclick="_shareLocation()" id="action-share">
            <span class="em-action-icon">📍</span>
            <span class="em-action-num">SHARE</span>
            <span class="em-action-name">Location</span>
          </button>
        </div>

        <!-- Disarm -->
        <button class="em-disarm-btn" onclick="exitEmergencyMode()">
          ◀ DISARM EMERGENCY MODE
        </button>

        <div class="em-footer-note">
          📍 Share your location when calling for fastest response
        </div>
      </div>
    `;

    // Init live HUD
    setTimeout(() => {
      _initEmHud();
    }, 50);

  } else {
    // ── NORMAL EMERGENCY CONTACTS PAGE ────────────────────────────────────
    page.innerHTML = `
      <h2>🚨 Emergency Contacts</h2>
      <p class="emergency-desc">One-tap to call. These numbers work across India.</p>
      <div class="emergency-list" id="emergency-list">
        <div class="empty-state">
          <div class="empty-state-icon">⏳</div>
          <div class="empty-state-text">Loading contacts...</div>
        </div>
      </div>
      <div class="disclaimer-banner" style="margin-top: var(--space-xl)">
        📍 If you have internet, try sharing your location when calling for faster response.
      </div>
    `;

    setTimeout(async () => {
      const contacts = await loadContacts();
      if (contacts) renderContactsList(contacts, false);
    }, 50);
  }

  return page;
}

/* ──────────────────────────────────────────────────────────
   Live HUD — GPS / Battery / Clock
   ────────────────────────────────────────────────────────── */
let _emClockInterval = null;

function _initEmHud() {
  // Clock
  const clockEl = document.getElementById('em-clock');
  if (clockEl) {
    function _tick() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      clockEl.textContent = `${h}:${m}`;
    }
    _tick();
    _emClockInterval = setInterval(_tick, 1000);
  }

  // Battery
  if (navigator.getBattery) {
    navigator.getBattery().then(b => {
      const el = document.getElementById('em-battery');
      if (el) {
        const pct = Math.round(b.level * 100);
        el.textContent = `${pct}%`;
        el.style.color = pct <= 15 ? 'var(--color-emergency)' : pct <= 30 ? 'var(--color-gold)' : 'var(--accent-teal)';
      }
    });
  }

  // GPS
  if (navigator.geolocation) {
    const gpsEl = document.getElementById('em-gps');
    navigator.geolocation.getCurrentPosition(
      pos => {
        if (gpsEl) {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          gpsEl.textContent = `${lat}, ${lng}`;
          gpsEl.style.color = 'var(--accent-teal)';
          // Cache for SOS SMS
          window._lastGPS = `${lat}, ${lng}`;
        }
      },
      () => {
        if (gpsEl) {
          gpsEl.textContent = 'UNAVAILABLE';
          gpsEl.style.color = 'var(--text-muted)';
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }
}

/* ──────────────────────────────────────────────────────────
   Action Handlers
   ────────────────────────────────────────────────────────── */
function _handleSOS() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
  const btn = document.getElementById('sos-call-btn');
  const number = (btn && btn.dataset.number) || '108';
  window.location.href = `tel:${number}`;
}

let _morseActive = false;
function _toggleFlashSOS() {
  if (_morseActive) return;
  _morseActive = true;
  const btn = document.getElementById('action-flash');
  if (btn) btn.classList.add('active');
  if (navigator.vibrate) navigator.vibrate([200, 200, 200, 200, 600, 200, 600, 200, 600, 200, 200, 200, 200, 200, 200]);
  setTimeout(() => {
    _morseActive = false;
    if (btn) btn.classList.remove('active');
  }, 3000);
}

function _shareLocation() {
  const gps = window._lastGPS || 'Location unavailable';
  const msg = `🆘 SOS — I need help. Location: ${gps}`;
  if (navigator.share) {
    navigator.share({ title: 'UPLINE SOS', text: msg }).catch(() => { });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(msg).then(() => {
      const btn = document.getElementById('action-share');
      if (btn) { btn.querySelector('.em-action-name').textContent = 'Copied!'; setTimeout(() => { if (btn) btn.querySelector('.em-action-name').textContent = 'Location'; }, 2000); }
    });
  }
}

/* ──────────────────────────────────────────────────────────
   Normal contacts list renderer
   ────────────────────────────────────────────────────────── */
function renderContactsList(contacts, isArmed) {
  const container = document.getElementById('emergency-list');
  if (!container) return;

  const sorted = contacts.sort((a, b) => a.priority - b.priority);
  container.innerHTML = sorted.map(c => `
    <a href="tel:${c.number}" class="emergency-card" id="contact-${c.number}"
       style="text-decoration:none; color:inherit;"
       onclick="if(navigator.vibrate) navigator.vibrate(100)">
      <span class="emergency-icon">${c.icon}</span>
      <div class="emergency-info">
        <div class="emergency-name">${c.name}</div>
        <div class="emergency-number">${c.number}</div>
        <div class="emergency-detail">${c.description}</div>
      </div>
      <div class="emergency-call-icon">📞</div>
    </a>
  `).join('');

  if (isArmed) {
    const btn = document.getElementById('sos-call-btn');
    if (btn && sorted.length > 0) btn.dataset.number = sorted[0].number;
  }
}

/* ──────────────────────────────────────────────────────────
   Disarm
   ────────────────────────────────────────────────────────── */
function exitEmergencyMode() {
  if (_emClockInterval) { clearInterval(_emClockInterval); _emClockInterval = null; }
  document.body.classList.remove('emergency-mode');
  window._emergencyArmed = false;
  history.replaceState(null, '', window.location.pathname);
  Router.navigate('/dashboard');
}
