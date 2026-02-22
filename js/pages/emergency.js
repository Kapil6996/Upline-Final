/* ===== Emergency Contacts Page ===== */
let emergencyContacts = null;

async function loadContacts() {
    if (!emergencyContacts) {
        const res = await fetch('./data/contacts.json');
        const data = await res.json();
        emergencyContacts = data.contacts;
    }
    return emergencyContacts;
}

function renderEmergency() {
    const page = document.createElement('div');
    page.className = 'page emergency-page page-scroll';

    page.innerHTML = `
    <h2>🚨 Emergency Contacts</h2>
    <p class="emergency-desc">One-tap to call. These numbers work across India.</p>

    <div class="emergency-list" id="emergency-list">
      <div class="empty-state">
        <div class="empty-state-icon">⏳</div>
        <div class="empty-state-text">Loading contacts...</div>
      </div>
    </div>

    <div class="disclaimer-banner" style="margin-top: var(--space-xl);">
      📍 If you have internet, try sharing your location when calling for faster response.
    </div>
  `;

    setTimeout(async () => {
        const contacts = await loadContacts();
        if (contacts) renderContactsList(contacts);
    }, 50);

    return page;
}

function renderContactsList(contacts) {
    const container = document.getElementById('emergency-list');
    if (!container) return;

    container.innerHTML = contacts
        .sort((a, b) => a.priority - b.priority)
        .map(c => `
      <a href="tel:${c.number}" class="emergency-card" id="contact-${c.number}" style="text-decoration:none; color:inherit;">
        <span class="emergency-icon">${c.icon}</span>
        <div class="emergency-info">
          <div class="emergency-name">${c.name}</div>
          <div class="emergency-number">${c.number}</div>
          <div class="emergency-detail">${c.description}</div>
        </div>
        <div class="emergency-call-icon">📞</div>
      </a>
    `).join('');
}
