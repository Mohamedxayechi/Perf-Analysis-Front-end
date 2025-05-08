import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Engine } from '../Engine'; // Adjust path as needed
import { eventBus, EventPayload } from '../Utility/event-bus';
import { MediaModel, Media } from './Models/media-model'; // Adjust path as needed

@Injectable({
  providedIn: 'root',
})
export class Display implements OnDestroy {
  private eventProcessing: boolean = false;
  private subscription: Subscription = new Subscription();

  private state = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  };

  constructor() {
    // Subscribe to MediaModel.medias$ to update UI
    this.subscription.add(
      MediaModel.medias$.subscribe((medias) => {
        console.log(`[${new Date().toISOString()}] Display: Media list updated, count: ${medias.length}`);
        this.updateDuration();
      })
    );

    // Subscribe to MediaModel.totalTime$ to keep duration in sync
    this.subscription.add(
      MediaModel.totalTime$.subscribe((duration) => {
        this.state.duration = duration;
        this.emitEvent({
          type: 'display.durationUpdated',
          data: { duration: this.state.duration },
          origin: 'domain',
        });
      })
    );

    // Register event handler for media-related events
    this.subscription.add(
      eventBus.subscribe((event: EventPayload) => this.handleEvent(event))
    );
  }

  handleEvent(event: EventPayload): void {
    console.log(`[${new Date().toISOString()}] Display received event: ${event.type}, origin: ${event.origin}, processed: ${event.processed}`);

    if (this.eventProcessing || event.processed) {
      console.warn(`[${new Date().toISOString()}] Display skipped processing event: ${event.type} due to eventProcessing or already processed`);
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
          this.seek(event.data?.time || 0);
          break;

        case 'media.loaded':
          this.setDuration(event.data?.duration || 0);
          break;

        case 'media.initialize':
          this.handleInitialize(event.data?.medias);
          break;

        case 'media.delete':
          this.handleDelete(event.data?.index);
          break;

        case 'media.duplicate':
          this.handleDuplicate(event.data?.index);
          break;

        default:
          console.warn(`[${new Date().toISOString()}] Unhandled event type in Display: ${event.type}`);
      }
      event.processed = true; // Mark event as processed
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${new Date().toISOString()}] Error in Display event processing: ${message}`);
    } finally {
      this.eventProcessing = false;
    }
  }

  private play(): void {
    if (!this.state.isPlaying) {
      this.state.isPlaying = true;
      console.log(`[${new Date().toISOString()}] Display: Playback started at ${this.state.currentTime}`);
      this.emitEvent({
        type: 'playback.playing',
        data: { currentTime: this.state.currentTime },
        origin: 'domain',
      });
    }
  }

  private pause(): void {
    if (this.state.isPlaying) {
      this.state.isPlaying = false;
      console.log(`[${new Date().toISOString()}] Display: Playback paused at ${this.state.currentTime}`);
      this.emitEvent({
        type: 'playback.paused',
        data: { currentTime: this.state.currentTime },
        origin: 'domain',
      });
    }
  }

  private seek(time: number): void {
    if (time < 0 || time > this.state.duration) {
      console.warn(`[${new Date().toISOString()}] Display: Invalid seek time ${time}, duration: ${this.state.duration}`);
      return;
    }
    this.state.currentTime = time;
    console.log(`[${new Date().toISOString()}] Display: Seek to ${time}`);
    const mediaInfo = MediaModel.getVideoIndexAndStartTime(time);
    this.emitEvent({
      type: 'playback.seeked',
      data: {
        currentTime: time,
        mediaIndex: mediaInfo?.index,
        localSecond: mediaInfo?.localSecond,
      },
      origin: 'domain',
    });
  }

  private setDuration(duration: number): void {
    this.state.duration = duration || MediaModel.getTotalTime();
    console.log(`[${new Date().toISOString()}] Display: Duration set to ${this.state.duration}`);
    this.emitEvent({
      type: 'display.durationUpdated',
      data: { duration: this.state.duration },
      origin: 'domain',
    });
  }

  private handleInitialize(medias: Media[] | undefined): void {
    if (!medias || !Array.isArray(medias)) {
      console.error(`[${new Date().toISOString()}] Display: Invalid medias for initialization`);
      return;
    }
    MediaModel.initializeMedias(medias);
    console.log(`[${new Date().toISOString()}] Display: Initialized media list with ${medias.length} items`);
    this.emitEvent({
      type: 'media.initialized',
      data: { mediaCount: medias.length },
      origin: 'domain',
    });
  }

  private handleDelete(index: number | undefined): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] Display: Invalid index for delete: ${index}`);
      return;
    }
    const result = MediaModel.delete(index);
    console.log(`[${new Date().toISOString()}] Display: Handled delete at index ${index}, deleted media: ${result.deletedMedia?.label || 'none'} `);
    this.emitEvent({
      type: 'media.deleted',
      data: {
        index,
        deletedMedia: result.deletedMedia,
        updatedMedias: result.updatedMedias // Include updated media list
      },
      origin: 'domain',
    });
  }

  private handleDuplicate(index: number | undefined): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] Display: Invalid index for duplicate: ${index}`);
      return;
    }
  
    const result = MediaModel.duplicate(index); // Assume this returns { duplicatedMedia, updatedMedias }
    console.log(`[${new Date().toISOString()}] Display: Handled duplicate at index ${index}`);
  
    this.emitEvent({
      type: 'media.duplicated',
      data: {
        index,
        duplicatedMedia: result.duplicatedMedia,
        updatedMedias: result.updatedMedias
      },
      origin: 'domain',
    });
  }

  private updateDuration(): void {
    this.state.duration = MediaModel.getTotalTime();
    console.log(`[${new Date().toISOString()}] Display: Duration updated to ${this.state.duration}`);
  }

  private emitEvent(event: EventPayload): void {
    Engine.getInstance().emit({
      ...event,
      processed: false,
      origin: event.origin || 'domain',
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}