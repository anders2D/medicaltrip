/**
 * Medical Trip Colombia S.A.S. — GPS Check-In Modal UI Component
 * Haversine Distance Verification, Geofence Radius Feedback, Interactive Coordinate Simulation.
 */

import { LocationCoordinate } from '../../domain/value-objects/location-coordinate.js';
import { KNOWN_OPERATIONAL_LOCATIONS } from '../../infrastructure/index.js';

export class GpsCheckinModalComponent {
  /**
   * @param {HTMLElement} container
   * @param {import('../state/app-store.js').AppStore} store
   */
  constructor(container, store) {
    this.container = container;
    this.store = store;
    this._unsubscribe = null;
    this._simulatedLat = 6.2088;
    this._simulatedLng = -75.5678;
  }

  mount() {
    this._unsubscribe = this.store.subscribe((state) => this.render(state));
  }

  destroy() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  }

  /**
   * Renders the GPS Check-In Modal.
   * @param {object} state
   */
  render(state) {
    const isActive = state.activeModal === 'GPS';
    const ctx = state.activeModalContext || {};
    const item = ctx.item || (state.itineraryItems || []).find((i) => i.id === ctx.itineraryItemId) || (state.itineraryItems || [])[0];

    if (!isActive) {
      this.container.innerHTML = '';
      return;
    }

    const targetLoc = item && item.location
      ? (item.location instanceof LocationCoordinate ? item.location : new LocationCoordinate(item.location))
      : new LocationCoordinate(KNOWN_OPERATIONAL_LOCATIONS.CLINICA_EL_ROSARIO_TESORO);

    // Initial simulated coords default to destination for easy testing, or current
    const currLoc = { lat: this._simulatedLat, lng: this._simulatedLng };
    const distanceMeters = Math.round(targetLoc.distanceTo(currLoc));
    const radiusMeters = targetLoc.geofenceRadiusMeters || 200;
    const isInside = distanceMeters <= radiusMeters;

    this.container.innerHTML = `
      <div class="modal-backdrop is-active" id="gps-modal-backdrop">
        <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="gps-modal-title">
          
          <div class="modal-header">
            <div class="modal-title-group">
              <h3 id="gps-modal-title">📍 Check-In GPS en Terreno</h3>
              <span class="modal-subtitle">Validación de geocerca geoespacial Haversine</span>
            </div>
            <button class="modal-close-btn" id="btn-close-gps-modal" aria-label="Cerrar">&times;</button>
          </div>

          <div class="modal-body">
            
            <!-- Target Stop Information -->
            <div class="gps-target-info">
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">
                ${item ? item.title : 'Destino Médico'}
              </div>
              <div style="font-size: 0.82rem; color: var(--color-primary-light);">
                🏥 ${targetLoc.name || item?.clinicName || 'Clínica Autorizada'}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-family-mono);">
                Destino: [${targetLoc.lat.toFixed(4)}, ${targetLoc.lng.toFixed(4)}] · Radio Geocerca: ${radiusMeters}m
              </div>
            </div>

            <!-- Interactive Coordinates Input / Simulator -->
            <div style="display: flex; flex-direction: column; gap: var(--spacing-xs);">
              <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">
                Coordenadas GPS Simuladas del Conductor / Guía:
              </label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">Latitud:</span>
                  <input type="number" id="gps-input-lat" step="0.0001" value="${this._simulatedLat.toFixed(4)}" class="tabular-nums" />
                </div>
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">Longitud:</span>
                  <input type="number" id="gps-input-lng" step="0.0001" value="${this._simulatedLng.toFixed(4)}" class="tabular-nums" />
                </div>
              </div>
            </div>

            <!-- Presets Buttons -->
            <div class="gps-presets-group">
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Ubicaciones Rápidas:</span>
              <div class="gps-presets-list">
                <button class="btn btn-outline btn-sm btn-gps-preset" data-lat="${targetLoc.lat}" data-lng="${targetLoc.lng}">
                  🎯 En la Clínica (0m)
                </button>
                <button class="btn btn-outline btn-sm btn-gps-preset" data-lat="6.2045" data-lng="-75.5732">
                  🏨 Hotel Poblado
                </button>
                <button class="btn btn-outline btn-sm btn-gps-preset" data-lat="6.1645" data-lng="-75.4278">
                  ✈️ Aeropuerto JMC
                </button>
              </div>
            </div>

            <!-- Haversine Distance Meter & Status -->
            <div class="gps-meter-container">
              <div class="gps-distance-display">
                <span>Distancia al Destino:</span>
                <span class="tabular-nums" style="color: ${isInside ? 'var(--color-success-light)' : 'var(--color-danger-light)'}">
                  ${distanceMeters} metros
                </span>
              </div>
              <div class="gps-geofence-status ${isInside ? 'is-inside' : 'is-outside'}">
                <span>${isInside ? '✅ DENTRO DE LA GEOCERCA' : '❌ FUERA DEL RADIO PERMITIDO'}</span>
                <span>(Máx. ${radiusMeters}m)</span>
              </div>
            </div>

            ${
              state.lastError && state.lastError.includes('GPS')
                ? `<div class="badge badge-danger" style="padding: 6px 10px; font-size: 0.8rem; text-transform: none;">
                    ${state.lastError}
                  </div>`
                : ''
            }

          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" id="btn-cancel-gps">Cancelar</button>
            <button class="btn btn-primary" id="btn-confirm-gps" ${!isInside ? 'disabled' : ''}>
              📍 Confirmar Llegada en Sitio
            </button>
          </div>

        </div>
      </div>
    `;

    this._bindEvents(item, targetLoc);
  }

  /**
   * Binds coordinate update and confirmation events.
   * @private
   */
  _bindEvents(item, targetLoc) {
    const backdrop = this.container.querySelector('#gps-modal-backdrop');
    const closeBtn = this.container.querySelector('#btn-close-gps-modal');
    const cancelBtn = this.container.querySelector('#btn-cancel-gps');

    const handleClose = () => this.store.closeModal();
    if (closeBtn) closeBtn.addEventListener('click', handleClose);
    if (cancelBtn) cancelBtn.addEventListener('click', handleClose);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) handleClose();
      });
    }

    // Input changes
    const latInput = this.container.querySelector('#gps-input-lat');
    const lngInput = this.container.querySelector('#gps-input-lng');

    const updateCoords = (lat, lng) => {
      this._simulatedLat = Number(lat);
      this._simulatedLng = Number(lng);
      this.render(this.store.getState());
    };

    if (latInput) {
      latInput.addEventListener('change', (e) => updateCoords(e.target.value, this._simulatedLng));
    }
    if (lngInput) {
      lngInput.addEventListener('change', (e) => updateCoords(this._simulatedLat, e.target.value));
    }

    // Preset buttons
    this.container.querySelectorAll('.btn-gps-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lat = btn.getAttribute('data-lat');
        const lng = btn.getAttribute('data-lng');
        updateCoords(lat, lng);
      });
    });

    // Confirm check-in button
    const confirmBtn = this.container.querySelector('#btn-confirm-gps');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (!item) return;
        try {
          await this.store.submitCheckIn(item.id, {
            lat: this._simulatedLat,
            lng: this._simulatedLng
          });
          this.store.closeModal();
        } catch (err) {
          console.error('[GpsModal] Check-in error:', err);
        }
      });
    }
  }
}
