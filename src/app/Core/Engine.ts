import { Display } from './Display';
import { Storage } from './Storage';
import { StorageAdapterClass } from './StorageAdapterClass';
import { EventEmitter } from './EventEmitter';
import { eventBus, EventPayload } from './event-bus';

// Interface for domains that can handle events
interface Domain {
  handleEvent(event: EventPayload): void;
}

export class Engine {
  private static instance: Engine | null = null;
  private display: Display | null = null;
  private storage: Storage | null = null;
  private domains: Domain[] = [];
  private events: EventEmitter;
  private config: any;
  private isInitialized: boolean = false;

  private constructor(config: any) {
    this.config = config || {};
    this.events = new EventEmitter();
  }

  static getInstance(config?: any): Engine {
    if (!Engine.instance) {
      Engine.instance = new Engine(config);
    }
    return Engine.instance;
  }

  // Initialize the engine and its components
  init(): void {
    if (this.isInitialized) return;

    // Initialize subsystems
    this.initDisplay();
    this.initStorage();

    // Subscribe to eventBus only after initialization
    eventBus.subscribe((ev: EventPayload) => {
      this.domains.forEach(domain => domain.handleEvent(ev));
    });

    this.isInitialized = true;
  }

  initDisplay(): void {
    if (!this.display) {
      this.display = new Display();
      console.log('Display initialized');
    }
  }

  initStorage(): void {
    if (!this.storage) {
      // Instantiate StorageAdapterClass without arguments, assuming it has a no-arg constructor
      const adapter = new StorageAdapterClass();
      this.storage = new Storage(adapter);
      console.log('Storage initialized');
    }
  }

  getDisplay(): Display | null {
    return this.display;
  }

  getStorage(): Storage | null {
    return this.storage;
  }

  getEvents(): EventEmitter {
    return this.events;
  }

  emit(event: EventPayload): void {
    if (!this.isInitialized) {
      console.warn('Engine not initialized. Call init() before emitting events.');
      return;
    }
    eventBus.next({ type: event.type, data: event.data });
  }

  saveProject(): void {
    console.log('Saving project...');
  }

  loadProject(): void {
    console.log('Loading project...');
  }

  // Method to register domains
  registerDomain(domain: Domain): void {
    this.domains.push(domain);
  }
}