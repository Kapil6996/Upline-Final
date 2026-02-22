/* ===== First Aid Page ===== */
let allFirstAidData = null;

async function loadFirstAidData() {
    if (!allFirstAidData) {
        const res = await fetch('./data/firstaid.json');
        const data = await res.json();
        allFirstAidData = data.instructions;
    }
    return allFirstAidData;
}

function renderFirstAid() {
    const page = document.createElement('div');
    page.className = 'page firstaid-page page-scroll';

    page.innerHTML = `
    <h2>🩹 First Aid Guide</h2>
    <p style="margin-bottom: var(--space-lg); font-size: var(--font-sm);">Verified emergency instructions based on WHO & Red Cross guidelines.</p>
    
    <div class="firstaid-search">
      <div class="search-wrapper">
        <input type="text" class="search-input" id="firstaid-search-input" placeholder="Search first aid topics..." oninput="filterFirstAid(this.value)">
      </div>
    </div>

    <div class="firstaid-list" id="firstaid-list">
      <div class="empty-state">
        <div class="empty-state-icon">⏳</div>
        <div class="empty-state-text">Loading...</div>
      </div>
    </div>
  `;

    // Load data async
    setTimeout(async () => {
        const data = await loadFirstAidData();
        if (data) renderFirstAidList(data);
    }, 50);

    return page;
}

function renderFirstAidList(data, filter = '') {
    const container = document.getElementById('firstaid-list');
    if (!container) return;

    const entries = Object.entries(data);
    const filtered = filter
        ? entries.filter(([key, val]) =>
            val.title.toLowerCase().includes(filter.toLowerCase()) ||
            key.toLowerCase().includes(filter.toLowerCase())
        )
        : entries;

    if (filtered.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-text">No results found for "${filter}"</div>
      </div>
    `;
        return;
    }

    container.innerHTML = filtered.map(([key, item]) => `
    <div class="accordion-item" id="fa-${key}">
      <button class="accordion-header" onclick="toggleAccordion('fa-${key}')">
        <span class="accordion-icon">${item.icon}</span>
        <span>${item.title}</span>
        <span class="accordion-arrow">▼</span>
      </button>
      <div class="accordion-body">
        <div class="accordion-content">
          <div class="firstaid-steps">
            ${item.steps.map(step => `<div class="firstaid-step">${step}</div>`).join('')}
          </div>
          ${item.warnings ? item.warnings.map(w => `
            <div class="firstaid-warning">⚠️ ${w}</div>
          `).join('') : ''}
          ${item.whenToCallDoctor ? `
            <div style="margin-top: var(--space-md); padding: var(--space-md); background: var(--bg-glass); border-radius: var(--radius-md); font-size: var(--font-xs); color: var(--text-secondary);">
              🩺 ${item.whenToCallDoctor}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function filterFirstAid(value) {
    if (allFirstAidData) {
        renderFirstAidList(allFirstAidData, value);
    }
}

function toggleAccordion(id) {
    const item = document.getElementById(id);
    if (item) {
        item.classList.toggle('open');
    }
}
