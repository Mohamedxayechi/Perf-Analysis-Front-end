// display.class.ts
import { Injectable } from '@angular/core';
import { Engine } from '../Engine';
import { eventBus, EventPayload } from '../Utility/event-bus';

@Injectable({
  providedIn: 'root',
})
export class Display {
  private eventProcessing: boolean = false;

  private state = {
    isPlaying: false,
    currentTime: 0,
    duration: 120, // placeholder; will be updated later
  };

  constructor() {
  
   
  }

   handleEvent(event: EventPayload): void {
    console.log(`[${new Date().toISOString()}] Display received event: ${event.type}, origin: ${event.origin}, processed: ${event.processed}`);
    
    if (this.eventProcessing) {
      console.warn(`[${new Date().toISOString()}] Display skipped processing event: ${event.type} due to eventProcessing`);
      return;
    }

    this.eventProcessing = true;

    try {
      switch (event.type) {
        case 'playback.play':
          this.play();
          break;

        case 'playback.pause':
          this.pause();
          break;

        case 'playback.seek':
          this.seek(event.data.time);
          break;

        case 'media.loaded':
          this.setDuration(event.data.duration);
          break;

        default:
          console.warn(`[${new Date().toISOString()}] Unhandled event type in Display: ${event.type}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error in Display event processing: ${message}`);
    } finally {
      this.eventProcessing = false;
    }
  }

  private play(): void {
    this.state.isPlaying = true;
    this.emitEvent({
      type: 'playback.playing',
      data: { currentTime: this.state.currentTime },
    });
  }

  private pause(): void {
    this.state.isPlaying = false;
    this.emitEvent({
      type: 'playback.paused',
      data: { currentTime: this.state.currentTime },
    });
  }

  private seek(time: number): void {
    const clampedTime = Math.max(0, Math.min(time, this.state.duration));
    this.state.currentTime = clampedTime;

    this.emitEvent({
      type: 'playback.timeupdate',
      data: { currentTime: clampedTime },
    });
  }

  private setDuration(duration: number): void {
    this.state.duration = duration;
  }

  private emitEvent(event: Omit<EventPayload, 'origin' | 'processed'>): void {
    Engine.getInstance().emit({
      ...event,
      origin: 'domain',
      processed: false,
    });
  }

  getState(): Readonly<typeof this.state> {
    return this.state;
  }
}