import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Engine, Domain } from '../Engine';
import { EventPayload } from '../Utility/event-bus';

@Injectable({
  providedIn: 'root',
})
export class Logs implements Domain, OnDestroy {
  private subscription = new Subscription();
  private readonly backendUrl = 'http://localhost:5251/api/logs'; // Adjust to your .NET API endpoint
  private http: HttpClient | null;

  constructor(http: HttpClient | null = null) { // Default to null to allow instantiation without arguments
    this.http = http;
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    console.log(`[${new Date().toISOString()}] Logs: Setting up subscriptions`);
    this.subscription.add(
      Engine.getInstance().getEvents().on('*', (event: EventPayload) => {
        this.handleEvent(event);
      })
    );
  }

  handleEvent(event: EventPayload): void {
    if (event.processed) {
      console.log(`[${new Date().toISOString()}] Logs: Skipping processed event: ${event.type}`);
      return;
    }

    const logData = {
      timestamp: new Date().toISOString(),
      type: event.type,
      origin: event.origin || 'unknown',
      data: event.data,
      level: this.mapEventTypeToLogLevel(event.type),
    };

    console.log(`[${new Date().toISOString()}] Logs: Processing event`, logData);

    if (this.http) {
      this.http.post(this.backendUrl, logData).subscribe({
        next: () => console.log(`[${new Date().toISOString()}] Logs: Successfully sent log to backend`, logData),
        error: (err) => console.error(`[${new Date().toISOString()}] Logs: Failed to send log to backend`, err),
      });
    } else {
      console.warn(`[${new Date().toISOString()}] Logs: HttpClient not available, skipping backend log for event: ${event.type}`);
    }

    event.processed = true;
  }

  private mapEventTypeToLogLevel(eventType: string): string {
    if (eventType.includes('error')) return 'Error';
    if (eventType.includes('warn')) return 'Warning';
    if (eventType.includes('info') || eventType.includes('updated') || eventType.includes('imported')) return 'Information';
    return 'Debug';
  }

  ngOnDestroy(): void {
    console.log(`[${new Date().toISOString()}] Logs: Cleaning up subscriptions`);
    this.subscription.unsubscribe();
  }
}