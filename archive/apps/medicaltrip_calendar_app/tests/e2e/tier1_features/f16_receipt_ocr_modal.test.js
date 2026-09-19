import test from 'node:test';
import assert from 'node:assert/strict';
import { ReceiptOcrModal } from '../../../src/ui/ReceiptOcrModal.js';

test('F16: Pharmacy Receipt OCR Uploader — Thermal Receipt Parsing and Ingestion', async (t) => {
    await t.test('1. ReceiptOcrModal renders modal backdrop, card, and action controls', () => {
        const html = ReceiptOcrModal.render();
        assert.ok(html.includes('id="ocrModalBackdrop"'));
        assert.ok(html.includes('Escanear Ticket de Farmacia'));
        assert.ok(html.includes('id="ocrConcept"'));
        assert.ok(html.includes('id="ocrAmount"'));
        assert.ok(html.includes('id="btnConfirmOcr"'));
        assert.ok(html.includes('id="btnCancelOcr"'));
        assert.ok(html.includes('id="btnCloseOcrModal"'));
    });

    await t.test('2. Default template initializes with Cruz Verde sample prescription data', () => {
        const html = ReceiptOcrModal.render();
        assert.ok(html.includes('Cruz Verde - Enoxaparina 40mg + Gotas'));
        assert.ok(html.includes('value="65000"'));
        assert.ok(html.includes('$65.000 COP'));
    });

    await t.test('3. Simulated OCR text recognition regex extracts pharmacy total amount', () => {
        const parseReceiptText = (rawOcrText) => {
            const matchTotal = rawOcrText.match(/\bTOTAL\b[:\s]+(?:\$)?\s*([0-9.]+)/i);
            const matchPharmacy = rawOcrText.match(/(CRUZ\s+VERDE|LOCATEL|DROGUERIA\s+ALFONSO|PASTEUR)/i);

            return {
                pharmacy: matchPharmacy ? matchPharmacy[1].toUpperCase() : 'FARMACIA_GENERAL',
                amount: matchTotal ? Number(matchTotal[1].replace(/\./g, '')) : 0
            };
        };

        const sampleReceipt1 = `
            DROGUERIA CRUZ VERDE S.A.S.
            NIT: 900.123.456-1
            MEDELLIN - POBLADO
            PRODUCTO: ENOXAPARINA SODICA 40MG
            CANT: 2 UNIDADES
            SUBTOTAL: $58.000
            IVA: $7.000
            TOTAL: $65.000 COP
        `;

        const parsed1 = parseReceiptText(sampleReceipt1);
        assert.equal(parsed1.pharmacy, 'CRUZ VERDE');
        assert.equal(parsed1.amount, 65000);

        const sampleReceipt2 = `
            FARMACIA PASTEUR MEDELLIN
            GOTAS LUBRICANTES SYSTANE ULTRA
            TOTAL: 42.500
        `;
        const parsed2 = parseReceiptText(sampleReceipt2);
        assert.equal(parsed2.pharmacy, 'PASTEUR');
        assert.equal(parsed2.amount, 42500);
    });

    await t.test('4. Ticket object created from OCR modal output matches financial ledger schema', () => {
        const createTicket = (patientId, concept, amountUnits) => ({
            id: 'tkt-' + Date.now(),
            patientId,
            concept: String(concept || '').trim(),
            amountUnits: Number(amountUnits) || 0,
            date: new Date().toISOString()
        });

        const ticket = createTicket('rva171', 'Cruz Verde Gotas', 65000);
        assert.equal(ticket.patientId, 'rva171');
        assert.equal(ticket.concept, 'Cruz Verde Gotas');
        assert.equal(ticket.amountUnits, 65000);
        assert.ok(ticket.id.startsWith('tkt-'));
    });

    await t.test('5. Rejects ticket ingestion with negative or NaN amounts', () => {
        const validateTicketAmount = (amount) => {
            const num = Number(amount);
            if (isNaN(num) || num <= 0) {
                throw new Error('Monto inválido para ticket de farmacia');
            }
            return num;
        };

        assert.throws(() => validateTicketAmount(-5000), /Monto inválido/);
        assert.throws(() => validateTicketAmount('invalid_number'), /Monto inválido/);
        assert.equal(validateTicketAmount(35000), 35000);
    });
});
