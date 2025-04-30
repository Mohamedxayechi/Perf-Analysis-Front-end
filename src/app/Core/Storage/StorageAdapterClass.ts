import { Injectable } from '@angular/core';
import { LocalStorage } from './LocalStorage';
import { S3Storage } from './S3Storage';

type StorageInstance = {
  type: string;
  create(data: { key: string; type: string; value: Record<string, any> }): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  update(key: string, properties: Partial<Record<string, any>>): Promise<boolean>;
  get(key: string): Promise<{ key: string; type: string; value: Record<string, any> }>;
};

@Injectable({
  providedIn: 'root',
})
export class StorageAdapterClass {
  private storageRegistry: Map<string, () => StorageInstance>;

  constructor() {
    this.storageRegistry = new Map<string, () => StorageInstance>([
      ['local', () => new LocalStorage()],
      ['s3', () => new S3Storage()],
    ]);
  }

  private getStorageInstance(type: string): StorageInstance {
    const factory = this.storageRegistry.get(type);
    if (!factory) {
      throw new Error(`Unsupported storage type: ${type}`);
    }
    return factory();
  }

  async create(data: { key: string; type: string; value: Record<string, any> }): Promise<boolean> {
    const storage = this.getStorageInstance(data.type);
    return storage.create(data);
  }

  async delete(key: string): Promise<boolean> {
    const storage = this.getStorageInstance('local');
    return storage.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const storage = this.getStorageInstance('local');
    return storage.exists(key);
  }

  async update(key: string, properties: Partial<Record<string, any>>): Promise<boolean> {
    const storage = this.getStorageInstance('local');
    return storage.update(key, properties);
  }

  async get(key: string): Promise<{ key: string; type: string; value: Record<string, any> }> {
    const storage = this.getStorageInstance('local');
    return storage.get(key);
  }
}