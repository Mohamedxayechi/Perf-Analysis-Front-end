import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { eventBus, EventPayload } from '../Utility/event-bus';

interface LogEntry {
  '@timestamp': string;
  event: {
    type: string;
    origin: string;
    processed: boolean;
    data?: any;
  };
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class Logs implements OnDestroy {
  private subscription = new Subscription();
  private logEntries: LogEntry[] = [];
  private readonly logFileName = 'application.log';

  constructor() {
    this.setupSubscriptions();
  }

  /**
   * Sets up subscription to capture all events from the event bus.
   */
  private setupSubscriptions(): void {
    console.log(`[${new Date().toISOString()}] Logs: Setting up subscriptions`);
    this.subscription.add(
      eventBus.subscribe((event: EventPayload) => this.handleEvent(event))
    );
  }

  /**
   * Processes incoming events and adds them to the log entries.
   * @param event The event payload to log.
   */
  private handleEvent(event: EventPayload): void {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      '@timestamp': timestamp,
      event: {
        type: event.type,
        origin: event.origin || 'unknown',
        processed: event.processed || false,
        data: event.data,
      },
      message: `[${timestamp}] Event: ${event.type}, Origin: ${event.origin}, Data: ${JSON.stringify(event.data)}`,
    };

    console.log(`[${timestamp}] Logs: Captured event`, logEntry);
    this.logEntries.push(logEntry);
  }

  /**
   * Returns the current log entries for UI display.
   */
  public getLogs(): LogEntry[] {
    return [...this.logEntries];
  }

  /**
   * Generates and downloads the current log file with all entries in JSON Lines format.
   */
  public downloadLogFile(): void {
    try {
      const logContent = this.logEntries.map(entry => JSON.stringify(entry)).join('\n');
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = this.logFileName;
      a.click();

      URL.revokeObjectURL(url);
      a.remove();

      console.log(`[${new Date().toISOString()}] Logs: Downloaded ${this.logFileName}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Logs: Failed to download log file`, error);
    }
  }

  /**
   * Clears all log entries (optional, for memory management or reset).
   */
  public clearLogs(): void {
    this.logEntries = [];
    console.log(`[${new Date().toISOString()}] Logs: Cleared all log entries`);
  }

  /**
   * Cleans up subscriptions and resources on destruction.
   */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    console.log(`[${new Date().toISOString()}] Logs: Unsubscribed from event bus`);
  }
}