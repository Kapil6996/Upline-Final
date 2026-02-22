/* ===== Settings Page ===== */
function renderSettings() {
    const page = document.createElement('div');
    page.className = 'page settings-page page-scroll';

    const settings = Storage.getSettings();
    const isDark = settings.theme === 'dark';
    const historyCount = Storage.getHistory().length;

    page.innerHTML = `
    <h2>⚙️ Settings</h2>

    <div class="settings-group">
      <div class="settings-group-title">Appearance</div>
      <div class="settings-item">
        <div class="settings-item-left">
          <span class="settings-item-icon">${isDark ? '🌙' : '☀️'}</span>
          <div>
            <div class="settings-item-label">Dark Mode</div>
            <div class="settings-item-desc">Easier on eyes in low light</div>
          </div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${isDark ? 'checked' : ''} onchange="toggleTheme(this.checked)" id="theme-toggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Language</div>
      <div class="settings-item" onclick="setSettingsLang('en-IN')" style="cursor:pointer;">
        <div class="settings-item-left">
          <span class="settings-item-icon">🇬🇧</span>
          <div>
            <div class="settings-item-label">English</div>
            <div class="settings-item-desc">Voice recognition language</div>
          </div>
        </div>
        <span style="color: ${settings.language === 'en-IN' ? 'var(--accent-primary)' : 'var(--text-muted)'}; font-size: 18px;">${settings.language === 'en-IN' ? '●' : '○'}</span>
      </div>
      <div class="settings-item" onclick="setSettingsLang('hi-IN')" style="cursor:pointer;">
        <div class="settings-item-left">
          <span class="settings-item-icon">🇮🇳</span>
          <div>
            <div class="settings-item-label">हिन्दी (Hindi)</div>
            <div class="settings-item-desc">हिन्दी में बोलें</div>
          </div>
        </div>
        <span style="color: ${settings.language === 'hi-IN' ? 'var(--accent-primary)' : 'var(--text-muted)'}; font-size: 18px;">${settings.language === 'hi-IN' ? '●' : '○'}</span>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Data</div>
      <div class="settings-item" style="cursor:pointer;" onclick="confirmClearHistory()">
        <div class="settings-item-left">
          <span class="settings-item-icon">🗑️</span>
          <div>
            <div class="settings-item-label">Clear Triage History</div>
            <div class="settings-item-desc">${historyCount} assessment${historyCount !== 1 ? 's' : ''} saved locally</div>
          </div>
        </div>
        <span style="color: var(--color-emergency);">→</span>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">About</div>
      <div class="settings-item">
        <div class="settings-item-left">
          <span class="settings-item-icon">ℹ️</span>
          <div>
            <div class="settings-item-label">About UPLINE</div>
            <div class="settings-item-desc">Privacy-first offline emergency triage</div>
          </div>
        </div>
      </div>
      <div class="settings-item">
        <div class="settings-item-left">
          <span class="settings-item-icon">📋</span>
          <div>
            <div class="settings-item-label">Data Sources</div>
            <div class="settings-item-desc">WHO, Indian Red Cross, AIIMS protocols</div>
          </div>
        </div>
      </div>
    </div>

    <div class="disclaimer-banner" style="margin-top: var(--space-lg);">
      ⚠️ <strong>Medical Disclaimer:</strong> UPLINE does NOT provide medical diagnosis. It offers first-aid guidance based on verified emergency protocols. Always consult a qualified doctor. No personal data leaves your device.
    </div>

    <div class="settings-version">
      UPLINE v1.0.0 — Made with ❤️ for India<br>
      © 2026 UPLINE. All rights reserved.
    </div>
  `;

    return page;
}

function toggleTheme(isDark) {
    const theme = isDark ? 'dark' : 'light';
    Storage.setTheme(theme);
    showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
}

function setSettingsLang(lang) {
    Storage.setLanguage(lang);
    // Re-render settings page to update radio buttons
    Router.navigate('/settings');
    showToast(lang === 'en-IN' ? '🇬🇧 English selected' : '🇮🇳 हिन्दी selected');
}

function confirmClearHistory() {
    if (confirm('Are you sure you want to clear all triage history? This cannot be undone.')) {
        Storage.clearHistory();
        showToast('🗑️ History cleared');
        Router.navigate('/settings');
    }
}
