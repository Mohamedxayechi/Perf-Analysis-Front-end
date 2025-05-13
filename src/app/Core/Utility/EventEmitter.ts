import { Subscription } from 'rxjs';
import { eventBus, EventPayload } from './event-bus';

type Callback<T = any> = (event: EventPayload<T>) => void;

export class EventEmitter {
  private subscriptions: Map<string, Subscription[]> = new Map();

  // Register a listener for a specific event or for all events with '*'
  on<T>(event: string, callback: Callback<T>): Subscription {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }

    const subscription = eventBus.subscribe((ev: EventPayload) => {
      if (event === '*' || ev.type === event) {
        callback(ev);
      }
    });

    this.subscriptions.get(event)!.push(subscription);
    return subscription;
  }

  // Unsubscribe from a specific event
  off(event: string): void {
    const subscriptions = this.subscriptions.get(event);
    if (subscriptions) {
      subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions.delete(event);
    }
  }

  // Emit an event to the eventBus
  emit<T>(event: EventPayload<T>): void {
    // console.log(`[${new Date().toISOString()}] EventEmitter emitting: ${event.type}, origin: ${event.origin},${event}`);
    eventBus.next(event);
  }

  // Clean up all subscriptions
  destroy(): void {
    this.subscriptions.forEach((subs, event) => {
      subs.forEach(sub => sub.unsubscribe());
    });
    this.subscriptions.clear();
  }
}
