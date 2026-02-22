/* ===== Results Page ===== */
function renderResults() {
    const page = document.createElement('div');
    page.className = 'page results-page page-scroll';

    const result = window._lastTriageResult;
    const symptoms = window._lastSymptoms || [];
    const inputText = window._lastInputText || '';

    if (!result) {
        page.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-text">No assessment data.<br>Start a voice triage first.</div>
        <button class="btn btn-primary" style="margin-top: var(--space-lg);" onclick="Router.navigate('/voice')">🎤 Start Triage</button>
      </div>
    `;
        return page;
    }

    const urgInfo = TriageEngine.getUrgencyInfo(result.urgency);
    const isEmergency = result.urgency === 'EMERGENCY';

    const symptomsHTML = symptoms.length > 0
        ? symptoms.map(s => `<span class="symptom-chip">🔹 ${s.name}</span>`).join('')
        : '<span class="symptom-chip">No specific symptoms detected</span>';

    const actionsHTML = result.actions
        .map((action, i) => `
      <div class="action-item">
        <div class="action-number">${i + 1}</div>
        <div class="action-text">${action}</div>
      </div>
    `).join('');

    const firstAidHTML = result.firstAid ? `
    <div class="results-section">
      <h3>📋 First Aid: ${result.firstAid.title}</h3>
      <div class="firstaid-steps">
        ${result.firstAid.steps.map(step => `<div class="firstaid-step">${step}</div>`).join('')}
      </div>
      ${result.firstAid.warnings ? result.firstAid.warnings.map(w => `
        <div class="firstaid-warning">⚠️ ${w}</div>
      `).join('') : ''}
      ${result.firstAid.whenToCallDoctor ? `
        <div style="margin-top: var(--space-md); padding: var(--space-md); background: var(--bg-glass); border-radius: var(--radius-md); font-size: var(--font-sm); color: var(--text-secondary);">
          🩺 <strong>When to call doctor:</strong> ${result.firstAid.whenToCallDoctor}
        </div>
      ` : ''}
    </div>
  ` : '';

    page.innerHTML = `
    <button class="btn btn-ghost" onclick="Router.navigate('/dashboard')" style="margin-bottom: var(--space-lg);">
      ← Back to Dashboard
    </button>

    <div class="results-urgency-card ${urgInfo.color}">
      <div class="results-urgency-icon">${urgInfo.icon}</div>
      <div class="results-urgency-level" style="color: var(--color-${urgInfo.color})">${urgInfo.label}</div>
      <div class="results-urgency-desc">${urgInfo.message}</div>
    </div>

    ${isEmergency ? `
      <a href="tel:108" class="btn btn-danger btn-block btn-lg results-call-btn" id="call-108-btn" style="text-decoration:none; margin-bottom: var(--space-xl);">
        📞 Call 108 — Ambulance NOW
      </a>
    ` : ''}

    <div class="results-section">
      <h3>🔍 Detected Symptoms</h3>
      <div style="padding: var(--space-sm) 0;">
        ${symptomsHTML}
      </div>
      ${inputText ? `<p style="font-size: var(--font-xs); color: var(--text-muted); margin-top: var(--space-sm); font-style: italic;">"${inputText}"</p>` : ''}
    </div>

    <div class="results-section">
      <h3>✅ Recommended Actions</h3>
      ${actionsHTML}
    </div>

    ${firstAidHTML}

    <div class="disclaimer-banner" style="margin-top: var(--space-lg);">
      ⚠️ This is NOT a medical diagnosis. UPLINE provides first-aid guidance only. Always consult a qualified medical professional.
    </div>

    <div class="voice-actions" style="margin-top: var(--space-lg);">
      <button class="btn btn-ghost btn-block" onclick="Router.navigate('/emergency')">🚑 Emergency Contacts</button>
      <button class="btn btn-primary btn-block" onclick="Router.navigate('/voice')">🎤 New Assessment</button>
    </div>
  `;

    return page;
}
