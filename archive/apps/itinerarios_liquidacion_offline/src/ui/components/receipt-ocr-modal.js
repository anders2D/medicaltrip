/**
 * Medical Trip Colombia S.A.S. — Receipt OCR Modal UI Component
 * Simulates Camera OCR Scanning, Field Expense Extraction & Parsing, and Dexie Blob Storage.
 */

import { Money } from '../../domain/value-objects/money.js';
import { EXPENSE_CATEGORIES } from '../../domain/entities/expense-item.js';

export class ReceiptOcrModalComponent {
  /**
   * @param {HTMLElement} container
   * @param {import('../state/app-store.js').AppStore} store
   */
  constructor(container, store) {
    this.container = container;
    this.store = store;
    this._unsubscribe = null;

    this.sampleReceipts = [
      {
        id: 'cruz-verde',
        label: '💊 Droguería Cruz Verde ($85.000 COP)',
        text: 'DROGUERIAS CRUZ VERDE S.A.S.\nNIT 800.149.695-1\nTOTAL: $ 85.000 COP\nFECHA: 2026-09-02\nVigamox Solucion Oftalmica 5ml'
      },
      {
        id: 'pasteur',
        label: '💊 Farmacias Pasteur ($120.000 COP)',
        text: 'FARMACIAS PASTEUR\nNIT 890.900.231-4\nTOTAL: $ 120.000 COP\nFECHA: 2026-09-02\nCefalexina 500mg x 20 capsulas'
      },
      {
        id: 'taxi-jmc',
        label: '🚗 Taxis Aeropuerto JMC ($130.000 COP)',
        text: 'EMPRESA TAXIS AEROPUERTO RIONEGRO JMC\nNIT 811.023.456-9\nTOTAL: $ 130.000 COP\nCarrera Aeropuerto JMC -> El Poblado Medellin'
      },
      {
        id: 'echavarria',
        label: '🔬 Lab Echavarría ($125.000 COP)',
        text: 'LABORATORIO CLINICO ECHAVARRIA S.A.\nNIT 890.902.554-1\nTOTAL: $ 125.000 COP\nCuadro Hematico Completo + Tiempos Coagulacion'
      }
    ];

    this._currentOcrResult = null;
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
   * Renders Receipt OCR Scanner Modal.
   * @param {object} state
   */
  render(state) {
    const isActive = state.activeModal === 'OCR';
    const ctx = state.activeModalContext || {};
    const item = ctx.item || (state.itineraryItems || []).find((i) => i.id === ctx.itineraryItemId);

    if (!isActive) {
      this.container.innerHTML = '';
      return;
    }

    const cur = state.settlementBalance?.currency || 'COP';

    this.container.innerHTML = `
      <div class="modal-backdrop is-active" id="ocr-modal-backdrop">
        <div class="modal-dialog modal-lg" role="dialog" aria-modal="true" aria-labelledby="ocr-modal-title">
          
          <div class="modal-header">
            <div class="modal-title-group">
              <h3 id="ocr-modal-title">📷 Escaneo de Recibo OCR en Terreno</h3>
              <span class="modal-subtitle">Extracción automática de datos fiscales y gastos de bolsillo</span>
            </div>
            <button class="modal-close-btn" id="btn-close-ocr-modal" aria-label="Cerrar">&times;</button>
          </div>

          <div class="modal-body">
            
            <!-- Stop Context if opened from a stop -->
            ${
              item
                ? `<div style="background-color: var(--bg-surface-elevated); padding: 8px 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-card); font-size: 0.82rem;">
                    Asociando gasto a la parada: <strong>${item.title}</strong> (${item.clinicName || 'Terreno'})
                  </div>`
                : ''
            }

            <!-- Sample Receipt Selection / Input -->
            <div class="ocr-sample-selector">
              <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary);">
                Seleccionar Recibo de Prueba o Ingresar Texto:
              </label>
              <div style="display: flex; gap: var(--spacing-xs); flex-wrap: wrap;">
                ${this.sampleReceipts
                  .map(
                    (s) => `
                    <button class="btn btn-outline btn-sm btn-ocr-sample" data-id="${s.id}">
                      ${s.label}
                    </button>
                  `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Raw Text Area -->
            <div>
              <textarea id="ocr-raw-textarea" rows="3" placeholder="Pegar texto de recibo o factura escaneada..." style="font-family: var(--font-family-mono); font-size: 0.8rem;"></textarea>
            </div>

            <!-- OCR Extraction Result Card -->
            <div class="ocr-result-card" id="ocr-extraction-preview">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">
                  🧾 Campos Extraídos por OCR
                </span>
                <span class="badge badge-success" id="ocr-confidence-badge">96% Confianza</span>
              </div>

              <div class="ocr-fields-grid">
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">Establecimiento / Comercio:</span>
                  <input type="text" id="ocr-field-merchant" value="Droguerías Cruz Verde S.A.S." />
                </div>
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">Categoría de Rubro:</span>
                  <select id="ocr-field-category">
                    <option value="PHARMACY" selected>Farmacia y Medicamentos</option>
                    <option value="TAXI">Taxis y Traslados</option>
                    <option value="MEDICAL_LAB">Laboratorios Clínicos</option>
                    <option value="COMPANION_HOURLY">Acompañamiento Bilingüe</option>
                    <option value="OTHER">Otros Gastos Médicos</option>
                  </select>
                </div>
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">Monto Total (${cur}):</span>
                  <input type="number" id="ocr-field-amount" value="85000" class="tabular-nums" />
                </div>
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">Identificación Tributaria (NIT):</span>
                  <input type="text" id="ocr-field-taxid" value="NIT 800.149.695-1" />
                </div>
              </div>

              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted);">Descripción del Gasto:</span>
                <input type="text" id="ocr-field-description" value="Compra de medicamentos postoperatorios" />
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" id="btn-cancel-ocr">Cancelar</button>
            <button class="btn btn-primary" id="btn-confirm-ocr">
              💾 Registrar Gasto en Liquidación
            </button>
          </div>

        </div>
      </div>
    `;

    this._bindEvents(item, cur);
  }

  /**
   * Binds OCR parsing and expense saving events.
   * @private
   */
  _bindEvents(item, cur) {
    const backdrop = this.container.querySelector('#ocr-modal-backdrop');
    const closeBtn = this.container.querySelector('#btn-close-ocr-modal');
    const cancelBtn = this.container.querySelector('#btn-cancel-ocr');

    const handleClose = () => this.store.closeModal();
    if (closeBtn) closeBtn.addEventListener('click', handleClose);
    if (cancelBtn) cancelBtn.addEventListener('click', handleClose);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) handleClose();
      });
    }

    const textarea = this.container.querySelector('#ocr-raw-textarea');
    const merchantInput = this.container.querySelector('#ocr-field-merchant');
    const categorySelect = this.container.querySelector('#ocr-field-category');
    const amountInput = this.container.querySelector('#ocr-field-amount');
    const taxidInput = this.container.querySelector('#ocr-field-taxid');
    const descInput = this.container.querySelector('#ocr-field-description');

    const parseText = async (text) => {
      if (!text) return;
      const parsed = await this.store.simulateReceiptOcr(text);
      if (parsed) {
        if (merchantInput) merchantInput.value = parsed.establishmentName || '';
        if (categorySelect) categorySelect.value = parsed.category || 'OTHER';
        if (amountInput) amountInput.value = parsed.totalAmount ? parsed.totalAmount.amount : 0;
        if (taxidInput) taxidInput.value = parsed.taxId || '';
        if (descInput) descInput.value = `${parsed.establishmentName || 'Gasto'} - ${parsed.category || 'Consumo'}`;
      }
    };

    // Sample buttons
    this.container.querySelectorAll('.btn-ocr-sample').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const sample = this.sampleReceipts.find((s) => s.id === id);
        if (sample) {
          if (textarea) textarea.value = sample.text;
          parseText(sample.text);
        }
      });
    });

    if (textarea) {
      textarea.addEventListener('input', (e) => parseText(e.target.value));
    }

    // Confirm button
    const confirmBtn = this.container.querySelector('#btn-confirm-ocr');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        const merchant = merchantInput?.value || 'Comercio';
        const category = categorySelect?.value || 'OTHER';
        const amountNum = parseFloat(amountInput?.value || '0');
        const desc = descInput?.value || `${merchant} - ${category}`;

        try {
          const money = Money.fromAmount(amountNum, cur);
          await this.store.submitExpense({
            itineraryItemId: item?.id || null,
            category,
            description: desc,
            amount: money,
            actorId: 'ACT-GUIA-01',
            receiptBlob: textarea?.value || `${merchant} Recibo OCR`
          });
          this.store.closeModal();
        } catch (err) {
          console.error('[ReceiptOcrModal] Error saving expense:', err);
        }
      });
    }
  }
}
