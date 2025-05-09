import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Engine } from '../Engine';
import { eventBus, EventPayload } from '../Utility/event-bus';
import { MediaModel, Media } from './Models/media-model';

@Injectable({
  providedIn: 'root',
})
export class Display implements OnDestroy {
  private eventProcessing: boolean = false;
  private subscription: Subscription = new Subscription();
  private video: HTMLVideoElement | null = null;
  private animateFrame: number = 0;
  private cursorX: number = 0;
  private distancePerTime: number = 50;
  private medias: Media[] = [];
  private totalTime: number = 0;

  private state = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  };

  constructor() {
    // No subscriptions in constructor
  }

  setupSubscriptions(): void {
    console.log(`[${new Date().toISOString()}] Display: Setting up subscriptions`);
    this.subscription.add(
      MediaModel.medias$.subscribe((medias) => {
        this.medias = medias;
        console.log(
          `[${new Date().toISOString()}] Display: Media list updated, count: ${medias.length}, medias:`,
          medias.map((m) => m.label)
        );
        this.emitEvent({
          type: 'media.imported',
          data: { updatedMedias: medias },
          origin: 'domain',
        });
      })
    );

    this.subscription.add(
      MediaModel.totalTime$.subscribe((duration) => {
        this.totalTime = duration;
        this.state.duration = duration;
        console.log(`[${new Date().toISOString()}] Display: Total time updated to ${duration}`);
        this.emitEvent({
          type: 'display.durationUpdated',
          data: { duration: this.state.duration },
          origin: 'domain',
        });
      })
    );

    this.subscription.add(
      MediaModel.isPlaying$.subscribe((isPlaying) => {
        this.state.isPlaying = isPlaying;
        console.log(`[${new Date().toISOString()}] Display: isPlaying updated to ${isPlaying}`);
        this.emitEvent({
          type: 'playback.toggled',
          data: { isPlaying, currentSecond: this.cursorX / this.distancePerTime },
          origin: 'domain',
        });
      })
    );

    this.subscription.add(
      eventBus.subscribe((event: EventPayload) => this.handleEvent(event))
    );
  }

  handleEvent(event: EventPayload): void {
    console.log(
      `[${new Date().toISOString()}] Display received event: ${event.type}, origin: ${event.origin}, processed: ${event.processed}`
    );

    if (this.eventProcessing || event.processed) {
      console.warn(
        `[${new Date().toISOString()}] Display skipped processing event: ${event.type} due to eventProcessing or already processed`
      );
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
        case 'media.split':
          this.handleSplit(event.data?.time);
          break;
        case 'playback.toggle':
          this.handleTogglePlayPause(event.data?.currentSecond);
          break;
        case 'media.import':
          this.handleImportMedia(event.data?.file);
          break;
        case 'media.import.trigger':
          this.handleFileInputTrigger();
          break;
        case 'playback.playFromSecond':
          this.playFromSecond(event.data?.globalSecond || 0);
          break;
        case 'playback.replay':
          this.rePlay(event.data?.globalSecond || 0);
          break;
        case 'playback.stop':
          this.stopPlayback();
          break;
        case 'cursor.changed':
          this.handleCursorChange(event.data?.cursorX || 0);
          break;
        case 'parameters.distancePerTimeUpdated':
          this.handleDistancePerTimeUpdate(event.data?.distancePerTime || this.distancePerTime);
          break;
        case 'media.reordered':
          this.handleMediaReordered(event.data?.medias);
          break;
        case 'media.resized':
          this.handleResize(event.data?.index, event.data?.time);
          break;
        case 'media.get':
          this.handleGetMedia(event.data?.index);
          break;
        default:
          console.warn(
            `[${new Date().toISOString()}] Unhandled event type in Display: ${event.type}`
          );
      }
      event.processed = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${new Date().toISOString()}] Error in Display event processing: ${message}`);
    } finally {
      this.eventProcessing = false;
    }
  }

  private handleInitialize(medias: Media[] | undefined): void {
    if (!medias || !Array.isArray(medias)) {
      console.error(`[${new Date().toISOString()}] Display: Invalid medias for initialization`);
      return;
    }
  
    // Delegate initialization to MediaModel and get the updated media list
    const { updatedMedias } = MediaModel.initializeMedias(medias);
  
    // Log the initialized media list
    console.log(
      `[${new Date().toISOString()}] Display: Initialized media list with ${updatedMedias.length} items:`,
      updatedMedias.map((m) => m.label)
    );
  
    // Emit event asynchronously to avoid event processing conflicts
    setTimeout(() => {
      this.emitEvent({
        type: 'media.initialized',
        data: { updatedMedias },
        origin: 'domain',
      });
    }, 0);
  }

  private handleResize(index: number | undefined, time: number | undefined): void {
    if (typeof index !== 'number' || typeof time !== 'number' || time <= 0) {
      console.error(
        `[${new Date().toISOString()}] Display: Invalid resize data, index: ${index}, time: ${time}`
      );
      return;
    }
    const result = MediaModel.resize(index, time);
    console.log(
      `[${new Date().toISOString()}] Display: Resized media at index ${index} to time ${time}, updated medias: ${result.updatedMedias.length}`
    );
    this.emitEvent({
      type: 'media.resized.completed',
      data: { index, time, updatedMedias: result.updatedMedias },
      origin: 'domain',
    });
  }

  private handleGetMedia(index: number | undefined): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] Display: Invalid index for media.get: ${index}`);
      return;
    }
    const media = MediaModel.getMedia(index);
    console.log(
      `[${new Date().toISOString()}] Display: Retrieved media at index ${index}, label: ${media?.label || 'none'}`
    );
    this.emitEvent({
      type: 'media.get.response',
      data: { index, media },
      origin: 'domain',
    });
  }

  private play(): void {
    if (!this.state.isPlaying) {
      this.state.isPlaying = true;
      MediaModel.togglePlayPause();
      console.log(
        `[${new Date().toISOString()}] Display: Playback started at ${this.state.currentTime}`
      );
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
      MediaModel.togglePlayPause();
      console.log(
        `[${new Date().toISOString()}] Display: Playback paused at ${this.state.currentTime}`
      );
      this.emitEvent({
        type: 'playback.paused',
        data: { currentTime: this.state.currentTime },
        origin: 'domain',
      });
    }
  }

  private seek(time: number): void {
    if (time < 0 || time > this.state.duration) {
      console.warn(
        `[${new Date().toISOString()}] Display: Invalid seek time ${time}, duration: ${this.state.duration}`
      );
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
    this.totalTime = this.state.duration;
    console.log(`[${new Date().toISOString()}] Display: Duration set to ${this.state.duration}`);
    this.emitEvent({
      type: 'display.durationUpdated',
      data: { duration: this.state.duration },
      origin: 'domain',
    });
  }

  private handleDelete(index: number | undefined): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] Display: Invalid index for delete: ${index}`);
      return;
    }
    const result = MediaModel.delete(index);
    console.log(
      `[${new Date().toISOString()}] Display: Handled delete at index ${index}, deleted media: ${result.deletedMedia?.label || 'none'}`
    );
    this.emitEvent({
      type: 'media.deleted',
      data: {
        index,
        deletedMedia: result.deletedMedia,
        updatedMedias: result.updatedMedias,
      },
      origin: 'domain',
    });
  }

  private handleDuplicate(index: number | undefined): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] Display: Invalid index for duplicate: ${index}`);
      return;
    }
    const result = MediaModel.duplicate(index);
    console.log(
      `[${new Date().toISOString()}] Display: Handled duplicate at index ${index}, new label: ${result.duplicatedMedia?.label || 'none'}`
    );
    this.emitEvent({
      type: 'media.duplicated',
      data: {
        index,
        duplicatedMedia: result.duplicatedMedia,
        updatedMedias: result.updatedMedias,
      },
      origin: 'domain',
    });
  }

  private handleSplit(time: number | undefined): void {
    if (typeof time !== 'number' || time < 0) {
      console.error(`[${new Date().toISOString()}] Display: Invalid time for split: ${time}`);
      return;
    }
    const result = MediaModel.getVideoIndexAndStartTime(time);
    if (!result) {
      console.warn(`[${new Date().toISOString()}] Display: No media found at time ${time} for split`);
      return;
    }
    const { index, localSecond } = result;
    const splitResult = MediaModel.splitMedia(index, localSecond);
    console.log(
      `[${new Date().toISOString()}] Display: Handled split at time ${time}, index ${index}, splitTime ${localSecond}`
    );
    this.emitEvent({
      type: 'media.splitted',
      data: { time, index, splitTime: localSecond, updatedMedias: splitResult.updatedMedias },
      origin: 'domain',
    });
  }

  private handleTogglePlayPause(currentSecond?: number): void {
    MediaModel.togglePlayPause();
    const isPlaying = MediaModel.isPlayingSubject.getValue();
    console.log(
      `[${new Date().toISOString()}] Display: Handled toggle play/pause, isPlaying: ${isPlaying}, currentSecond: ${currentSecond}`
    );
    this.emitEvent({
      type: 'playback.toggled',
      data: { isPlaying, currentSecond },
      origin: 'domain',
    });
  }

  private handleImportMedia(file?: File): void {
    if (file) {
      const mediaURL = URL.createObjectURL(file);
      if (file.type.startsWith('video')) {
        this.getVideoThumbnail(file).then(({ thumbnail, duration }) => {
          const media: Media = {
            video: mediaURL,
            time: duration,
            label: file.name,
            thumbnail,
            startTime: 0,
            endTime: duration,
          };
          MediaModel.add(media);
          const updatedMedias = MediaModel.mediasSubject.getValue();
          console.log(
            `[${new Date().toISOString()}] Display: Imported video media, new count: ${updatedMedias.length}`
          );
          this.emitEvent({
            type: 'media.imported',
            data: { updatedMedias },
            origin: 'domain',
          });
        }).catch((err) => {
          console.error(`[${new Date().toISOString()}] Display: Failed to import video: ${err}`);
        });
      } else if (file.type.startsWith('image')) {
        const media: Media = {
          image: mediaURL,
          time: 5,
          label: file.name,
          thumbnail: mediaURL,
          startTime: 0,
          endTime: 5,
        };
        MediaModel.add(media);
        const updatedMedias = MediaModel.mediasSubject.getValue();
        console.log(
          `[${new Date().toISOString()}] Display: Imported image media, new count: ${updatedMedias.length}`
        );
        this.emitEvent({
          type: 'media.imported',
          data: { updatedMedias },
          origin: 'domain',
        });
      }
    } else {
      this.handleFileInputTrigger();
    }
  }

  private handleFileInputTrigger(): void {
    console.log(`[${new Date().toISOString()}] Display: Opening file dialog for media import`);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,image/*';
    input.multiple = true;
    input.onchange = (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files || files.length === 0) {
        console.warn(`[${new Date().toISOString()}] Display: No files selected for import`);
        return;
      }
      Array.from(files).forEach((file) => {
        this.handleImportMedia(file);
      });
    };
    input.click();
  }

  private handleCursorChange(cursorX: number): void {
    this.cursorX = cursorX;
    console.log(`[${new Date().toISOString()}] Display: Cursor changed to ${cursorX}`);
    this.emitEvent({
      type: 'cursor.updated',
      data: { cursorX },
      origin: 'domain',
    });
    if (this.state.isPlaying) {
      this.rePlay(cursorX / this.distancePerTime);
    }
  }

  private handleDistancePerTimeUpdate(distancePerTime: number): void {
    this.distancePerTime = distancePerTime;
    console.log(
      `[${new Date().toISOString()}] Display: distancePerTime updated to ${distancePerTime}`
    );
    this.emitEvent({
      type: 'parameters.distancePerTimeUpdated',
      data: { distancePerTime },
      origin: 'domain',
    });
  }

  private handleMediaReordered(medias: Media[] | undefined): void {
    if (!medias || !Array.isArray(medias)) {
      console.error(`[${new Date().toISOString()}] Display: Invalid medias for reorder`);
      return;
    }
    MediaModel.initializeMedias(medias);
    console.log(`[${new Date().toISOString()}] Display: Media list reordered, count: ${medias.length}`);
    this.emitEvent({
      type: 'media.imported',
      data: { updatedMedias: medias },
      origin: 'domain',
    });
  }

  private playFromSecond(globalSecond: number): void {
    const result = MediaModel.getVideoIndexAndStartTime(globalSecond);
    if (!result) {
      console.warn(
        `[${new Date().toISOString()}] Display: Second is beyond total media duration: ${globalSecond}`
      );
      this.stopPlayback();
      return;
    }

    const { index, localSecond } = result;
    this.playMediaFrom(index, localSecond);
  }

  private stopPlayback(): void {
    if (this.animateFrame) {
      cancelAnimationFrame(this.animateFrame);
      this.animateFrame = 0;
    }
    if (this.video) {
      this.video.pause();
      this.video = null;
    }
    this.state.isPlaying = false;
    MediaModel.isPlayingSubject.next(false);
    console.log(`[${new Date().toISOString()}] Display: Playback stopped`);
    this.emitEvent({
      type: 'playback.stopped',
      data: {},
      origin: 'domain',
    });
  }

  private rePlay(globalSecond: number): void {
    this.stopPlayback();
    this.playFromSecond(globalSecond);
  }

  private getVideoThumbnail(file: File, seekTo = 1): Promise<{ thumbnail: string; duration: number }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');

      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        const duration = video.duration;
        video.currentTime = Math.min(seekTo, duration / 2);
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/png');
        resolve({ thumbnail, duration: video.duration });
      };

      video.onerror = () => reject('Error while loading video');
    });
  }

  private playMediaFrom(index: number, localSecond: number): void {
    const medias = MediaModel.mediasSubject.getValue();
    if (index >= medias.length || index < 0) {
      console.error(
        `[${new Date().toISOString()}] Display: Invalid index ${index} or no media available`
      );
      this.stopPlayback();
      return;
    }

    this.stopPlayback();
    const media = medias[index];
    const startTime = media.startTime ?? 0;
    const endTime = media.endTime ?? media.time;
    const accumulatedBefore = MediaModel.calculateAccumulatedTime(index);

    console.log(
      `[${new Date().toISOString()}] Display: Playing media at index ${index}, localSecond: ${localSecond}, label: ${media.label}`
    );
    this.emitEvent({
      type: 'playback.mediaPlayed',
      data: { media, index, localSecond, accumulatedBefore },
      origin: 'domain',
    });
  }

  private updateDuration(): void {
    this.state.duration = MediaModel.getTotalTime();
    this.totalTime = this.state.duration;
    console.log(`[${new Date().toISOString()}] Display: Duration updated to ${this.state.duration}`);
    this.emitEvent({
      type: 'display.durationUpdated',
      data: { duration: this.state.duration },
      origin: 'domain',
    });
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
    this.stopPlayback();
  }
}