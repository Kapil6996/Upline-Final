/* ===== Hospitals Page ===== */
function renderHospitals() {
    const page = document.createElement('div');
    page.className = 'page hospitals-page page-scroll';

    const isOnline = navigator.onLine;

    page.innerHTML = `
    <h2>🏨 Nearby Hospitals</h2>
    <p style="margin-bottom: var(--space-lg); font-size: var(--font-sm); color: var(--text-secondary);">
      ${isOnline ? 'Finding hospitals near your location...' : 'This feature requires internet connectivity.'}
    </p>

    <div id="hospitals-content">
      ${!isOnline ? `
        <div class="empty-state">
          <div class="empty-state-icon">📡</div>
          <div class="empty-state-text">You are currently offline.<br>Connect to the internet to find nearby hospitals.</div>
          <button class="btn btn-ghost" style="margin-top: var(--space-lg);" onclick="Router.navigate('/emergency')">
            🚑 View Emergency Numbers Instead
          </button>
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon" style="animation: spin 2s linear infinite;">⏳</div>
          <div class="empty-state-text">Locating nearby hospitals...</div>
        </div>
      `}
    </div>
  `;

    if (isOnline) {
        setTimeout(() => findNearbyHospitals(), 100);
    }

    return page;
}

async function findNearbyHospitals() {
    const container = document.getElementById('hospitals-content');
    if (!container) return;

    // Check geolocation
    if (!navigator.geolocation) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📍</div>
        <div class="empty-state-text">Geolocation is not supported by your browser.</div>
      </div>
    `;
        return;
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: false
            });
        });

        const { latitude, longitude } = position.coords;

        // Use Overpass API (OpenStreetMap) to find hospitals
        const radius = 5000; // 5km
        const query = `[out:json][timeout:10];(node["amenity"="hospital"](around:${radius},${latitude},${longitude});way["amenity"="hospital"](around:${radius},${latitude},${longitude}););out center body 10;`;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`
        });

        const data = await response.json();

        if (data.elements && data.elements.length > 0) {
            const hospitals = data.elements
                .map(el => {
                    const lat = el.lat || el.center?.lat;
                    const lon = el.lon || el.center?.lon;
                    const name = el.tags?.name || 'Hospital';
                    const addr = el.tags?.['addr:full'] || el.tags?.['addr:street'] || '';
                    const phone = el.tags?.phone || el.tags?.['contact:phone'] || '';
                    const dist = lat && lon ? getDistance(latitude, longitude, lat, lon) : null;

                    return { name, addr, phone, dist, lat, lon };
                })
                .filter(h => h.dist !== null)
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 10);

            renderHospitalCards(hospitals);
        } else {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏥</div>
          <div class="empty-state-text">No hospitals found within 5km.<br>Try calling 108 for ambulance services.</div>
          <button class="btn btn-danger" style="margin-top: var(--space-lg);" onclick="window.location.href='tel:108'">
            📞 Call 108
          </button>
        </div>
      `;
        }
    } catch (error) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📍</div>
        <div class="empty-state-text">Could not access your location.<br>Please enable location services and try again.</div>
        <button class="btn btn-ghost" style="margin-top: var(--space-lg);" onclick="Router.navigate('/emergency')">
          🚑 View Emergency Numbers
        </button>
      </div>
    `;
    }
}

function renderHospitalCards(hospitals) {
    const container = document.getElementById('hospitals-content');
    if (!container) return;

    container.innerHTML = hospitals.map(h => `
    <div class="hospital-card card">
      <div class="hospital-name">🏥 ${h.name}</div>
      ${h.addr ? `<div class="hospital-address">📍 ${h.addr}</div>` : ''}
      <div class="hospital-distance">📏 ${h.dist < 1 ? `${Math.round(h.dist * 1000)}m away` : `${h.dist.toFixed(1)}km away`}</div>
      <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-md);">
        ${h.phone ? `<a href="tel:${h.phone}" class="btn btn-sm btn-danger" style="text-decoration:none;">📞 Call</a>` : ''}
        <a href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}" target="_blank" class="btn btn-sm btn-teal" style="text-decoration:none;">🗺️ Directions</a>
      </div>
    </div>
  `).join('');
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
