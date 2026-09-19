/**
 * Medical Trip Colombia S.A.S. — Interactive Itinerary Timeline UI Component
 * Multi-Day Navigation, FSM Transition Triggers, Live Status Chips, Microinteractions.
 */

import { ITINERARY_STATUSES } from '../../domain/entities/itinerary-item.js';

export class ItineraryTimelineComponent {
  /**
   * @param {HTMLElement} container
   * @param {import('../state/app-store.js').AppStore} store
   */
  constructor(container, store) {
    this.container = container;
    this.store = store;
    this._unsubscribe = null;
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
   * Renders timeline day tabs and chronological stop cards.
   * @param {object} state
   */
  render(state) {
    const items = state.itineraryItems || [];
    const selectedDay = state.selectedDay;

    // Collect distinct days
    const daysSet = new Set(items.map((i) => i.dayNumber));
    const sortedDays = Array.from(daysSet).sort((a, b) => a - b);

    // Filter items according to selectedDay
    const visibleItems = selectedDay === 'ALL'
      ? items
      : items.filter((i) => i.dayNumber === Number(selectedDay));

    // Sort items chronologically by day and time window
    visibleItems.sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return (a.timeWindow || '').localeCompare(b.timeWindow || '');
    });

    const metrics = state.itineraryMetrics || {};

    this.container.innerHTML = `
      <div class="itinerary-timeline-wrapper" style="display: flex; flex-direction: column; gap: var(--spacing-md);">
        
        <!-- Header & Progress Metrics -->
        <div class="timeline-header-row" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--spacing-sm);">
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
              <span>🗓️</span> Cronograma de Terreno
            </h2>
            <p style="font-size: 0.8rem; color: var(--text-muted);">
              ${metrics.completed || 0} de ${metrics.total || items.length} paradas completadas (${metrics.progressPercentage || 0}%)
            </p>
          </div>
          
          <div style="display: flex; gap: 6px; align-items: center;">
            <button id="btn-quick-gps" class="btn btn-outline btn-sm" title="Simulador GPS">
              📍 GPS Global
            </button>
            <button id="btn-quick-ocr" class="btn btn-outline btn-sm" title="Escanear Recibo OCR">
              📷 OCR Gasto
            </button>
          </div>
        </div>

        <!-- Day Selector Tabs -->
        <div class="day-tabs-container" role="tablist">
          <button class="day-tab ${selectedDay === 'ALL' ? 'is-active' : ''}" data-day="ALL">
            Todos los Días <span class="day-tab-count">${items.length}</span>
          </button>
          ${sortedDays
            .map((d) => {
              const count = items.filter((i) => i.dayNumber === d).length;
              return `
              <button class="day-tab ${selectedDay === d ? 'is-active' : ''}" data-day="${d}">
                Día ${d} <span class="day-tab-count">${count}</span>
              </button>
            `;
            })
            .join('')}
        </div>

        <!-- Stops Stream -->
        <div class="timeline-stream">
          ${
            visibleItems.length === 0
              ? `<div class="card" style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                  <p>No hay citas programadas para este día.</p>
                </div>`
              : visibleItems.map((item, index) => this._renderStopCard(item, index)).join('')
          }
        </div>

      </div>
    `;

    this._bindEvents();
  }

  /**
   * Helper to render individual stop card HTML.
   * @private
   */
  _renderStopCard(item, index) {
    const status = item.status || 'PROGRAMADO';

    // Status Badge Variant
    let badgeClass = 'badge-info';
    let statusLabel = status;
    if (status === 'EN_CAMINO') {
      badgeClass = 'badge-warning';
      statusLabel = 'EN CAMINO 🚗';
    } else if (status === 'EN_SITIO') {
      badgeClass = 'badge-cyan';
      statusLabel = 'EN SITIO 📍';
    } else if (status === 'COMPLETADO') {
      badgeClass = 'badge-success';
      statusLabel = 'COMPLETADO ✓';
    } else if (status === 'CANCELADO') {
      badgeClass = 'badge-danger';
      statusLabel = 'CANCELADO ✗';
    }

    // Actor badges
    const actorsHtml = (item.assignedActorIds || [])
      .map((act) => {
        let chipClass = 'actor-chip';
        let actLabel = act;
        if (act.includes('DRV')) {
          chipClass += ' actor-chip-drv';
          actLabel = '🚗 Conductor';
        } else if (act.includes('GUIA')) {
          chipClass += ' actor-chip-guia';
          actLabel = '🗣️ Guía Bilingüe';
        } else if (act.includes('NURSE')) {
          chipClass += ' actor-chip-nurse';
          actLabel = '🩺 Enfermera';
        }
        return `<span class="${chipClass}">${actLabel}</span>`;
      })
      .join(' ');

    // Verification tags
    const gpsTag = item.requiresGpsCheckIn
      ? item.checkInTimestamp
        ? `<span class="verification-tag is-verified">📍 Check-In GPS: ${new Date(item.checkInTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`
        : `<span class="verification-tag is-pending">📍 Requiere Check-In GPS</span>`
      : '';

    const sigTag = item.requiresSignature
      ? item.signatureBlobId
        ? `<span class="verification-tag is-verified">✍️ Firma Digital OK</span>`
        : `<span class="verification-tag is-pending">✍️ Requiere Firma Paciente</span>`
      : '';

    // Action buttons based on status
    let actionButtonsHtml = '';
    if (status === 'PROGRAMADO') {
      actionButtonsHtml = `
        <button class="btn btn-warning btn-sm btn-fsm-action" data-action="START_TRANSIT" data-id="${item.id}">
          🚗 Iniciar Traslado
        </button>
      `;
    } else if (status === 'EN_CAMINO') {
      actionButtonsHtml = `
        <button class="btn btn-primary btn-sm btn-fsm-action" data-action="GPS_CHECKIN" data-id="${item.id}">
          📍 Check-In GPS
        </button>
      `;
    } else if (status === 'EN_SITIO') {
      actionButtonsHtml = `
        <button class="btn btn-success btn-sm btn-fsm-action" data-action="COMPLETE_SIGNATURE" data-id="${item.id}">
          ✍️ Firmar y Completar
        </button>
      `;
    }

    // Cancellation button
    const cancelBtnHtml = status !== 'COMPLETADO' && status !== 'CANCELADO'
      ? `<button class="btn btn-outline btn-sm btn-fsm-cancel" data-id="${item.id}" style="color: var(--text-muted); font-size: 0.78rem;">Cancelar</button>`
      : '';

    return `
      <div class="stop-card" data-id="${item.id}" data-status="${status}">
        <div class="stop-node-marker">${item.dayNumber}</div>
        
        <div class="stop-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="stop-time-badge">${item.timeWindow || 'Horario Flexible'}</span>
            <span class="badge ${badgeClass}">${statusLabel}</span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Día ${item.dayNumber} · ${item.date || ''}</span>
        </div>

        <div>
          <h3 class="stop-title">${item.title}</h3>
          <div class="stop-subtitle">
            ${item.clinicName ? `<span class="stop-clinic-pill">🏥 ${item.clinicName}</span>` : ''}
            ${item.specialty ? `<span>· ${item.specialty}</span>` : ''}
          </div>
          ${item.description ? `<p style="font-size: 0.85rem; margin-top: 4px;">${item.description}</p>` : ''}
        </div>

        <div class="stop-actors-group">
          ${actorsHtml}
        </div>

        <div class="stop-verifications-row">
          ${gpsTag}
          ${sigTag}
        </div>

        <div class="stop-actions-bar">
          <div class="fsm-action-group">
            ${actionButtonsHtml}
            ${cancelBtnHtml}
          </div>

          <div class="microinteraction-group">
            <button class="btn btn-outline btn-sm btn-trigger-gps" data-id="${item.id}" title="Ver Geocerca GPS">
              📍
            </button>
            <button class="btn btn-outline btn-sm btn-trigger-ocr" data-id="${item.id}" title="Asociar Recibo">
              📷
            </button>
            <button class="btn btn-outline btn-sm btn-trigger-sig" data-id="${item.id}" title="Firmar Paciente">
              ✍️
            </button>
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Binds click and interaction event listeners.
   * @private
   */
  _bindEvents() {
    // Day Tabs Click
    const tabs = this.container.querySelectorAll('.day-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const day = tab.getAttribute('data-day');
        this.store.setSelectedDay(day === 'ALL' ? 'ALL' : Number(day));
      });
    });

    // Quick Action Header Buttons
    const quickGps = this.container.querySelector('#btn-quick-gps');
    if (quickGps) {
      quickGps.addEventListener('click', () => this.store.openModal('GPS'));
    }
    const quickOcr = this.container.querySelector('#btn-quick-ocr');
    if (quickOcr) {
      quickOcr.addEventListener('click', () => this.store.openModal('OCR'));
    }

    // FSM Action Buttons
    const fsmBtns = this.container.querySelectorAll('.btn-fsm-action');
    fsmBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        const item = (this.store.getState().itineraryItems || []).find((i) => i.id === id);

        if (action === 'START_TRANSIT') {
          await this.store.transitionStatus(id, 'EN_CAMINO');
        } else if (action === 'GPS_CHECKIN') {
          this.store.openModal('GPS', { itineraryItemId: id, item });
        } else if (action === 'COMPLETE_SIGNATURE') {
          this.store.openModal('SIGNATURE', { itineraryItemId: id, item });
        }
      });
    });

    // Cancel Button
    const cancelBtns = this.container.querySelectorAll('.btn-fsm-cancel');
    cancelBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const reason = prompt('Motivo de cancelación:', 'Cancelado por solicitud del paciente / cambio de vuelo');
        if (reason) {
          await this.store.transitionStatus(id, 'CANCELADO', { cancellationReason: reason });
        }
      });
    });

    // Microinteraction Buttons
    this.container.querySelectorAll('.btn-trigger-gps').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = (this.store.getState().itineraryItems || []).find((i) => i.id === id);
        this.store.openModal('GPS', { itineraryItemId: id, item });
      });
    });

    this.container.querySelectorAll('.btn-trigger-ocr').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = (this.store.getState().itineraryItems || []).find((i) => i.id === id);
        this.store.openModal('OCR', { itineraryItemId: id, item });
      });
    });

    this.container.querySelectorAll('.btn-trigger-sig').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = (this.store.getState().itineraryItems || []).find((i) => i.id === id);
        this.store.openModal('SIGNATURE', { itineraryItemId: id, item });
      });
    });
  }
}
