/**
 * Medical Trip Colombia S.A.S. - SimulatedReceiptOCRAdapter
 * Heuristic and Pattern-Matching OCR Adapter for Pharmacy and Travel Receipts.
 * Complies with IOCRPort, extracts vendor metadata, NIT, itemized items, and deterministic BigInt totals.
 */

import { IOCRPort, OCRResult, OCRParsedItem } from '../domain/IOCRPort';
import { Money } from '@/core/domain';

export interface ReceiptPresetDefinition {
  readonly key: string;
  readonly name: string;
  readonly vendorName: string;
  readonly vendorTaxId: string;
  readonly totalCents: bigint;
  readonly category: 'PHARMACY' | 'TOLL' | 'CLINICAL_COPAYS' | 'PARKING' | 'MEAL_SUBSIDY' | 'OTHER';
  readonly date: string;
  readonly items: Array<{ description: string; amountCents: bigint; quantity?: number }>;
  readonly rawText: string;
}

export const KNOWN_RECEIPT_PRESETS: Record<string, ReceiptPresetDefinition> = {
  CRUZ_VERDE_ROBLEDO: {
    key: 'CRUZ_VERDE_ROBLEDO',
    name: 'Cruz Verde Robledo ($85.000)',
    vendorName: 'Droguerías Cruz Verde S.A.S.',
    vendorTaxId: '800.149.695-1',
    totalCents: 8500000n,
    category: 'PHARMACY',
    date: '2026-08-21',
    items: [
      { description: 'Gotas Oftálmicas Tobramicina 5ml', amountCents: 4500000n, quantity: 1 },
      { description: 'Suero Oral Electrolit Fresa 625ml', amountCents: 1750000n, quantity: 1 },
      { description: 'Omeprazol 20mg Cápsulas x 20', amountCents: 2250000n, quantity: 1 },
    ],
    rawText: `DROGUERIAS CRUZ VERDE S.A.S.
NIT: 800.149.695-1
SUCURSAL: ROBLEDO CL. 65 # 78-45 MEDELLIN
FECHA: 2026-08-21 11:34:12  FACTURA: FE-49821
---------------------------------------------
CANT  DESCRIPCION                     VALOR
 1    TOBRAMICINA 5ML GOTAS OFT.    $45.000
 1    ELECTROLIT FRESA 625ML        $17.500
 1    OMEPRAZOL 20MG CAP X 20       $22.500
---------------------------------------------
SUBTOTAL:                           $85.000
IVA 0%:                                  $0
TOTAL A PAGAR:                      $85.000 COP
FORMA PAGO: EFECTIVO / CAJA MENOR
GRACIAS POR SU COMPRA`,
  },
  PASTEUR_POBLADO: {
    key: 'PASTEUR_POBLADO',
    name: 'Farmacia Pasteur Poblado ($65.000)',
    vendorName: 'Farmacia Pasteur S.A.',
    vendorTaxId: '890.901.352-8',
    totalCents: 6500000n,
    category: 'PHARMACY',
    date: '2026-08-22',
    items: [
      { description: 'Suero Fisiológico 500ml', amountCents: 1800000n, quantity: 1 },
      { description: 'Paracetamol 500mg x 20 tab', amountCents: 1200000n, quantity: 1 },
      { description: 'Kit Gasas Estériles y Micropore', amountCents: 3500000n, quantity: 1 },
    ],
    rawText: `FARMACIA PASTEUR S.A.
NIT: 890.901.352-8
SEDE: EL POBLADO CR 43A # 7-50 MEDELLIN
FECHA: 2026-08-22 16:15:00  POS: 104-9923
---------------------------------------------
1  SUERO FISIOLOGICO 500ML          $18.000
1  PARACETAMOL 500MG TAB X 20       $12.000
1  KIT GASAS ESTERILES + MICROPORE  $35.000
---------------------------------------------
TOTAL:                              $65.000 COP
AUTORIZACION DIAN 187640001248`,
  },
  PEAJE_TUNEL_ORIENTE: {
    key: 'PEAJE_TUNEL_ORIENTE',
    name: 'Peaje Túnel de Oriente ($24.800)',
    vendorName: 'Concesión Túnel Aburrá Oriente S.A.S.',
    vendorTaxId: '811.009.774-2',
    totalCents: 2480000n,
    category: 'TOLL',
    date: '2026-08-20',
    items: [
      { description: 'Peaje Túnel de Oriente - Categoría 1', amountCents: 2480000n, quantity: 1 },
    ],
    rawText: `CONCESION TUNEL ABURRA ORIENTE S.A.S.
NIT: 811.009.774-2
ESTACION: PEAJE SEMINARIO KM 3+500
FECHA: 2026-08-20 09:12:44
CATEGORIA: I (AUTOMOVIL / SEDAN)
VALOR PEAJE:                        $24.800
IVA INCLUIDO 0%
TOTAL:                              $24.800 COP
CONSERVE ESTE TIQUETE PARA RECLAMOS`,
  },
  CIMA_COPAGO: {
    key: 'CIMA_COPAGO',
    name: 'CIMA Diagnóstica Copago ($180.000)',
    vendorName: 'CIMA Diagnóstica Especializada S.A.S.',
    vendorTaxId: '900.321.654-9',
    totalCents: 18000000n,
    category: 'CLINICAL_COPAYS',
    date: '2026-08-21',
    items: [
      { description: 'Copago Ecografía Abdomen Total de Alta Resolución', amountCents: 18000000n, quantity: 1 },
    ],
    rawText: `CIMA DIAGNOSTICA ESPECIALIZADA S.A.S.
NIT: 900.321.654-9
SEDE: EL POBLADO CLL 7 SUR # 42-70 MEDELLIN
FECHA: 2026-08-21 14:20:10  RECIBO CAJA: RC-7731
PACIENTE: CATIA RODRIGUES (EXTRANJERO)
---------------------------------------------
COD  CONCEPTO                         VALOR
881  ECOGRAFIA ABDOMEN TOTAL ALTA RES $180.000
---------------------------------------------
TOTAL COPAGO PACIENTE:              $180.000 COP
ESTADO: PAGADO CON TARJETA DE DEBITO`,
  },
  HPTU_MEDICAMENTOS: {
    key: 'HPTU_MEDICAMENTOS',
    name: 'Hospital Pablo Tobón Uribe ($125.000)',
    vendorName: 'Hospital Pablo Tobón Uribe',
    vendorTaxId: '890.903.048-1',
    totalCents: 12500000n,
    category: 'PHARMACY',
    date: '2026-08-23',
    items: [
      { description: 'Ciprofloxacino 500mg x 10', amountCents: 6500000n, quantity: 1 },
      { description: 'Tramadol Clorhidrato 50mg Gotas', amountCents: 4000000n, quantity: 1 },
      { description: 'Apósito Quirúrgico Post-Op', amountCents: 2000000n, quantity: 1 },
    ],
    rawText: `HOSPITAL PABLO TOBON URIBE
NIT: 890.903.048-1
FARMACIA AMBULATORIA ROBLEDO
FECHA: 2026-08-23 10:05:32  FACTURA: HPTU-99201
---------------------------------------------
1  CIPROFLOXACINO 500MG TAB X 10     $65.000
1  TRAMADOL CLORHIDRATO GOTAS 50MG   $40.000
1  APOSITO QUIRURGICO POST-OP        $20.000
---------------------------------------------
VALOR TOTAL MEDICAMENTOS:           $125.000 COP
DESPACHADO POR: REGENTE DE FARMACIA HPTU`,
  },
};

export class SimulatedReceiptOCRAdapter implements IOCRPort {
  /**
   * Parse an image Blob, text data URL, or text string into an itemized OCRResult
   */
  public async recognizeReceipt(imageBlobOrDataUrl: Blob | string): Promise<OCRResult> {
    let rawText = '';

    if (typeof imageBlobOrDataUrl === 'string') {
      if (imageBlobOrDataUrl.startsWith('data:')) {
        // If it is a data URL, check for preset key in the URL or default to a standard extraction
        const presetKey = this.extractPresetKeyFromDataUrl(imageBlobOrDataUrl);
        if (presetKey && KNOWN_RECEIPT_PRESETS[presetKey]) {
          rawText = KNOWN_RECEIPT_PRESETS[presetKey].rawText;
        } else {
          // Decode simple base64 text payload if applicable, or fallback
          rawText = this.decodeDataUrlToText(imageBlobOrDataUrl);
        }
      } else {
        // Direct text or preset key string
        const trimmed = imageBlobOrDataUrl.trim();
        if (KNOWN_RECEIPT_PRESETS[trimmed]) {
          rawText = KNOWN_RECEIPT_PRESETS[trimmed].rawText;
        } else {
          rawText = trimmed;
        }
      }
    } else if (imageBlobOrDataUrl instanceof Blob) {
      if (imageBlobOrDataUrl.type.includes('text') || imageBlobOrDataUrl.type.includes('json')) {
        rawText = await imageBlobOrDataUrl.text();
      } else {
        // For image binary blobs, check if any preset matches the blob size or synthesize realistic scan
        rawText = this.synthesizeTextFromBlob(imageBlobOrDataUrl);
      }
    }

    if (!rawText || rawText.trim().length === 0) {
      rawText = KNOWN_RECEIPT_PRESETS.CRUZ_VERDE_ROBLEDO.rawText;
    }

    const parsed = this.parseReceiptTextHeuristically(rawText);
    return {
      ...parsed,
      total: parsed.totalAmount,
    };
  }

  /**
   * Alias method for direct parsing of receipt raw text or blobs
   */
  public async parseReceipt(
    fileOrBlobOrString: Blob | ArrayBuffer | string,
    _mimeType?: string,
    simulatedRawText?: string
  ): Promise<OCRResult & { total: Money }> {
    if (simulatedRawText) {
      const parsed = this.parseReceiptTextHeuristically(simulatedRawText);
      return { ...parsed, total: parsed.totalAmount };
    }
    if (typeof fileOrBlobOrString === 'string') {
      const parsed = this.parseReceiptTextHeuristically(fileOrBlobOrString);
      return { ...parsed, total: parsed.totalAmount };
    }
    const blob = fileOrBlobOrString instanceof Blob ? fileOrBlobOrString : new Blob([fileOrBlobOrString]);
    const res = await this.recognizeReceipt(blob);
    return { ...res, total: res.totalAmount };
  }

  /**
   * Heuristic Parser: extracts vendor, NIT, date, line items, and total amount
   */
  public parseReceiptTextHeuristically(text: string): OCRResult {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

    let vendorName: string | undefined;
    let vendorTaxId: string | undefined;
    let dateStr: string | undefined;
    let totalMoney: Money | undefined;
    const items: OCRParsedItem[] = [];

    // 1. Check known presets first for exact match
    for (const preset of Object.values(KNOWN_RECEIPT_PRESETS)) {
      if (
        text.toLowerCase().includes(preset.vendorName.toLowerCase()) ||
        text.includes(preset.vendorTaxId)
      ) {
        vendorName = preset.vendorName;
        vendorTaxId = preset.vendorTaxId;
        dateStr = preset.date;
        break;
      }
    }

    // 2. Vendor Name Detection if not found in preset
    if (!vendorName && lines.length > 0) {
      for (const line of lines.slice(0, 4)) {
        if (
          /DROGUER[IÍ]A|FARMACIA|HOSPITAL|CL[IÍ]NICA|LABORATORIO|CONCESI[OÓ]N|PEAJE|DISTRIBUIDORA|CIMA|CRUZ VERDE|PASTEUR/i.test(
            line
          )
        ) {
          vendorName = line;
          break;
        }
      }
      if (!vendorName) {
        vendorName = lines[0]; // First line fallback
      }
    }

    // 3. NIT / Tax ID Regex Detection
    const nitRegex = /NIT[:\s.]*(\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?\d|\d{9,10})/i;
    const nitMatch = text.match(nitRegex);
    if (nitMatch) {
      vendorTaxId = nitMatch[1].replace(/\s+/g, '');
    }

    // 4. Date Regex Detection (YYYY-MM-DD or DD/MM/YYYY)
    const dateRegex = /\b(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})\b/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      dateStr = dateMatch[1];
    }

    // 5. Total Detection Regex (look for lines with TOTAL / TOTAL A PAGAR / VALOR TOTAL)
    const totalLineRegex = /(?:TOTAL|TOTAL\s+A\s+PAGAR|VALOR\s+TOTAL|VALOR\s+COP|IMPORTE\s+TOTAL)[:\s]*\$?\s*([\d.,]+)/i;
    for (const line of lines) {
      const match = line.match(totalLineRegex);
      if (match) {
        const rawNum = this.cleanNumericString(match[1]);
        if (rawNum > 0) {
          totalMoney = Money.fromAmount(rawNum, 'COP');
          break;
        }
      }
    }

    // 6. Item lines detection
    for (const line of lines) {
      // Ignore header/footer lines
      if (
        /NIT|FECHA|FACTURA|SUBTOTAL|TOTAL|IVA|FORMA PAGO|GRACIAS|AUTORIZACION|SEDE|SUCURSAL|CONCESION|ESTACION/i.test(
          line
        )
      ) {
        continue;
      }

      // Pattern: [optional qty] Description [$] Amount
      const itemRegex = /^(?:(\d+)\s+)?(.+?)\s+\$?\s*([\d.,]{3,12})$/;
      const match = line.match(itemRegex);
      if (match) {
        const qty = match[1] ? parseInt(match[1], 10) : 1;
        const desc = match[2].trim();
        const amtVal = this.cleanNumericString(match[3]);
        if (amtVal > 0 && desc.length > 2) {
          items.push({
            description: desc,
            quantity: qty,
            amount: Money.fromAmount(amtVal, 'COP'),
          });
        }
      }
    }

    // If total not found from explicit line, sum itemized items
    if (!totalMoney) {
      if (items.length > 0) {
        let sum = Money.zero('COP');
        for (const item of items) {
          sum = sum.add(item.amount);
        }
        totalMoney = sum;
      } else {
        totalMoney = Money.fromAmount(85000, 'COP'); // Standard fallback
      }
    }

    // If no items were parsed but we have a total, create a single line item
    if (items.length === 0) {
      items.push({
        description: vendorName ? `Consumo en ${vendorName}` : 'Gasto de Farmacia / Suministros Médicos',
        quantity: 1,
        amount: totalMoney,
      });
    }

    // Compute heuristic confidence score (0.70 to 0.99)
    let score = 0.5;
    if (vendorName) score += 0.15;
    if (vendorTaxId) score += 0.15;
    if (dateStr) score += 0.1;
    if (items.length > 0) score += 0.1;
    const confidence = Math.min(0.99, Math.max(0.7, score));

    return {
      vendorName,
      vendorTaxId,
      totalAmount: totalMoney,
      date: dateStr || new Date().toISOString().split('T')[0],
      items,
      rawText: text,
      confidence,
    };
  }

  /**
   * Helper to clean formatted Colombian currency string into standard number
   * e.g. "85.000" -> 85000, "180,000" -> 180000
   */
  private cleanNumericString(str: string): number {
    const cleaned = str.replace(/[^\d.,]/g, '');
    if (cleaned.includes('.') && cleaned.includes(',')) {
      // e.g. 1.250,50
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    }
    if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      if (parts[parts.length - 1].length === 3) {
        // Thousands separator e.g. "85.000"
        return parseFloat(cleaned.replace(/\./g, ''));
      }
      return parseFloat(cleaned);
    }
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      if (parts[parts.length - 1].length === 3) {
        return parseFloat(cleaned.replace(/,/g, ''));
      }
      return parseFloat(cleaned.replace(',', '.'));
    }
    return parseFloat(cleaned) || 0;
  }

  private extractPresetKeyFromDataUrl(dataUrl: string): string | null {
    for (const key of Object.keys(KNOWN_RECEIPT_PRESETS)) {
      if (dataUrl.toUpperCase().includes(key)) {
        return key;
      }
    }
    return null;
  }

  private decodeDataUrlToText(dataUrl: string): string {
    try {
      const parts = dataUrl.split(',');
      if (parts.length > 1) {
        return atob(parts[1]);
      }
    } catch {
      // If not base64 text, fallback to default Cruz Verde
    }
    return KNOWN_RECEIPT_PRESETS.CRUZ_VERDE_ROBLEDO.rawText;
  }

  private synthesizeTextFromBlob(blob: Blob): string {
    // Check size or name hint
    if (blob.size === 85000 || blob.size % 2 === 0) {
      return KNOWN_RECEIPT_PRESETS.CRUZ_VERDE_ROBLEDO.rawText;
    }
    return KNOWN_RECEIPT_PRESETS.PASTEUR_POBLADO.rawText;
  }
}
