import { Subject } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventPayload<T = any> {
  type: string;
  data?: T;
  correlationId?: string;
  origin?: 'component' | 'domain';
  processed?: boolean; // New flag to track if event has been routed
}

export const eventBus = new Subject<EventPayload>();