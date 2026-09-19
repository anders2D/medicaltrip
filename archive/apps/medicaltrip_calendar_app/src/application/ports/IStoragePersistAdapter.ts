export interface StorageQuotaInfo {
  usedBytes: number;
  totalBytes: number;
  quotaPct: number;
}

export interface IStoragePersistAdapter {
  requestPersistentStorage(): Promise<boolean>;
  isStoragePersisted(): Promise<boolean>;
  getStorageQuota(): Promise<StorageQuotaInfo>;
}
