/**
 * Medical Trip Hub — ROI Calculator & Meeting Notes Downloader
 */

export class RoiCalculator {
    static init() {
        const slider = document.getElementById('paxSlider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.updateCalculation(e.target.value);
            });
        }

        const downloadBtn = document.getElementById('btnDownloadNotes');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadMeetingNotes();
            });
        }
    }

    static updateCalculation(paxValue) {
        const pax = parseInt(paxValue, 10) || 15;
        const paxLabel = document.getElementById('paxCountLabel');
        if (paxLabel) paxLabel.innerText = `${pax} Pacientes`;

        // Fórmula financiera: $2,500 USD promedio por paquete con 30% margen bruto
        const revenue = pax * 2500;
        const margin = revenue * 0.30;

        const revEl = document.getElementById('calcRevenueUsd');
        const marginEl = document.getElementById('calcMarginUsd');

        if (revEl) revEl.innerText = `$${revenue.toLocaleString()} USD`;
        if (marginEl) marginEl.innerText = `$${margin.toLocaleString()} USD`;
    }

    static downloadMeetingNotes() {
        const notesArea = document.getElementById('meetingNotes');
        const text = (notesArea && notesArea.value) ? notesArea.value : '# Notas de Reunión Medical Trip Colombia S.A.S.\n- ';
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MedicalTrip_Meeting_Notes_${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
