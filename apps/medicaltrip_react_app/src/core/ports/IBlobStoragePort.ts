export interface BlobMetadata {
  readonly id: string;
  readonly bookingId: string;
  readonly mimeType: string;
  readonly category: 'RECEIPT' | 'SIGNATURE' | 'EXPORT_PDF';
  readonly createdAt: string;
}

export interface IBlobStoragePort {
  saveBlob(id: string, bookingId: string, mimeType: string, category: 'RECEIPT' | 'SIGNATURE' | 'EXPORT_PDF', data: Blob | ArrayBuffer | string): Promise<string>;
  getBlob(id: string): Promise<Blob | null>;
  getBlobDataUrl(id: string): Promise<string | null>;
  deleteBlob(id: string): Promise<void>;
  listBlobs?(bookingId?: string): Promise<BlobMetadata[]>;
}
