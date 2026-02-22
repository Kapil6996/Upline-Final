/* ===== Dashboard Page ===== */
function renderDashboard() {
    const history = Storage.getHistory();
    const isOnline = navigator.onLine;

    const page = document.createElement('div');
    page.className = 'page dashboard-page page-scroll';

    const historyHTML = history.length > 0
        ? history.slice(0, 5).map(h => {
            const urgInfo = TriageEngine.getUrgencyInfo(h.urgency);
            const colors = {
                EMERGENCY: 'var(--color-emergency)',
                URGENT: 'var(--color-urgent)',
                MODERATE: 'var(--color-moderate)',
                LOW: 'var(--color-low)'
            };
            const timeAgo = getTimeAgo(h.timestamp);
            return `
          <div class="history-item" onclick="viewHistoryItem(${h.id})">
            <div class="history-urgency-dot" style="background: ${colors[h.urgency] || 'var(--text-muted)'}"></div>
            <div class="history-info">
              <div class="history-symptoms">${h.symptoms || 'Unknown symptoms'}</div>
              <div class="history-time">${timeAgo}</div>
            </div>
            <span class="badge badge-${urgInfo.color} history-badge">${urgInfo.label}</span>
          </div>
        `;
        }).join('')
        : `<div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">No triage history yet.<br>Start a voice assessment to begin.</div>
       </div>`;

    page.innerHTML = `
    <div class="dashboard-header">
      <div class="dashboard-greeting">
        UPLINE
        <span>Your Emergency Triage Assistant</span>
      </div>
      <div class="status-pill badge-offline">
        <div class="status-dot" style="background: ${isOnline ? '#22c55e' : '#22c55e'}"></div>
        ${isOnline ? 'Online' : 'Offline Ready'}
      </div>
    </div>

    <div class="hero-card">
      <h2>🏥 Emergency? Speak Now.</h2>
      <p>Describe your symptoms by voice or text. Get instant triage assessment — even without internet.</p>
      <button class="btn btn-primary btn-lg" onclick="Router.navigate('/voice')" id="start-triage-btn">
        <span class="btn-icon">🎤</span> Start Voice Triage
      </button>
    </div>

    <div class="quick-actions">
      <div class="quick-action-card" onclick="Router.navigate('/voice')" id="qa-voice">
        <span class="quick-action-icon">🎙️</span>
        <div class="quick-action-label">Voice Triage</div>
        <div class="quick-action-desc">Speak symptoms</div>
      </div>
      <div class="quick-action-card" onclick="Router.navigate('/emergency')" id="qa-emergency">
        <span class="quick-action-icon">🚑</span>
        <div class="quick-action-label">Emergency</div>
        <div class="quick-action-desc">Quick call</div>
      </div>
      <div class="quick-action-card" onclick="Router.navigate('/firstaid')" id="qa-firstaid">
        <span class="quick-action-icon">🩹</span>
        <div class="quick-action-label">First Aid</div>
        <div class="quick-action-desc">Instructions</div>
      </div>
      <div class="quick-action-card" onclick="Router.navigate('/hospitals')" id="qa-hospitals">
        <span class="quick-action-icon">🏨</span>
        <div class="quick-action-label">Hospitals</div>
        <div class="quick-action-desc">Find nearby</div>
      </div>
    </div>

    <div class="disclaimer-banner">
      ⚠️ UPLINE provides first-aid guidance only. It does NOT diagnose diseases. Always consult a qualified doctor for medical advice.
    </div>

    <div class="section-header" style="margin-top: var(--space-xl)">
      <span class="section-title">Recent Assessments</span>
      ${history.length > 0 ? '<button class="section-action" onclick="Router.navigate(\'/settings\')">Clear</button>' : ''}
    </div>
    <div id="history-list">
      ${historyHTML}
    </div>
  `;

    return page;
}

function viewHistoryItem(id) {
    const history = Storage.getHistory();
    const item = history.find(h => h.id === id);
    if (item && item.resultData) {
        window._lastTriageResult = item.resultData;
        window._lastSymptoms = item.detectedSymptoms || [];
        window._lastInputText = item.symptoms || '';
        Router.navigate('/results');
    }
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return then.toLocaleDateString();
}
