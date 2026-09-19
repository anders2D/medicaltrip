import { Money } from '@/core/domain';

export interface OCRParsedItem {
  readonly description: string;
  readonly amount: Money;
  readonly quantity?: number;
}

export interface OCRResult {
  readonly vendorName?: string;
  readonly vendorTaxId?: string;
  readonly totalAmount: Money;
  readonly total?: Money;
  readonly date?: string;
  readonly items: OCRParsedItem[];
  readonly rawText: string;
  readonly confidence: number;
}

export interface IOCRPort {
  recognizeReceipt(imageBlobOrDataUrl: Blob | string): Promise<OCRResult>;
}
