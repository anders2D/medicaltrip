export class SettlementBalanceBar {
    static render(settlementData) {
        const {
            transportTotal,
            guideHoursTotal,
            guideHonoraryTotal,
            outOfPocketTotal,
            totalCuentaCobro,
            advanceTotal,
            netBalance,
            isAgentPayable
        } = settlementData;

        return `
            <div class="settlement-dock">
                <div class="settlement-kpi-group">
                    <div class="settlement-kpi-item">
                        <span class="kpi-label">🚗 Flota & Taxis</span>
                        <span class="kpi-value" style="color: var(--event-sky-text);">${transportTotal.format()}</span>
                    </div>
                    <div style="height: 24px; width: 1px; background: var(--border-subtle);"></div>
                    <div class="settlement-kpi-item">
                        <span class="kpi-label">⏱️ Horas Guía (${guideHoursTotal}h)</span>
                        <span class="kpi-value" style="color: var(--event-indigo-text);">${guideHonoraryTotal.format()}</span>
                    </div>
                    <div style="height: 24px; width: 1px; background: var(--border-subtle);"></div>
                    <div class="settlement-kpi-item">
                        <span class="kpi-label">💊 Farmacia & Caja Menor</span>
                        <span class="kpi-value" style="color: var(--event-amber-text);">${outOfPocketTotal.format()}</span>
                    </div>
                    <div style="height: 24px; width: 1px; background: var(--border-subtle);"></div>
                    <div class="settlement-kpi-item">
                        <span class="kpi-label">🏦 Anticipos Bancolombia</span>
                        <span class="kpi-value" style="color: var(--text-secondary);">${advanceTotal.format()}</span>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 14px;">
                    <div class="balance-pill ${isAgentPayable ? 'payable' : 'surplus'}">
                        <span>Saldo Neto:</span>
                        <span style="font-size: 1rem; font-family: var(--font-mono); font-weight: 800;">${netBalance.format()}</span>
                        <span style="font-size: 0.72rem; opacity: 0.85;">(${isAgentPayable ? 'Transferir a Guía' : 'A favor Medical Trip'})</span>
                    </div>

                    <button class="btn btn-sm" id="btnUploadReceipt" title="Subir ticket térmico de farmacia">
                        <i class="fa-solid fa-receipt" style="color: var(--event-amber-badge);"></i> Ticket OCR
                    </button>
                    <button class="btn btn-sm" id="btnSignOff" title="Firma de conformidad del paciente">
                        <i class="fa-solid fa-signature" style="color: var(--success);"></i> Firma Pax
                    </button>
                </div>
            </div>
        `;
    }
}
