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
  private updateTimer: NodeJS.Timeout | null = null;
  private medias: Media[] = [];
  private totalTime: number = 0;
  private cursorX: number = 0;
  private distancePerTime: number = 50;
  private state = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  };

  constructor() {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    console.log(`[${new Date().toISOString()}] Display: Setting up subscriptions`);
    this.subscription.add(
      MediaModel.medias$.subscribe((medias) => {
        this.medias = medias;
        console.log(
          `[${new Date().toISOString()}] Display: Media list updated, count: ${medias.length}, medias:`,
          medias.map((m) => ({ label: m.label, video: m.video, image: m.image }))
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
      eventBus.subscribe((event: EventPayload) => this.handleEvent(event))
    );
  }

  handleEvent(event: EventPayload): void {
    console.log(
      `[${new Date().toISOString()}] Display: Received event: ${event.type}, origin: ${event.origin}, data:`,
      event.data
    );

    if (this.eventProcessing || event.processed) {
      console.warn(
        `[${new Date().toISOString()}] Display: Skipped event: ${event.type}, eventProcessing: ${this.eventProcessing}, processed: ${event.processed}`
      );
      return;
    }

    this.eventProcessing = true;

    try {
      switch (event.type) {
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
        case 'media.import':
          this.handleImportMedia(event.data?.file);
          break;
        case 'media.import.trigger':
          this.handleFileInputTrigger();
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
        case 'playback.playFromSecond':
          this.playFromSecond(event.data?.globalSecond || 0);
          break;
        case 'playback.toggle':
          this.togglePlayPause(event.data?.currentSecond);
          break;
        case 'cursor.changed':
          this.handleCursorChange(event.data?.cursorX || 0);
          break;
        case 'parameters.distancePerTimeUpdated':
          this.handleDistancePerTimeUpdate(event.data?.distancePerTime || this.distancePerTime);
          break;
        default:
          console.warn(
            `[${new Date().toISOString()}] Display: Unhandled event type: ${event.type}`
          );
      }
      event.processed = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${new Date().toISOString()}] Display: Error in event processing: ${message}`);
    } finally {
      this.eventProcessing = false;
    }
  }

  private handleInitialize(medias: Media[] | undefined): void {
    console.log(
      `[${new Date().toISOString()}] Display: handleInitialize received medias:`,
      medias?.map((m) => ({ label: m.label, video: m.video, image: m.image }))
    );
    if (!medias || !Array.isArray(medias)) {
      console.error(`[${new Date().toISOString()}] Display: Invalid medias for initialization`);
      return;
    }

    const { updatedMedias } = MediaModel.initializeMedias(medias);

    console.log(
      `[${new Date().toISOString()}] Display: Initialized media list with ${updatedMedias.length} items:`,
      updatedMedias.map((m) => m.label)
    );

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

  private handleImportMedia(file?: File): void {
    if (file) {
      const mediaURL = URL.createObjectURL(file);
      console.log(
        `[${new Date().toISOString()}] Display: Created mediaURL: ${mediaURL} for file: ${file.name}`
      );
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

  private handleMediaReordered(medias: Media[] | undefined): void {
    if (!medias || !Array.isArray(medias)) {
      console.error(`[${new Date().toISOString()}] Display: Invalid medias for reorder`);
      return;
    }
    MediaModel.initializeMedias(medias);
    console.log(
      `[${new Date().toISOString()}] Display: Media list reordered, count: ${medias.length}`
    );
    this.emitEvent({
      type: 'media.imported',
      data: { updatedMedias: medias },
      origin: 'domain',
    });
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

  private playFromSecond(globalSecond: number): void {
    console.log(
      `[${new Date().toISOString()}] Display: playFromSecond called with globalSecond: ${globalSecond}`
    );
    if (!isFinite(globalSecond) || globalSecond < 0) {
      console.warn(
        `[${new Date().toISOString()}] Display: Invalid globalSecond: ${globalSecond}, defaulting to 0`
      );
      globalSecond = 0;
    }

    const medias = MediaModel.mediasSubject.getValue();
    if (medias.length === 0) {
      console.error(
        `[${new Date().toISOString()}] Display: No medias available to play`
      );
      this.stopPlayback();
      return;
    }

    const result = MediaModel.getVideoIndexAndStartTime(globalSecond);
    if (!result) {
      console.warn(
        `[${new Date().toISOString()}] Display: No media found at time ${globalSecond}`
      );
      this.stopPlayback();
      return;
    }

    const { index, localSecond } = result;
    console.log(
      `[${new Date().toISOString()}] Display: Playing media at index ${index}, localSecond: ${localSecond}`
    );
    this.renderMedia(index, localSecond);
  }

  private stopPlayback(): void {
    console.log(
      `[${new Date().toISOString()}] Display: stopPlayback called, isPlaying: ${this.state.isPlaying}`
    );
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.video) {
      this.video.pause();
      this.video.remove();
      this.video = null;
    }
    this.state.isPlaying = false;
    this.emitEvent({
      type: 'playback.toggled',
      data: { isPlaying: false },
      origin: 'domain',
    });
    this.emitEvent({
      type: 'render.frame',
      data: { mediaElement: null },
      origin: 'domain',
    });
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

  private renderMedia(index: number, localSecond: number): void {
    console.log(
      `[${new Date().toISOString()}] Display: renderMedia(index: ${index}, localSecond: ${localSecond})`
    );
    if (index >= this.medias.length) {
      console.error(
        `[${new Date().toISOString()}] Display: Invalid index or no media available: ${index}`
      );
      this.stopPlayback();
      return;
    }

    this.stopPlayback();
    const media = this.medias[index];
    const startTime = media.startTime ?? 0;
    const endTime = media.endTime ?? media.time;
    const duration = endTime - startTime;
    const accumulatedBefore = MediaModel.calculateAccumulatedTime(index);
    console.log(
      `[${new Date().toISOString()}] Display: Media details: label: ${media.label}, duration: ${duration}, accumulatedBefore: ${accumulatedBefore}`
    );

    if (media.video) {
      console.log(
        `[${new Date().toISOString()}] Display: Setting up video for ${media.label}, src: ${media.video}`
      );
      this.video = document.createElement('video');
      this.video.src = media.video;
      this.video.crossOrigin = 'anonymous';
      this.video.muted = true;
      this.video.preload = 'auto';

      this.video.addEventListener('loadedmetadata', () => {
        console.log(
          `[${new Date().toISOString()}] Display: Video metadata loaded: ${media.label}, duration: ${this.video!.duration}, width: ${this.video!.videoWidth}, height: ${this.video!.videoHeight}`
        );
        const seekTime = startTime + localSecond;
        if (isFinite(seekTime) && seekTime >= 0 && seekTime <= this.video!.duration) {
          this.video!.currentTime = seekTime;
          console.log(
            `[${new Date().toISOString()}] Display: Video seeked to ${seekTime} for ${media.label}`
          );
        } else {
          console.error(
            `[${new Date().toISOString()}] Display: Invalid seekTime: ${seekTime} for ${media.label}, duration: ${this.video!.duration}`
          );
          this.tryNextMedia(index + 1, accumulatedBefore + duration);
          return;
        }

        this.video!.play()
          .then(() => {
            console.log(
              `[${new Date().toISOString()}] Display: Video playing: ${media.label}, currentTime: ${this.video!.currentTime}`
            );
            this.state.isPlaying = true;
            this.emitEvent({
              type: 'playback.toggled',
              data: { isPlaying: true },
              origin: 'domain',
            });
            this.emitEvent({
              type: 'render.frame',
              data: {
                mediaElement: this.video,
                width: this.video!.videoWidth,
                height: this.video!.videoHeight,
              },
              origin: 'domain',
              processed: false,
            });

            const updateCursor = () => {
              if (!this.state.isPlaying || !this.video || this.video.paused || this.video.ended) {
                console.log(
                  `[${new Date().toISOString()}] Display: Stopping cursor update for ${media.label}, isPlaying: ${this.state.isPlaying}, paused: ${this.video?.paused}, ended: ${this.video?.ended}`
                );
                this.stopPlayback();
                return;
              }

              const currentLocalSecond = this.video.currentTime - startTime;
              const currentGlobalSecond = accumulatedBefore + currentLocalSecond;
              this.cursorX = currentGlobalSecond * this.distancePerTime;
              this.emitEvent({
                type: 'cursor.updated',
                data: { cursorX: this.cursorX },
                origin: 'domain',
              });

              if (this.video.currentTime >= endTime || this.video.ended) {
                console.log(
                  `[${new Date().toISOString()}] Display: Video ended: ${media.label}, advancing to index: ${index + 1}`
                );
                this.tryNextMedia(index + 1, accumulatedBefore + duration);
              } else {
                this.updateTimer = setTimeout(updateCursor, 16); // ~60 FPS
              }
            };
            this.updateTimer = setTimeout(updateCursor, 16);
          })
          .catch((err) => {
            console.error(
              `[${new Date().toISOString()}] Display: Video play failed for ${media.label}, src: ${media.video}, error: ${err.message}`
            );
            this.tryNextMedia(index + 1, accumulatedBefore + duration);
          });
      });

      this.video.addEventListener('error', (e) => {
        console.error(
          `[${new Date().toISOString()}] Display: Video error for ${media.label}, src: ${media.video}, error:`,
          this.video?.error,
          e
        );
        this.tryNextMedia(index + 1, accumulatedBefore + duration);
      });

      this.video.load();
    } else if (media.image) {
      console.log(
        `[${new Date().toISOString()}] Display: Setting up image for ${media.label}, src: ${media.image}`
      );
      const image = new window.Image();
      image.src = media.image;
      image.crossOrigin = 'anonymous';

      image.onload = () => {
        console.log(
          `[${new Date().toISOString()}] Display: Image loaded: ${media.label}, width: ${image.width}, height: ${image.height}`
        );
        this.state.isPlaying = true;
        this.emitEvent({
          type: 'playback.toggled',
          data: { isPlaying: true },
          origin: 'domain',
        });
        this.emitEvent({
          type: 'render.frame',
          data: { mediaElement: image, width: image.width, height: image.height },
          origin: 'domain',
          processed: false,
        });

        let currentLocalSecond = localSecond;
        const updateImageTimer = () => {
          if (!this.state.isPlaying) {
            console.log(
              `[${new Date().toISOString()}] Display: Stopping image timer for ${media.label}`
            );
            this.stopPlayback();
            return;
          }

          currentLocalSecond += 0.016; // ~60 FPS
          const currentGlobalSecond = accumulatedBefore + currentLocalSecond;
          this.cursorX = currentGlobalSecond * this.distancePerTime;
          this.emitEvent({
            type: 'cursor.updated',
            data: { cursorX: this.cursorX },
            origin: 'domain',
          });

          if (currentLocalSecond >= duration) {
            console.log(
              `[${new Date().toISOString()}] Display: Image ended: ${media.label}, advancing to index: ${index + 1}`
            );
            this.tryNextMedia(index + 1, accumulatedBefore + duration);
          } else {
            this.updateTimer = setTimeout(updateImageTimer, 16);
          }
        };
        this.updateTimer = setTimeout(updateImageTimer, 16);
      };

      image.onerror = () => {
        console.error(
          `[${new Date().toISOString()}] Display: Image error for ${media.label}, src: ${media.image}`
        );
        this.tryNextMedia(index + 1, accumulatedBefore + duration);
      };
    }
  }

  private tryNextMedia(nextIndex: number, globalSecond: number): void {
    console.log(
      `[${new Date().toISOString()}] Display: Trying next media, index: ${nextIndex}, globalSecond: ${globalSecond}`
    );
    if (nextIndex >= this.medias.length) {
      console.warn(
        `[${new Date().toISOString()}] Display: No more media to try, stopping playback`
      );
      this.stopPlayback();
      return;
    }
    this.renderMedia(nextIndex, 0);
  }

  private rePlay(globalSecond: number): void {
    console.log(
      `[${new Date().toISOString()}] Display: Replaying from globalSecond: ${globalSecond}`
    );
    this.stopPlayback();
    this.playFromSecond(globalSecond);
  }

  private togglePlayPause(currentSecond?: number): void {
    console.log(
      `[${new Date().toISOString()}] Display: togglePlayPause, currentSecond: ${currentSecond}, isPlaying: ${this.state.isPlaying}`
    );
    if (this.state.isPlaying) {
      this.stopPlayback();
    } else {
      const playSecond = currentSecond ?? this.cursorX / this.distancePerTime;
      this.playFromSecond(playSecond);
    }
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