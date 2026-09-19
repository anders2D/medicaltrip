import { describe, it, expect } from 'vitest';
import { ItemizedReceiptOCRAdapter } from '../../../src/infrastructure/ocr/ItemizedReceiptOCRAdapter';

describe('ItemizedReceiptOCRAdapter', () => {
  const adapter = new ItemizedReceiptOCRAdapter();

  it('parses Cruz Verde thermal ticket with line items and NIT', () => {
    const rawText = `
      DROGUERIA CRUZ VERDE ROBLEDO S.A.S.
      NIT: 800.149.695-1
      FECHA: 2026-08-20 15:30:00
      1x Ciprofloxacino 500mg x 10 Tabs     $28.500
      1x Gasas Esteriles y Solucion Salina  $16.500
      TOTAL COP: $45.000
    `;

    const parsed = adapter.parseReceiptText(rawText);
    expect(parsed.vendorName).toBe('Droguería Cruz Verde Robledo');
    expect(parsed.taxId).toBe('800.149.695-1');
    expect(parsed.date).toBe('2026-08-20');
    expect(parsed.totalAmount.amountInCents).toBe(4500000n); // $45.000 COP
    expect(parsed.items.length).toBeGreaterThanOrEqual(2);
    expect(parsed.confidenceScore).toBeGreaterThanOrEqual(0.9);
  });

  it('parses Pasteur pharmacy ticket accurately', () => {
    const rawText = `
      FARMACIA PASTEUR LAURELES
      NIT: 890.900.245-3
      FECHA: 2026-08-21
      1x Amoxicilina + Clavulanato 875mg    $42.000
      1x Analgesico Acetaminofen 1g         $23.000
      TOTAL COP: $65.000
    `;

    const parsed = adapter.parseReceiptText(rawText);
    expect(parsed.vendorName).toBe('Farmacia Pasteur Laureles');
    expect(parsed.taxId).toBe('890.900.245-3');
    expect(parsed.totalAmount.amountInCents).toBe(6500000n); // $65.000 COP
  });

  it('parses transit tunnel toll ticket', () => {
    const rawText = `
      CONCESION TUNEL DE ORIENTE S.A.S.
      NIT: 900.823.111-9
      FECHA: 2026-08-20
      1x Peaje Vehicular Categoria 1        $24.800
      TOTAL: $24.800
    `;

    const parsed = adapter.parseReceiptText(rawText);
    expect(parsed.vendorName).toBe('Peaje Túnel de Oriente');
    expect(parsed.totalAmount.amountInCents).toBe(2480000n); // $24.800 COP
  });

  it('falls back gracefully on unstructured noisy text without failing', () => {
    const noisyText = `Ticket no fiscal de prueba sin total`;
    const parsed = adapter.parseReceiptText(noisyText);
    expect(parsed.receiptUuid).toBeDefined();
    expect(parsed.totalAmount.amountInCents).toBeGreaterThan(0n);
    expect(parsed.items).toHaveLength(1);
  });
});
