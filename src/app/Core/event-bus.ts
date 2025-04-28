import { Subject } from 'rxjs';

export interface EventPayload {
  type: string;
  data?: any;
}

export const eventBus = new Subject<EventPayload>();