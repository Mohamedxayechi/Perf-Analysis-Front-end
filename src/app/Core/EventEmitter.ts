import { eventBus, EventPayload } from './event-bus';

type Callback = (event: EventPayload) => void;

export class EventEmitter {
  private listeners: Map<string, Callback[]> = new Map();

  on(event: string, callback: Callback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    // Subscribe to eventBus to trigger callbacks when the event occurs
    eventBus.subscribe((ev: EventPayload) => {
      if (ev.type === event) {
        callback(ev);
      }
    });
  }

  emit(event: EventPayload): void {
    // Emit through eventBus instead of local listeners
    eventBus.next({ type: event.type, data: event.data });
    // Local listeners are still triggered via eventBus subscription in on()
  }
}