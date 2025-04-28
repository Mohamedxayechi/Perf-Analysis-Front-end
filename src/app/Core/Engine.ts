import { Display } from './Display';
import { Storage } from './Storage';
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

  private constructor(config: any) {
    this.config = config || {};
    this.events = new EventEmitter();
    // Subscribe to eventBus and forward events to all domains
    eventBus.subscribe((ev: EventPayload) => {
      this.domains.forEach(domain => domain.handleEvent(ev));
    });
  }

  static getInstance(config?: any): Engine {
    if (!Engine.instance) {
      Engine.instance = new Engine(config);
    }
    return Engine.instance;
  }

  initDisplay(): void {
   
  }

  initStorage(): void {
    
  }

  getDisplay(): Display | null {
    return this.display;
  }

  

  getEvents(): EventEmitter {
    return this.events;
  }

  emit(event: EventPayload): void {
    // Emit directly through eventBus
    eventBus.next({ type: event.type, data: event.data });
  }

  saveProject(): void {
    console.log('Saving project...');
  }

  loadProject(): void {
    console.log('Loading project...');
  }
}