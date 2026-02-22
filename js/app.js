/* ===== UPLINE App — Main Entry Point ===== */

// Toast helper
function showToast(message, duration = 2500) {
    // Remove any existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// PWA Install prompt
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
});

function installPWA() {
    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choice) => {
            if (choice.outcome === 'accepted') {
                showToast('✅ UPLINE installed!');
            }
            deferredInstallPrompt = null;
        });
    }
}

// Online/offline events
window.addEventListener('online', () => showToast('🟢 Back online'));
window.addEventListener('offline', () => showToast('🔴 You are offline — UPLINE still works!'));

// App initialization
async function initApp() {
    // Apply saved theme
    const theme = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Show splash
    const splashEl = renderSplash();
    document.body.appendChild(splashEl);

    // Pre-load data
    try {
        await Promise.all([
            SymptomEngine.init(),
            TriageEngine.init()
        ]);
    } catch (e) {
        console.warn('Pre-load warning:', e);
    }

    // Register routes
    Router.register('/dashboard', renderDashboard);
    Router.register('/voice', renderVoice);
    Router.register('/results', renderResults);
    Router.register('/firstaid', renderFirstAid);
    Router.register('/emergency', renderEmergency);
    Router.register('/hospitals', renderHospitals);
    Router.register('/settings', renderSettings);

    // Initialize router
    Router.init();

    // Hide splash after delay
    setTimeout(() => {
        hideSplash();
    }, 2000);

    // Register service worker
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker registered:', reg.scope);
        } catch (e) {
            console.warn('Service Worker registration failed:', e);
        }
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
