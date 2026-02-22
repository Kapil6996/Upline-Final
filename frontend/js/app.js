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

// PWA Install prompt (on window for settings page access)
window.deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredInstallPrompt = e;
});

function installPWA() {
    if (window.deferredInstallPrompt) {
        window.deferredInstallPrompt.prompt();
        window.deferredInstallPrompt.userChoice.then((choice) => {
            if (choice.outcome === 'accepted') {
                showToast('✅ UPLINE installed successfully!');
            }
            window.deferredInstallPrompt = null;
        });
    } else {
        showToast('App may already be installed, or use browser menu → Add to Home Screen');
    }
}

// Badge toast: gold achievement notification
function showBadgeToast(badge) {
    const existing = document.querySelector('.toast-badge');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-badge';
    toast.innerHTML = `
        <div style="font-size:28px; margin-bottom:4px;">${badge.icon}</div>
        <div style="font-weight:700; letter-spacing:0.05em;">BADGE UNLOCKED</div>
        <div style="font-size:12px; opacity:0.85; margin-top:2px;">${badge.name}</div>
    `;
    toast.style.cssText = `
        position:fixed;
        bottom:90px;
        left:50%;
        transform:translateX(-50%) translateY(20px);
        background:linear-gradient(135deg,#7c5105,#b8860b);
        border:1px solid #ffc107;
        color:#fff;
        font-family:var(--font-display);
        border-radius:12px;
        padding:16px 24px;
        text-align:center;
        z-index:9999;
        box-shadow:0 0 30px rgba(255,193,7,0.4);
        opacity:0;
        transition:opacity 0.4s ease,transform 0.4s ease;
        min-width:180px;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// Check badge queue after each route change
function _checkBadgeQueue() {
    setTimeout(() => {
        const badge = Storage.popBadgeQueue();
        if (badge) {
            showBadgeToast(badge);
            if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
        }
    }, 600);
}

// Online/offline events (real network changes)
window.addEventListener('online', () => {
    if (localStorage.getItem('upline_forced_offline') !== 'true') {
        showToast('🟢 Back online');
        _updateNetworkPill(false);
    }
});
window.addEventListener('offline', () => showToast('🔴 You are offline — UPLINE still works!'));

// Network Mode Toggle — called from the dashboard status pill
function toggleNetworkMode() {
    const currentlyForced = localStorage.getItem('upline_forced_offline') === 'true';
    const goOffline = !currentlyForced;

    // Persist the chosen mode
    localStorage.setItem('upline_forced_offline', String(goOffline));

    // Tell the Service Worker to block / unblock external requests
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SET_OFFLINE_MODE',
            offline: goOffline
        });
    }

    // Update the pill immediately (no page reload)
    _updateNetworkPill(goOffline);

    showToast(goOffline
        ? '✈️ Offline Mode ON — network blocked'
        : '🌐 Online Mode — network restored'
    );
}

// Update the status pill in the DOM without a full re-render
function _updateNetworkPill(isOffline) {
    const btn = document.getElementById('network-toggle-btn');
    if (!btn) return;

    btn.className = `status-pill ${isOffline ? 'badge-offline-forced' : 'badge-online'}`;
    btn.title = isOffline ? 'Tap to go Online' : 'Tap to go Offline';
    btn.innerHTML = `
        <div class="status-dot" style="background: ${isOffline ? '#ef4444' : '#22c55e'}"></div>
        ${isOffline ? '✈️ Offline Mode' : '🌐 Online'}
    `;
}

// Listen for SW messages (e.g., state sync across tabs)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'OFFLINE_MODE_CHANGED') {
            _updateNetworkPill(event.data.offline);
        }
    });
}


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
    Router.register('/triage-chat', renderTriageChat);
    Router.register('/results', renderResults);
    Router.register('/firstaid', renderFirstAid);
    Router.register('/emergency', renderEmergency);
    Router.register('/hospitals', renderHospitals);
    Router.register('/network', renderNetwork);
    Router.register('/settings', renderSettings);
    Router.register('/map', renderMap);
    Router.register('/medical-id', renderMedicalId);
    Router.register('/vault', renderVault);

    // Initialize router — hook badge check on every navigation
    const _origHandleRoute = Router._handleRoute.bind(Router);
    Router._handleRoute = function () {
        _origHandleRoute();
        _checkBadgeQueue();
    };
    Router.init();

    // Hide splash after delay
    setTimeout(() => {
        hideSplash();
    }, 2000);

    // Register service worker — unregister any stale SW first
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const reg of registrations) {
                // If the SW is NOT the current sw.js or has an old cache, unregister it
                const swUrl = reg.active?.scriptURL || '';
                if (!swUrl.includes('sw.js')) {
                    await reg.unregister();
                }
            }
            const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
            console.log('Service Worker registered:', reg.scope);
            // Force the new SW to take control immediately
            if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            reg.addEventListener('updatefound', () => {
                const newSW = reg.installing;
                if (newSW) {
                    newSW.addEventListener('statechange', () => {
                        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                            newSW.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                }
            });
        } catch (e) {
            console.warn('Service Worker registration failed:', e);
        }
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
