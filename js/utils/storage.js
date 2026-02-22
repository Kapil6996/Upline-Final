/* ===== Local Storage Wrapper ===== */
const Storage = {
    PREFIX: 'upline_',

    get(key, fallback = null) {
        try {
            const raw = localStorage.getItem(this.PREFIX + key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
        } catch (e) {
            console.warn('Storage write failed:', e);
        }
    },

    remove(key) {
        localStorage.removeItem(this.PREFIX + key);
    },

    // --- Settings ---
    getSettings() {
        return this.get('settings', {
            theme: 'dark',
            language: 'en-IN',
            voiceEnabled: true
        });
    },

    saveSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this.set('settings', settings);
    },

    // --- Triage History ---
    getHistory() {
        return this.get('history', []);
    },

    addHistory(entry) {
        const history = this.getHistory();
        entry.id = Date.now();
        entry.timestamp = new Date().toISOString();
        history.unshift(entry);
        // Keep last 50 entries
        if (history.length > 50) history.pop();
        this.set('history', history);
        return entry;
    },

    clearHistory() {
        this.set('history', []);
    },

    // --- Theme ---
    getTheme() {
        return this.getSettings().theme || 'dark';
    },

    setTheme(theme) {
        this.saveSetting('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    },

    // --- Language ---
    getLanguage() {
        return this.getSettings().language || 'en-IN';
    },

    setLanguage(lang) {
        this.saveSetting('language', lang);
    }
};
