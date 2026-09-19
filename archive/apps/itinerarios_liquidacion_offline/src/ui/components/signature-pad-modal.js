/**
 * Medical Trip Colombia S.A.S. — Patient Digital Signature Pad Modal UI Component
 * HTML5 Canvas Drawing, Bézier Smoothing, SVG/PNG Vector Export, Patient Acceptance.
 */

import { CanvasSignatureAdapter } from '../../infrastructure/index.js';
import { getArchetype } from '../../infrastructure/index.js';

export class SignaturePadModalComponent {
  /**
   * @param {HTMLElement} container
   * @param {import('../state/app-store.js').AppStore} store
   */
  constructor(container, store) {
    this.container = container;
    this.store = store;
    this._unsubscribe = null;
    this.adapter = new CanvasSignatureAdapter({
      width: 480,
      height: 200,
      strokeColor: '#0284C7',
      strokeWidth: 2.5
    });
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
   * Renders Signature Canvas Modal.
   * @param {object} state
   */
  render(state) {
    const isActive = state.activeModal === 'SIGNATURE';
    const ctx = state.activeModalContext || {};
    const item = ctx.item || (state.itineraryItems || []).find((i) => i.id === ctx.itineraryItemId) || (state.itineraryItems || [])[0];

    if (!isActive) {
      this.container.innerHTML = '';
      return;
    }

    const arch = getArchetype(state.activeArchetypeCode);
    const defaultSigner = arch ? arch.patientName : 'Paciente Titular';

    this.container.innerHTML = `
      <div class="modal-backdrop is-active" id="signature-modal-backdrop">
        <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="sig-modal-title">
          
          <div class="modal-header">
            <div class="modal-title-group">
              <h3 id="sig-modal-title">✍️ Firma Digital de Conformidad</h3>
              <span class="modal-subtitle">Aceptación y finalización de cita médica</span>
            </div>
            <button class="modal-close-btn" id="btn-close-sig-modal" aria-label="Cerrar">&times;</button>
          </div>

          <div class="modal-body">
            
            <div style="background-color: var(--bg-surface-elevated); padding: 10px 14px; border-radius: var(--radius-xs); border: 1px solid var(--border-card); font-size: 0.85rem;">
              <div style="font-weight: 700; color: var(--text-primary);">${item ? item.title : 'Cita Médica'}</div>
              <div style="color: var(--text-muted); font-size: 0.78rem;">${item?.clinicName || 'Clínica Especializada'} · ${item?.date || ''}</div>
            </div>

            <div>
              <label for="signer-name-input" style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">
                Nombre del Paciente / Firmante:
              </label>
              <input type="text" id="signer-name-input" value="${defaultSigner}" />
            </div>

            <!-- Canvas Container -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">
                  Dibujar Firma en Pantalla:
                </span>
                <span style="font-size: 0.72rem; color: var(--text-muted);">Táctil, Lápiz o Ratón</span>
              </div>

              <div class="signature-canvas-wrapper">
                <canvas id="patient-signature-canvas" width="480" height="200" class="signature-canvas-element"></canvas>
              </div>

              <div class="signature-controls-bar">
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="btn btn-outline btn-sm" id="btn-sig-clear">
                    🗑️ Borrar
                  </button>
                  <button type="button" class="btn btn-outline btn-sm" id="btn-sig-undo">
                    ↩️ Deshacer
                  </button>
                </div>
                <span id="sig-stroke-status" style="font-size: 0.75rem; color: var(--text-muted);">
                  0 trazos capturados
                </span>
              </div>
            </div>

            <p style="font-size: 0.72rem; color: var(--text-muted);">
              Al firmar, el paciente certifica la culminación satisfactoria del procedimiento / traslado y autoriza la liquidación financiera correspondiente.
            </p>

          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" id="btn-cancel-sig">Cancelar</button>
            <button class="btn btn-success" id="btn-confirm-sig">
              ✅ Guardar Firma y Completar Cita
            </button>
          </div>

        </div>
      </div>
    `;

    this._bindEvents(item);
  }

  /**
   * Binds canvas adapter and signature actions.
   * @private
   */
  _bindEvents(item) {
    const backdrop = this.container.querySelector('#signature-modal-backdrop');
    const closeBtn = this.container.querySelector('#btn-close-sig-modal');
    const cancelBtn = this.container.querySelector('#btn-cancel-sig');

    const handleClose = () => this.store.closeModal();
    if (closeBtn) closeBtn.addEventListener('click', handleClose);
    if (cancelBtn) cancelBtn.addEventListener('click', handleClose);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) handleClose();
      });
    }

    const canvasEl = this.container.querySelector('#patient-signature-canvas');
    const statusEl = this.container.querySelector('#sig-stroke-status');

    if (canvasEl) {
      this.adapter.attachCanvas(canvasEl);

      const updateStrokeCount = () => {
        if (statusEl) {
          const count = this.adapter.getStrokeCount();
          statusEl.textContent = `${count} trazo(s) capturado(s)`;
        }
      };

      canvasEl.addEventListener('pointerup', updateStrokeCount);

      const clearBtn = this.container.querySelector('#btn-sig-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.adapter.clear();
          updateStrokeCount();
        });
      }

      const undoBtn = this.container.querySelector('#btn-sig-undo');
      if (undoBtn) {
        undoBtn.addEventListener('click', () => {
          this.adapter.undo();
          updateStrokeCount();
        });
      }
    }

    const confirmBtn = this.container.querySelector('#btn-confirm-sig');
    const signerInput = this.container.querySelector('#signer-name-input');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (!item) return;

        const signerName = signerInput?.value || 'Paciente Titular';
        // Export SVG signature (or fallback generated svg if empty)
        let svgData = this.adapter.exportToSvg();
        if (this.adapter.isEmpty()) {
          // Generate a valid vector signature curve for simulation
          svgData = `<svg viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg"><path d="M 60 120 Q 180 40, 280 130 T 420 110" stroke="#0284C7" stroke-width="3" fill="none"/></svg>`;
        }

        try {
          await this.store.submitSignature(item.id, svgData, signerName);
          this.store.closeModal();
        } catch (err) {
          console.error('[SignatureModal] Error submitting signature:', err);
        }
      });
    }
  }
}
