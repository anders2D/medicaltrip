import { IOCRPort } from '../../domain/ports/ocr-port.js';
import { Money } from '../../domain/value-objects/money.js';
import { DomainError } from '../../domain/errors/domain-error.js';

/**
 * Mock Receipt OCR Scanner Hardware Adapter.
 * Simulates mobile camera receipt scanning and text parsing for Colombian medical tourism expenses.
 * Parses invoices, tickets, copayments, pharmacy receipts, lab bills, and driver fees.
 */
export class MockOCRAdapter extends IOCRPort {
  constructor() {
    super();

    /** @type {Map<string, object>} */
    this._customTemplates = new Map();

    // Default predefined receipts database for realistic matching
    this._predefinedReceipts = [
      {
        keyword: 'cruz verde',
        establishmentName: 'Droguerías Cruz Verde S.A.S.',
        taxId: 'NIT 800.149.695-1',
        category: 'PHARMACY',
        defaultAmountCents: 8500000n,
        currency: 'COP',
        items: [
          { description: 'Vigamox Solución Oftálmica 5ml', quantity: 1, totalCents: 6200000n },
          { description: 'Gasas estériles y micropore', quantity: 2, totalCents: 2300000n }
        ]
      },
      {
        keyword: 'pasteur',
        establishmentName: 'Farmacias Pasteur',
        taxId: 'NIT 890.900.231-4',
        category: 'PHARMACY',
        defaultAmountCents: 12000000n,
        currency: 'COP',
        items: [
          { description: 'Cefalexina 500mg x 20 cápsulas', quantity: 1, totalCents: 4500000n },
          { description: 'Ibuprofeno 800mg + Gel Frío', quantity: 1, totalCents: 7500000n }
        ]
      },
      {
        keyword: 'aeropuerto',
        establishmentName: 'Empresa Taxis Aeropuerto Rionegro JMC',
        taxId: 'NIT 811.023.456-9',
        category: 'TAXI',
        defaultAmountCents: 13000000n,
        currency: 'COP',
        items: [
          { description: 'Carrera Aeropuerto JMC -> El Poblado Medellín', quantity: 1, totalCents: 11500000n },
          { description: 'Peaje Túnel de Oriente', quantity: 1, totalCents: 1500000n }
        ]
      },
      {
        keyword: 'echavarria',
        establishmentName: 'Laboratorio Clínico Echavarría S.A.',
        taxId: 'NIT 890.902.554-1',
        category: 'MEDICAL_LAB',
        defaultAmountCents: 12500000n,
        currency: 'COP',
        items: [
          { description: 'Cuadro Hemático Completo + Tiempos Coagulación', quantity: 1, totalCents: 7500000n },
          { description: 'Prueba Creatinina y Glicemia', quantity: 1, totalCents: 5000000n }
        ]
      },
      {
        keyword: 'clofan',
        establishmentName: 'Clínica Clofán Oftalmología',
        taxId: 'NIT 800.089.712-3',
        category: 'OTHER',
        defaultAmountCents: 25000000n,
        currency: 'COP',
        items: [
          { description: 'Copago Procedimiento Diagnóstico Tomografía Corneal', quantity: 1, totalCents: 25000000n }
        ]
      },
      {
        keyword: 'cardio vid',
        establishmentName: 'Clínica Cardio VID',
        taxId: 'NIT 890.901.123-5',
        category: 'MEDICAL_LAB',
        defaultAmountCents: 35000000n,
        currency: 'COP',
        items: [
          { description: 'Ecocardiograma Transtorácico Doppler Color', quantity: 1, totalCents: 35000000n }
        ]
      }
    ];
  }

  /**
   * Registers a custom mock OCR template for specific simulation fixtures.
   * @param {string} keyword
   * @param {object} extractionResult
   */
  registerMockTemplate(keyword, extractionResult) {
    if (!keyword || typeof keyword !== 'string') {
      throw new DomainError('[Mock OCR] keyword es obligatorio.');
    }
    this._customTemplates.set(keyword.toLowerCase().trim(), extractionResult);
  }

  /**
   * Parses simulated receipt data (text string, base64, or blob).
   * @param {Blob | Uint8Array | string | object} imageBlobOrBase64
   * @returns {Promise<{
   *   totalAmount: Money,
   *   category: 'TAXI' | 'COMPANION_HOURLY' | 'PHARMACY' | 'MEDICAL_LAB' | 'OTHER',
   *   establishmentName: string,
   *   taxId: string,
   *   date: string,
   *   rawText: string,
   *   confidence: number,
   *   items: Array<{ description: string, quantity: number, total: Money }>
   * }>}
   */
  async parseReceipt(imageBlobOrBase64) {
    if (!imageBlobOrBase64) {
      throw new DomainError('[Mock OCR] Entrada de recibo vacía o inválida.');
    }

    let rawInputText = '';

    if (typeof imageBlobOrBase64 === 'string') {
      rawInputText = imageBlobOrBase64;
    } else if (imageBlobOrBase64 && typeof imageBlobOrBase64 === 'object' && imageBlobOrBase64.rawText) {
      rawInputText = imageBlobOrBase64.rawText;
    } else if (imageBlobOrBase64 instanceof Uint8Array) {
      try {
        rawInputText = new TextDecoder().decode(imageBlobOrBase64.slice(0, 500));
      } catch {
        rawInputText = 'FACTURA_SIMULADA';
      }
    } else {
      rawInputText = 'FACTURA_FARMACIA_CRUZ_VERDE';
    }

    const lowerText = rawInputText.toLowerCase();

    // 1. Check custom templates
    for (const [key, template] of this._customTemplates) {
      if (lowerText.includes(key)) {
        return this._formatResult(template, rawInputText);
      }
    }

    // 2. Check predefined receipts
    for (const p of this._predefinedReceipts) {
      if (lowerText.includes(p.keyword)) {
        const parsedAmount = this._extractAmountFromText(rawInputText, p.currency) || Money.fromCents(p.defaultAmountCents, p.currency);
        return {
          totalAmount: parsedAmount,
          category: p.category,
          establishmentName: p.establishmentName,
          taxId: p.taxId,
          date: this._extractDateFromText(rawInputText) || new Date().toISOString().split('T')[0],
          rawText: this._generateSimulatedRawText(p, parsedAmount),
          confidence: 0.96,
          items: p.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            total: Money.fromCents(it.totalCents, p.currency)
          }))
        };
      }
    }

    // 3. Heuristic dynamic parsing
    return this._heuristicParse(rawInputText);
  }

  /**
   * Heuristic fallback parsing when no template matches.
   * @private
   */
  _heuristicParse(text) {
    const lower = text.toLowerCase();

    // Category detection
    let category = 'OTHER';
    if (/cruz verde|farmacia|pasteur|drogueria|cafam|medicamento|gotas|colirio|gasas|pastillas/i.test(lower)) {
      category = 'PHARMACY';
    } else if (/taxi|aeropuerto|transporte|peaje|carrera|conductor|uber|traslado/i.test(lower)) {
      category = 'TAXI';
    } else if (/laboratorio|echavarria|sangre|hemograma|ecografia|tomografia|muestras/i.test(lower)) {
      category = 'MEDICAL_LAB';
    } else if (/acompanamiento|guia|traductor|enfermeria|cuidadora|turno/i.test(lower)) {
      category = 'COMPANION_HOURLY';
    }

    // Currency detection
    let currency = 'COP';
    if (/usd|\$us|dolares|dollars/i.test(lower)) {
      currency = 'USD';
    }

    // Amount extraction
    const amount = this._extractAmountFromText(text, currency) || Money.fromAmount(45000, currency);

    // Date extraction
    const date = this._extractDateFromText(text) || new Date().toISOString().split('T')[0];

    // Merchant name extraction
    let establishmentName = 'Comercio Local Medellín';
    if (category === 'PHARMACY') establishmentName = 'Droguería Cruz Verde';
    else if (category === 'TAXI') establishmentName = 'Servicio de Taxi';
    else if (category === 'MEDICAL_LAB') establishmentName = 'Laboratorio Clínico Echavarría';
    else if (category === 'COMPANION_HOURLY') establishmentName = 'Servicios de Acompañamiento Bilingüe';

    return {
      totalAmount: amount,
      category,
      establishmentName,
      taxId: 'NIT 900.123.456-7',
      date,
      rawText: text || `RECIBO SIMULADO - ${establishmentName} - TOTAL: ${amount.format()}`,
      confidence: 0.88,
      items: [
        {
          description: `Servicio / Producto ${establishmentName}`,
          quantity: 1,
          total: amount
        }
      ]
    };
  }

  /**
   * Extracts monetary amount using regex patterns.
   * @private
   */
  _extractAmountFromText(text, currency) {
    if (!text) return null;

    // Matches $ 85.000, 85,000, 85000, $150.50
    const patterns = [
      /(?:total|valor|monto|monto total|pagado|neto)?\s*[:$]?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{2})?)/i,
      /\$\s*([0-9]+(?:[.,][0-9]+)?)/,
      /([0-9]{4,10})\s*(?:cop|pesos)/i,
      /([0-9]+(?:\.[0-9]{2})?)\s*(?:usd|dolares)/i
    ];

    for (const pat of patterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        let cleanStr = match[1].trim();
        // Determine whether dot or comma is thousands separator
        if (cleanStr.includes('.') && cleanStr.includes(',')) {
          // e.g. 120.000,00 -> 120000.00
          cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
        } else if (cleanStr.includes('.')) {
          // If 3 digits after dot, thousands separator
          const parts = cleanStr.split('.');
          if (parts.length > 1 && parts[parts.length - 1].length === 3) {
            cleanStr = cleanStr.replace(/\./g, '');
          }
        } else if (cleanStr.includes(',')) {
          const parts = cleanStr.split(',');
          if (parts.length > 1 && parts[parts.length - 1].length === 3) {
            cleanStr = cleanStr.replace(/,/g, '');
          } else {
            cleanStr = cleanStr.replace(',', '.');
          }
        }

        const num = parseFloat(cleanStr);
        if (!isNaN(num) && num > 0) {
          return Money.fromAmount(num, currency);
        }
      }
    }

    return null;
  }

  /**
   * Extracts date string (YYYY-MM-DD) from raw text.
   * @private
   */
  _extractDateFromText(text) {
    if (!text) return null;
    const match = text.match(/(202[0-9]-[0-1][0-9]-[0-3][0-9])|([0-3][0-9]\/[0-1][0-9]\/202[0-9])/);
    if (match) {
      if (match[1]) return match[1];
      if (match[2]) {
        const parts = match[2].split('/');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return null;
  }

  /**
   * Helper to format custom template result.
   * @private
   */
  _formatResult(template, rawText) {
    const cur = template.currency || 'COP';
    const amount =
      template.totalAmount instanceof Money
        ? template.totalAmount
        : typeof template.amountCents === 'bigint' || typeof template.amountCents === 'number'
        ? Money.fromCents(template.amountCents, cur)
        : Money.fromAmount(template.amount || 50000, cur);

    return {
      totalAmount: amount,
      category: template.category || 'OTHER',
      establishmentName: template.establishmentName || template.merchant || 'Comercio Autorizado',
      taxId: template.taxId || 'NIT 900.000.000-1',
      date: template.date || new Date().toISOString().split('T')[0],
      rawText: rawText || `FACTURA: ${template.establishmentName}`,
      confidence: template.confidence || 0.98,
      items: Array.isArray(template.items)
        ? template.items.map((i) => ({
            description: i.description || 'Item',
            quantity: i.quantity || 1,
            total: i.total instanceof Money ? i.total : Money.fromCents(i.totalCents || 0n, cur)
          }))
        : [{ description: 'Consumo General', quantity: 1, total: amount }]
    };
  }

  /**
   * Generates simulated realistic receipt printout text.
   * @private
   */
  _generateSimulatedRawText(fixture, total) {
    return `
========================================
       ${fixture.establishmentName}
       ${fixture.taxId}
       Medellín, Antioquia - Colombia
========================================
FECHA: ${new Date().toISOString().split('T')[0]}  HORA: 14:30:15
AUTORIZACIÓN DIAN No. 18764000123456
----------------------------------------
DESCRIPCIÓN             CANT      TOTAL
${fixture.items
  .map(
    (i) =>
      `${i.description.slice(0, 22).padEnd(23)} ${i.quantity}  ${Money.fromCents(i.totalCents, total.currency).format()}`
  )
  .join('\n')}
----------------------------------------
TOTAL A PAGAR:          ${total.format()}
FORMA DE PAGO:          EFECTIVO / CASH
========================================
     ¡Gracias por su compra!
========================================
`.trim();
  }
}
