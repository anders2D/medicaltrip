import { Money } from '../../domain/values/Money';

export interface ParsedReceiptItem {
  description: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
}

export interface ParsedReceipt {
  receiptUuid: string;
  vendorName: string;
  taxId?: string; // NIT
  date: string;
  items: ParsedReceiptItem[];
  totalAmount: Money;
  confidenceScore: number;
  rawText: string;
}

export interface IReceiptOCRService {
  extractReceiptData(imageBlobOrBase64: Blob | string): Promise<ParsedReceipt>;
}
