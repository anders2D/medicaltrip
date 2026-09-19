export interface StorageEstimate {
  readonly quotaBytes?: number;
  readonly usageBytes?: number;
  readonly percentageUsed?: number;
}

export interface IStoragePersistPort {
  requestPersistence(): Promise<boolean>;
  isPersisted(): Promise<boolean>;
  getStorageEstimate(): Promise<StorageEstimate>;
  touchHeartbeat(): Promise<void>;
}
