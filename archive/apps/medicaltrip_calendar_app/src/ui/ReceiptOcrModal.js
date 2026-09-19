export class ReceiptOcrModal {
    static render() {
        return `
            <div class="modal-backdrop" id="ocrModalBackdrop">
                <div class="modal-card" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <div class="modal-title">
                            <i class="fa-solid fa-receipt" style="color: var(--event-amber-badge);"></i>
                            <span>Escanear Ticket de Farmacia / Gasto OCR</span>
                        </div>
                        <button class="btn btn-sm" id="btnCloseOcrModal"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <div class="modal-body">
                        <p style="font-size: 0.82rem; color: var(--text-secondary);">
                            Sube o escanea el comprobante de Droguería (Cruz Verde / Locatel) para deducción automática en el ledger financiero.
                        </p>

                        <div style="border: 2px dashed var(--border-strong); border-radius: var(--radius-md); padding: 20px; text-align: center; background: var(--bg-surface-subtle);">
                            <i class="fa-solid fa-file-invoice-dollar" style="font-size: 2.2rem; color: var(--primary); margin-bottom: 8px;"></i>
                            <div style="font-size: 0.85rem; font-weight: 700;">Recibo Cruz Verde #84920</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Enoxaparina 40mg + Gotas Oftálmicas</div>
                            <div style="font-size: 1.1rem; font-weight: 800; color: var(--event-amber-badge); margin-top: 6px; font-family: var(--font-mono);">$65.000 COP</div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="ocrConcept">Concepto Extraído</label>
                            <input type="text" id="ocrConcept" class="form-input" value="Cruz Verde - Enoxaparina 40mg + Gotas">
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="ocrAmount">Monto COP</label>
                            <input type="number" id="ocrAmount" class="form-input" value="65000">
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn" id="btnCancelOcr">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btnConfirmOcr">
                            <i class="fa-solid fa-check"></i> Imputar a Caja Menor
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}
