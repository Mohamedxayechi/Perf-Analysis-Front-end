import { Subject } from 'rxjs';

export interface EventPayload<T = any> {
  type: string;
  data?: T;
  correlationId?: string;
  origin?: 'component' | 'domain';
  processed?: boolean; //  flag to track if event has been routed
}

export const eventBus = new Subject<EventPayload>();