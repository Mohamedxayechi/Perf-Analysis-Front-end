import { Injectable, OnDestroy, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventPayload } from '../Utility/event-bus';

interface LogEntry {
  timestamp: string;
  eventType: string;
  origin?: string;
  correlationId?: string;
  data?: any;
  processed?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Logs implements OnDestroy {
  private backendUrl = 'http://localhost:5251/api/logs';

  constructor(@Optional() @Inject(HttpClient) private http?: HttpClient) {
    console.log(`[${new Date().toISOString()}] Logs: Service instantiated`);
  }

  handleEvent(event: EventPayload): void {
    console.log(`[${new Date().toISOString()}] Logs: Processing event: ${event.type}, origin: ${event.origin}, processed: ${event.processed}, data:`, event.data);

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      origin: event.origin,
      correlationId: event.correlationId,
      data: event.data,
      processed: event.processed,
    };

    this.sendLogToBackend(logEntry);
  }

  private sendLogToBackend(logEntry: LogEntry): void {
    console.log(`[${new Date().toISOString()}] Logs: Preparing to send log:`, logEntry);
    if (!this.http) {
      console.warn(`[${new Date().toISOString()}] Logs: HttpClient not available, skipping backend log for event: ${logEntry.eventType}`);
      return;
    }
    this.http.post(this.backendUrl, logEntry).subscribe({
      next: (response) => {
        console.log(`[${new Date().toISOString()}] Logs: Successfully sent log for event: ${logEntry.eventType}`, response);
      },
      error: (error) => {
        console.error(`[${new Date().toISOString()}] Logs: Failed to send log for event: ${logEntry.eventType}`);
        console.error('Error details:', error.message, error.status, error.statusText);
      },
    });
  }

  ngOnDestroy(): void {
    console.log(`[${new Date().toISOString()}] Logs: Cleaning up`);
  }
}