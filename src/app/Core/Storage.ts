import { Injectable } from '@angular/core';
import { Engine } from './Engine';
import { StorageAdapterClass } from './StorageAdapterClass';
import { eventBus, EventPayload } from './event-bus';

// Define StorageData type
type StorageData = {
  key: string;
  type: 'local' | 's3';
  value: Record<string, any>;
};

// Event data type for storage events
type StorageEventData = {
  key: string;
  type: 'local' | 's3';
  value?: Record<string, any>;
};

@Injectable({
  providedIn: 'root',
})
export class Storage {
  private items: Map<string, StorageData> = new Map();
  private engine: Engine;
  private adapter: StorageAdapterClass;

  constructor(engine: Engine, adapter: StorageAdapterClass) {
    this.engine = engine;
    this.adapter = adapter;
  }

  handleEvent(event: EventPayload): void {
    switch (event.type) {
      case 'storage.add': {
        const storageData: StorageEventData = event.data;
        const data: StorageData = {
          key: storageData.key,
          type: storageData.type,
          value: storageData.value || {},
        };
        this.adapter.create(data).then(success => {
          if (success) {
            this.items.set(data.key, data);
            this.engine.emit({ type: 'storage.added', data });
          } else {
            console.error(`Failed to add storage item with key ${data.key}`);
          }
        }).catch(error => {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Error adding storage item with key ${data.key}: ${message}`);
        });
        break;
      }

      case 'storage.delete': {
        const key: string = event.data.key;
        this.adapter.delete(key).then(success => {
          if (success) {
            this.items.delete(key);
            this.engine.emit({ type: 'storage.deleted', data: { key } });
          } else {
            console.error(`Failed to delete storage item with key ${key}`);
          }
        }).catch(error => {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Error deleting storage item with key ${key}: ${message}`);
        });
        break;
      }

      case 'storage.update': {
        const { key, properties }: { key: string; properties: Partial<Record<string, any>> } = event.data;
        this.adapter.update(key, properties).then(success => {
          if (success) {
            const existingItem = this.items.get(key);
            if (existingItem) {
              const updatedValue = { ...existingItem.value, ...properties };
              const updatedItem: StorageData = { ...existingItem, value: updatedValue };
              this.items.set(key, updatedItem);
              this.engine.emit({ type: 'storage.updated', data: { key, properties } });
            } else {
              console.error(`Storage item with key ${key} not found for update`);
            }
          } else {
            console.error(`Failed to update storage item with key ${key}`);
          }
        }).catch(error => {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Error updating storage item with key ${key}: ${message}`);
        });
        break;
      }

      case 'storage.exists': {
        const key: string = event.data.key;
        this.adapter.exists(key).then(exists => {
          this.engine.emit({ type: 'storage.existence', data: { key, exists } });
        }).catch(error => {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Error checking existence for storage item with key ${key}: ${message}`);
        });
        break;
      }

      default:
        console.warn(`Unhandled event type in Storage: ${event.type}`);
    }
  }


}