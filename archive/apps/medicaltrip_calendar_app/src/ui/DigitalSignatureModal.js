export class DigitalSignatureModal {
    static render(patientName = 'Catia Rodrigues') {
        return `
            <div class="modal-backdrop" id="sigModalBackdrop">
                <div class="modal-card" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <div class="modal-title">
                            <i class="fa-solid fa-signature" style="color: var(--success);"></i>
                            <span>Firma Digital de Conformidad (${patientName})</span>
                        </div>
                        <button class="btn btn-sm" id="btnCloseSigModal"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <div class="modal-body">
                        <p style="font-size: 0.82rem; color: var(--text-secondary);">
                            Certificación de horas de acompañamiento bilingüe y traslados ejecutados en terreno.
                        </p>

                        <div style="background: white; border: 2px solid var(--border-strong); border-radius: var(--radius-md); height: 130px; display: flex; align-items: center; justify-content: center; position: relative;">
                            <canvas id="sigCanvas" width="400" height="120" style="width: 100%; height: 100%; cursor: crosshair;"></canvas>
                            <div style="position: absolute; bottom: 8px; right: 12px; font-size: 0.7rem; color: var(--text-muted);">
                                ✍️ Firma en pantalla o con touchpad
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <button type="button" class="btn btn-sm" id="btnClearSig">
                                <i class="fa-solid fa-eraser"></i> Limpiar
                            </button>
                            <button type="button" class="btn btn-sm" id="btnAutoSig" style="color: var(--primary);">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> Simular Firma
                            </button>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn" id="btnCancelSig">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btnConfirmSig" style="background: var(--success); border-color: var(--success);">
                            <i class="fa-solid fa-check-double"></i> Certificar Turno
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}
