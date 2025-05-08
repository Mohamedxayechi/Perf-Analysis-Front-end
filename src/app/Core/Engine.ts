import { Display } from './Display/Display';
import { Storage } from './Storage/Storage';

// import { Library } from './Library/Library';

import { EventEmitter } from './Utility/EventEmitter';
import { eventBus, EventPayload } from './Utility/event-bus';

interface Domain {
  handleEvent(event: EventPayload): void;
}

export class Engine {
  private static instance: Engine | null = null;
  private domains: Domain[] = [];
  private events: EventEmitter;
  public isInitialized: boolean = false;

  private constructor() {
    this.events = new EventEmitter();
    this.setupEventRouting();
  }

  static getInstance(): Engine {
    if (!Engine.instance) {
      Engine.instance = new Engine();
    }
    return Engine.instance;
  }

  init(): void {
    if (this.isInitialized) return;

    // Initialize and register core domains
      this.registerDomain(new Display());
    //  this.registerDomain(new Storage());
    //  this.registerDomain(new Library());

    this.isInitialized = true;
    console.log('[${new Date().toISOString()}] Engine initialized with core domains');
  }

  emit<T>(event: EventPayload<T>): void {
    if (!this.isInitialized) {
      console.warn('Engine not initialized. Call init() before emitting events.');
      return;
    }
    // Ensure processed flag is false for new events
    const eventToEmit = {
      ...event,
      processed: false,
    };
    console.log(`[${new Date().toISOString()}] Engine emitting: ${eventToEmit.type}, origin: ${eventToEmit.origin}, processed: ${eventToEmit.processed}`);
    this.events.emit(eventToEmit);
  }

  private setupEventRouting(): void {
    // Route events to domains
    this.events.on('*', (event: EventPayload) => {
      if (!this.isInitialized) return;
      console.log(`[${new Date().toISOString()}]Engine routing to domains: ${event.type}, origin: ${event.origin}, processed: ${event.processed}`);
      this.domains.forEach(domain => domain.handleEvent(event));
    });

    // Handle incoming events from eventBus
    eventBus.subscribe((event: EventPayload) => {
      console.log(`[${new Date().toISOString()}]Engine received from eventBus: ${event.type}, origin: ${event.origin}, processed: ${event.processed}`);

      // Skip if event has been processed
      if (event.processed) {
        console.log(`[${new Date().toISOString()}]Engine skipping processed event: ${event.type}`);
        return;
      }

      // Skip component-originated events (already routed via Engine.emit)
      if (event.origin === 'component') {
        console.log(`[${new Date().toISOString()}]Engine skipping component event: ${event.type}`);
        return;
      }

      // Skip domain-originated events to prevent loops
      if (event.origin === 'domain') {
        console.log(`[${new Date().toISOString()}]Engine skipping domain event: ${event.type}`);
        return;
      }

      // Route external or unhandled events
      const eventToEmit = {
        ...event,
        processed: true,
      };
      console.log(`[${new Date().toISOString()}]Engine re-emitting: ${eventToEmit.type}, origin: ${eventToEmit.origin || 'component'}, processed: ${eventToEmit.processed}`);
      this.events.emit(eventToEmit);
    });
  }

  getEvents(): EventEmitter {
    return this.events;
  }

  registerDomain(domain: Domain): void {
    if (!this.domains.includes(domain)) {
      this.domains.push(domain);
      console.log(`[${new Date().toISOString()}]Domain registered: ${domain.constructor.name}`);
    }
  }

  unregisterDomain(domain: Domain): void {
    this.domains = this.domains.filter(d => d !== domain);
  }
}