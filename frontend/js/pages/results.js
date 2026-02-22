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
        <button class="btn btn-primary" style="margin-top:var(--space-lg);" onclick="Router.navigate('/voice')">🎤 Start Triage</button>
      </div>
    `;
    return page;
  }

  const urgInfo = TriageEngine.getUrgencyInfo(result.urgency);
  const isEmergency = result.urgency === 'EMERGENCY';
  const isUrgent = result.urgency === 'URGENT';

  const symptomsHTML = symptoms.length > 0
    ? symptoms.map(s => `<span class="symptom-chip">◈ ${s.name}</span>`).join('')
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
        <div class="firstaid-warning">⚠ ${w}</div>
      `).join('') : ''}
      ${result.firstAid.whenToCallDoctor ? `
        <div style="margin-top:var(--space-md);padding:var(--space-md);background:var(--bg-glass);border-radius:var(--radius-md);font-size:var(--font-sm);color:var(--text-secondary);">
          🩺 <strong>When to call doctor:</strong> ${result.firstAid.whenToCallDoctor}
        </div>
      ` : ''}
    </div>
  ` : '';

  // Build share text
  const shareText = `UPLINE Triage Result\n\nUrgency: ${urgInfo.label}\nSymptoms: ${symptoms.map(s => s.name).join(', ') || inputText}\n\nActions:\n${result.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n⚠ This is NOT a medical diagnosis. Always consult a doctor.`;

  page.innerHTML = `
    <button class="btn btn-ghost" onclick="Router.navigate('/dashboard')" style="margin-bottom:var(--space-lg);">
      ← Back
    </button>

    <div class="results-urgency-card ${urgInfo.color}">
      <div class="results-urgency-icon">${urgInfo.icon}</div>
      <div class="results-urgency-level" style="color:var(--color-${urgInfo.color === 'low' ? 'low' : urgInfo.color})">${urgInfo.label}</div>
      <div class="results-urgency-desc">${urgInfo.message}</div>
    </div>

    ${isEmergency ? `
      <a href="tel:108" class="btn btn-danger btn-block btn-lg results-call-btn" id="call-108-btn" style="text-decoration:none; margin-bottom:var(--space-md);" onclick="if(navigator.vibrate) navigator.vibrate([200,100,200])">
        📞 Call 108 — Ambulance NOW
      </a>
      <a href="tel:112" class="btn btn-ghost btn-block" style="text-decoration:none; margin-bottom:var(--space-xl); font-family:var(--font-display); letter-spacing:0.05em;">
        📞 Call 112 — National Emergency
      </a>
    ` : isUrgent ? `
      <a href="tel:108" class="btn btn-danger btn-block" style="text-decoration:none; margin-bottom:var(--space-xl);" onclick="if(navigator.vibrate) navigator.vibrate(100)">
        📞 Call 108 if Worsening
      </a>
    ` : ''}

    <div class="results-section">
      <h3>Detected Symptoms</h3>
      <div style="padding:var(--space-sm) 0;">
        ${symptomsHTML}
      </div>
      ${inputText ? `<p style="font-size:var(--font-xs);color:var(--text-muted);margin-top:var(--space-sm);font-style:italic;">"${inputText}"</p>` : ''}
    </div>

    <div class="results-section">
      <h3>✅ Recommended Actions</h3>
      ${actionsHTML}
    </div>

    ${firstAidHTML}

    <div class="disclaimer-banner" style="margin-top:var(--space-lg);">
      ⚠ This is NOT a medical diagnosis. UPLINE provides first-aid guidance only. Always consult a qualified medical professional.
    </div>

    <!-- Share & Action Row -->
    <div style="display:flex; flex-direction:column; gap:var(--space-md); margin-top:var(--space-xl);">
      ${navigator.share ? `
        <button class="btn btn-ghost btn-block" onclick="shareResult('${encodeURIComponent(shareText)}')" id="share-btn">
          ↑ Share Assessment
        </button>
      ` : ''}
      <div style="display:flex; gap:var(--space-md);">
        <button class="btn btn-ghost btn-block" onclick="Router.navigate('/emergency')">🚑 Emergency Contacts</button>
        <button class="btn btn-primary btn-block" onclick="Router.navigate('/voice')">🎤 New Assessment</button>
      </div>
    </div>
  `;

  return page;
}

function shareResult(encodedText) {
  const text = decodeURIComponent(encodedText);
  if (navigator.share) {
    navigator.share({
      title: 'UPLINE Triage Result',
      text: text
    }).catch(() => { });
  }
}
