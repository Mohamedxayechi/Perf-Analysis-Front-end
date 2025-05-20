import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Engine } from '../Engine';
import { eventBus, EventPayload } from '../Utility/event-bus';
import { Media } from './Models/media-model';
import { DispalyUtility } from './Utility/Displayutility';

interface State {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackSpeed: number;
}

interface RenderOptions {
  frameInterval: number;
  endTimeTolerance: number;
}

@Injectable({
  providedIn: 'root',
})
export class Display implements OnDestroy {
  private subscription = new Subscription();
  private video: HTMLVideoElement | null = null;
  private currentImage: HTMLImageElement | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private medias: Media[] = [];
  private totalTime = 0;
  private cursorX = 0;
  private distancePerTime = 50;
  private lastPausedTime = 0;
  private currentMediaIndex = -1;
  private eventProcessing = false;
  private state: State = { isPlaying: false, currentTime: 0, duration: 0, volume: 0.5, playbackSpeed: 1 };
  private options: RenderOptions = { frameInterval: 0.016, endTimeTolerance: 0.1 };

  constructor() {
    this.setupSubscriptions();
  }

  private emitEvent(event: EventPayload): void {
    // console.log(`[${new Date().toISOString()}] Display: Emitting event: ${event.type}, origin: ${event.origin}, data:`, event.data);
    Engine.getInstance().emit({ ...event, processed: false, origin: event.origin || 'domain' });
  }

  private setupSubscriptions(): void {
    // console.log(`[${new Date().toISOString()}] Display: Setting up subscriptions`);
    this.subscription.add(
      DispalyUtility.medias$.subscribe((medias) => {
        this.medias = medias;
        // console.log(`[${new Date().toISOString()}] Display: Media list updated`, { count: medias.length, medias: medias.map(this.summarizeMedia) });
        this.emitEvent({ type: 'media.imported', data: { updatedMedias: medias }, origin: 'domain' });
      })
    );

    this.subscription.add(
      DispalyUtility.totalTime$.subscribe((duration) => {
        this.updateDuration(duration);
      })
    );

    this.subscription.add(
      eventBus.subscribe((event: EventPayload) => this.handleEvent(event))
    );
  }

  private summarizeMedia(media: Media, index: number) {
    return { index, label: media.label, video: media.video, image: media.image, thumbnail: media.thumbnail, startTime: media.startTime, endTime: media.endTime, time: media.time };
  }

  handleEvent(event: EventPayload): void {
    // console.log(`[${new Date().toISOString()}] Display: Received event: ${event.type}, origin: ${event.origin}, data:`, event.data);
    if (this.eventProcessing || event.processed) {
      console.warn(`[${new Date().toISOString()}] Display: Skipped event: ${event.type}, eventProcessing: ${this.eventProcessing}, processed: ${event.processed}`);
      return;
    }

    this.eventProcessing = true;
    try {
      const handlers: { [key: string]: (data: any) => void } = {
        'media.loaded': (data) => this.updateDuration(data?.duration || DispalyUtility.getTotalTime()),
        'media.initialize': (data) => this.handleInitialize(data?.medias),
        'media.delete': (data) => this.handleDelete(data?.index),
        'media.duplicate': (data) => this.handleDuplicate(data?.index),
        'media.split': (data) => this.handleSplit(data?.time),
        'media.import': (data) => this.handleImportMedia(data?.file),
        'media.import.trigger': () => this.handleFileInputTrigger(),
        'media.reordered': (data) => this.handleMediaReordered(data?.medias),
        'media.resized': (data) => this.handleResize(data?.index, data?.time),
        'media.get': (data) => this.handleGetMedia(data?.index),
        'playback.playFromSecond': (data) => this.playFromSecond(data?.globalSecond || 0),
        'playback.toggle': (data) => this.togglePlayPause(data?.currentSecond),
        'cursor.changed': (data) => this.handleCursorChange(data?.cursorX || 0),
        'parameters.distancePerTimeUpdated': (data) => this.handleDistancePerTimeUpdate(data?.distancePerTime || this.distancePerTime),
        'volume.changed': (data) => {
          const volume = Math.max(0, Math.min(1, data?.volume ?? this.state.volume));
          this.setVolume(volume);
          // console.log(`[${new Date().toISOString()}] Display: Handled volume.changed, volume: ${volume}`);
        },
        'playback.speed.changed': (data) => {
          const playbackSpeed = data?.playbackSpeed ?? this.state.playbackSpeed;
          this.setPlaybackSpeed(playbackSpeed);
          // console.log(`[${new Date().toISOString()}] Display: Handled playback.speed.changed, speed: ${playbackSpeed}`);
        },
        'zoom.get': () => {
          const zoom = this.distancePerTime / 50;
          this.emitEvent({ type: 'zoom.changed', data: { zoom }, origin: 'domain' });
          // console.log(`[${new Date().toISOString()}] Display: Handled zoom.get, zoom: ${zoom}`);
        },
        'zoom.in': (data) => {
          const stepScale = data?.stepScale || 0.1;
          this.distancePerTime = Math.min(this.distancePerTime + stepScale * 50, 100);
          const zoom = this.distancePerTime / 50;
          this.emitEvent({ type: 'zoom.changed', data: { zoom }, origin: 'domain' });
          this.emitEvent({ type: 'parameters.distancePerTimeUpdated', data: { distancePerTime: this.distancePerTime }, origin: 'domain' });
          // console.log(`[${new Date().toISOString()}] Display: Handled zoom.in, stepScale: ${stepScale}, new zoom: ${zoom}`);
        },
        'zoom.out': (data) => {
          const stepScale = data?.stepScale || 0.1;
          this.distancePerTime = Math.max(this.distancePerTime - stepScale * 50, 5);
          const zoom = this.distancePerTime / 50;
          this.emitEvent({ type: 'zoom.changed', data: { zoom }, origin: 'domain' });
          this.emitEvent({ type: 'parameters.distancePerTimeUpdated', data: { distancePerTime: this.distancePerTime }, origin: 'domain' });
          // console.log(`[${new Date().toISOString()}] Display: Handled zoom.out, stepScale: ${stepScale}, new zoom: ${zoom}`);
        },
        'zoom.change': (data) => {
          const zoom = Math.max(data?.minScale || 0.1, Math.min(data?.maxScale || 2, data?.zoom || 1));
          this.distancePerTime = zoom * 50;
          this.emitEvent({ type: 'zoom.changed', data: { zoom }, origin: 'domain' });
          this.emitEvent({ type: 'parameters.distancePerTimeUpdated', data: { distancePerTime: this.distancePerTime }, origin: 'domain' });
          // console.log(`[${new Date().toISOString()}] Display: Handled zoom.change, new zoom: ${zoom}`);
        },
        // CHANGE: Added handler for playback.seek event
        'playback.seek': (data) => {
          const seekTime = data?.seekTime ?? this.state.currentTime;
          if (isNaN(seekTime) || seekTime < 0) {
            console.warn(`[${new Date().toISOString()}] Display: Invalid seek time: ${seekTime}`);
            return;
          }
          // console.log(`[${new Date().toISOString()}] Display: Handling seek to ${seekTime}s`);
          this.seekTo(seekTime);
        },
      };

      const handler = handlers[event.type];
      if (handler) {
        handler(event.data);
        event.processed = true;
      } else {
        console.warn(`[${new Date().toISOString()}] Display: Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Display: Error in event processing: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.eventProcessing = false;
    }
  }

  // CHANGE: Added seekTo method to handle seeking to a specific time
private seekTo(seekTime: number): void {
  if (isNaN(seekTime) || seekTime < 0) {
    console.warn(`[${new Date().toISOString()}] Display: Invalid seek time: ${seekTime}`);
    return;
  }

  // Clamp seekTime to the total duration of the media timeline
  seekTime = Math.min(seekTime, this.state.duration);
  console.log(`[${new Date().toISOString()}] Display: Clamped seekTime to ${seekTime} (total duration: ${this.state.duration})`);

  let newIndex = -1;
  let localSecond = 0;
  let accumulatedTime = 0;

  // Log media details
  console.log(`[${new Date().toISOString()}] Display: Media durations`, this.medias.map((media, i) => ({
    index: i,
    label: media.label,
    startTime: media.startTime ?? 0,
    endTime: media.endTime ?? media.time ?? Infinity,
    duration: (media.endTime ?? media.time ?? Infinity) - (media.startTime ?? 0),
    video: media.video,
    image: media.image
  })));

  for (let i = 0; i < this.medias.length; i++) {
    const media = this.medias[i];
    const startTime = media.startTime ?? 0;
    const endTime = media.endTime ?? media.time ?? Infinity;
    const duration = endTime - startTime;

    console.log(`[${new Date().toISOString()}] Display: Checking media ${i}, seekTime: ${seekTime}, accumulatedTime: ${accumulatedTime}, duration: ${duration}, startTime: ${startTime}, endTime: ${endTime}`);

    if (seekTime >= accumulatedTime && seekTime < accumulatedTime + duration) {
      newIndex = i;
      localSecond = seekTime - accumulatedTime;
      break;
    }
    accumulatedTime += duration;
  }

  if (newIndex === -1) {
    // If seekTime equals or exceeds total duration, use the last media
    newIndex = this.medias.length - 1;
    const lastMedia = this.medias[newIndex];
    const startTime = lastMedia.startTime ?? 0;
    const endTime = lastMedia.endTime ?? lastMedia.time ?? Infinity;
    localSecond = endTime - startTime;
    console.warn(`[${new Date().toISOString()}] Display: Seek time ${seekTime} adjusted to last media index ${newIndex}, localSecond: ${localSecond}`);
  }

  console.log(`[${new Date().toISOString()}] Display: Seeking to index ${newIndex}, globalSecond: ${seekTime}, localSecond: ${localSecond}, accumulatedTime: ${accumulatedTime}`);

  this.currentMediaIndex = newIndex;
  this.state.currentTime = seekTime;
  this.cursorX = seekTime * this.distancePerTime;

  console.log(`[${new Date().toISOString()}] Display: Emitting cursor.updated with cursorX: ${this.cursorX}, globalSecond: ${seekTime}, mediaIndex: ${newIndex}, localSecond: ${localSecond}`);
  this.emitEvent({
    type: 'cursor.updated',
    data: { cursorX: this.cursorX, globalSecond: seekTime, mediaElement: this.video || this.currentImage || null, mediaIndex: newIndex, localSecond },
    origin: 'domain',
  });

  if (this.state.isPlaying) {
    console.log(`[${new Date().toISOString()}] Display: Replaying from globalSecond: ${seekTime} due to isPlaying: true`);
    this.rePlay(seekTime);
  } else {
    console.log(`[${new Date().toISOString()}] Display: Paused state, updated state to index ${newIndex}, globalSecond: ${seekTime}, localSecond: ${localSecond}`);
  }
}



  private updateDuration(duration: number): void {
    this.state.duration = duration;
    this.totalTime = duration;
    // console.log(`[${new Date().toISOString()}] Display: Duration updated to ${duration}`);
    this.emitEvent({ type: 'display.durationUpdated', data: { duration }, origin: 'domain' });
  }

  private handleInitialize(medias: Media[] | undefined): void {
    if (!medias?.length) {
      console.error(`[${new Date().toISOString()}] Display: Invalid medias for initialization`);
      return;
    }
    const { updatedMedias } = DispalyUtility.initializeMedias(medias);
    // console.log(`[${new Date().toISOString()}] Display: Initialized media list`, { count: updatedMedias.length, labels: updatedMedias.map(m => m.label) });
    Promise.resolve().then(() => this.emitEvent({ type: 'media.initialized', data: { updatedMedias }, origin: 'domain' }));
  }

  private handleDelete(index: number | undefined): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] Display: Invalid index for delete: ${index}`);
      return;
    }
    const result = DispalyUtility.delete(index);
    if (result.deletedMedia?.video?.startsWith('blob:')) URL.revokeObjectURL(result.deletedMedia.video);
    if (result.deletedMedia?.image?.startsWith('blob:')) URL.revokeObjectURL(result.deletedMedia.image);
    // console.log(`[${new Date().toISOString()}] Display: Handled delete at index ${index}`, { label: result.deletedMedia?.label || 'none' });
    this.emitEvent({ type: 'media.deleted', data: { index, deletedMedia: result.deletedMedia, updatedMedias: result.updatedMedias }, origin: 'domain' });
  }

  private handleDuplicate(index: number | undefined): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] Display: Invalid index for duplicate: ${index}`);
      return;
    }
    const result = DispalyUtility.duplicate(index);
    // console.log(`[${new Date().toISOString()}] Display: Handled duplicate at index ${index}`, { newLabel: result.duplicatedMedia?.label || 'none' });
    this.emitEvent({ type: 'media.duplicated', data: { index, duplicatedMedia: result.duplicatedMedia, updatedMedias: result.updatedMedias }, origin: 'domain' });
  }

  private handleSplit(time: number | undefined): void {
    let splitTime = typeof time === 'number' && time > 0 ? time : this.state.currentTime;
    console.log(`[${new Date().toISOString()}] Display: Handling split, input time: ${time}, using splitTime: ${splitTime}, cursorTime: ${this.state.currentTime}`);

    if (splitTime <= 0) {
      console.warn(`[${new Date().toISOString()}] Display: Invalid split time: ${splitTime}, aborting`);
      return;
    }

    const result = DispalyUtility.getVideoIndexAndStartTime(splitTime);
    if (!result) {
      console.warn(`[${new Date().toISOString()}] Display: No media found at time ${splitTime} for split`);
      return;
    }

    const { index, localSecond } = result;
    try {
      const splitResult = DispalyUtility.splitMedia(index, localSecond);
      if (!splitResult.updatedMedias.length || splitResult.updatedMedias === this.medias) {
        console.warn(`[${new Date().toISOString()}] Display: Split failed for index ${index}, splitTime ${localSecond}, no changes made`);
        return;
      }
      // console.log(`[${new Date().toISOString()}] Display: Handled split at time ${splitTime}, index ${index}, splitTime ${localSecond}, updated medias: ${splitResult.updatedMedias.length}`);
      this.emitEvent({
        type: 'media.splitted',
        data: { time: splitTime, index, splitTime: localSecond, updatedMedias: splitResult.updatedMedias },
        origin: 'domain',
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Display: Split error for index ${index}, splitTime ${localSecond}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private handleResize(index: number | undefined, time: number | undefined): void {
    if (typeof index !== 'number' || typeof time !== 'number' || time <= 0) {
      console.error(`[${new Date().toISOString()}] Display: Invalid resize data, index: ${index}, time: ${time}`);
      return;
    }
    const result = DispalyUtility.resize(index, time);
    console.log(`[${new Date().toISOString()}] Display: Resized media at index ${index} to time ${time}`, { updatedCount: result.updatedMedias.length });
    this.emitEvent({ type: 'media.resized.completed', data: { index, time, updatedMedias: result.updatedMedias }, origin: 'domain' });
  }

  private handleGetMedia(index: number | undefined): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] Display: Invalid index for media.get: ${index}`);
      return;
    }
    const media = DispalyUtility.getMedia(index);
    console.log(`[${new Date().toISOString()}] Display: Retrieved media at index ${index}`, { label: media?.label || 'none' });
    this.emitEvent({ type: 'media.get.response', data: { index, media }, origin: 'domain' });
  }



private handleImportMedia(file?: File): void {
  if (!file) {
    this.handleFileInputTrigger();
    return;
  }
  const mediaURL = URL.createObjectURL(file);
  console.log(`[${new Date().toISOString()}] Display: Created mediaURL: ${mediaURL}`, { fileName: file.name, type: file.type });

  if (file.type.startsWith('video')) {
    this.getVideoThumbnail(file).then(({ thumbnail, duration }) => {
      const media: Media = { video: mediaURL, time: duration, label: file.name, thumbnail, startTime: 0, endTime: duration, isThumbnailOnly: false };
      DispalyUtility.add(media);
      const updatedMedias = DispalyUtility.mediasSubject.getValue();
      console.log(`[${new Date().toISOString()}] Display: Imported video media`, {
        count: updatedMedias.length,
        media: this.summarizeMedia(media, updatedMedias.length - 1)
      });
      this.emitEvent({ type: 'media.imported', data: { updatedMedias }, origin: 'domain' });
    }).catch((err) => console.error(`[${new Date().toISOString()}] Display: Failed to import video: ${file.name}`, err));
  } else if (file.type.startsWith('image')) {
    const media: Media = { image: mediaURL, time: 5, label: file.name, thumbnail: mediaURL, startTime: 0, endTime: 5, isThumbnailOnly: false };
    DispalyUtility.add(media);
    const updatedMedias = DispalyUtility.mediasSubject.getValue();
    console.log(`[${new Date().toISOString()}] Display: Imported image media`, {
      count: updatedMedias.length,
      media: this.summarizeMedia(media, updatedMedias.length - 1)
    });
    this.emitEvent({ type: 'media.imported', data: { updatedMedias }, origin: 'domain' });
  } else {
    console.error(`[${new Date().toISOString()}] Display: Unsupported file type: ${file.type}`);
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
      if (!files?.length) {
        console.warn(`[${new Date().toISOString()}] Display: No files selected for import`);
        return;
      }
      Array.from(files).forEach((file) => this.handleImportMedia(file));
    };
    input.click();
  }

  private handleMediaReordered(medias: Media[] | undefined): void {
    if (!medias?.length) {
      console.error(`[${new Date().toISOString()}] Display: Invalid medias for reorder`);
      return;
    }
    DispalyUtility.initializeMedias(medias);
    // console.log(`[${new Date().toISOString()}] Display: Media list reordered`, { count: medias.length, medias: medias.map(this.summarizeMedia) });
    this.emitEvent({ type: 'media.imported', data: { updatedMedias: medias }, origin: 'domain' });
  }

  private handleCursorChange(cursorX: number): void {
    this.cursorX = cursorX;
    const globalSecond = cursorX / this.distancePerTime;
    this.state.currentTime = globalSecond;
    // console.log(`[${new Date().toISOString()}] Display: Cursor changed to ${cursorX}, globalSecond: ${globalSecond}`);
    this.emitEvent({ type: 'cursor.updated', data: { cursorX, globalSecond, mediaElement: this.video || this.currentImage || null }, origin: 'domain' });
    if (this.state.isPlaying) {
      this.rePlay(globalSecond);
    }
  }

  private handleDistancePerTimeUpdate(distancePerTime: number): void {
    this.distancePerTime = distancePerTime;
    // console.log(`[${new Date().toISOString()}] Display: distancePerTime updated to ${distancePerTime}`);
    this.emitEvent({ type: 'parameters.distancePerTimeUpdated', data: { distancePerTime }, origin: 'domain' });
  }

  private togglePlayPause(currentSecond?: number): void {
    if (this.state.isPlaying) {
      this.pausePlayback();
    } else {
      const playSecond = this.state.currentTime > 0 ? this.state.currentTime : (this.lastPausedTime > 0 ? this.lastPausedTime : (currentSecond ?? 0));
      // console.log(`[${new Date().toISOString()}] Display: Attempting to play from second: ${playSecond}`);
      this.playFromSecond(playSecond);
    }
  }

  private pausePlayback(): void {
    // console.log(`[${new Date().toISOString()}] Display: pausePlayback`, { isPlaying: this.state.isPlaying });
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    let mediaElement: HTMLVideoElement | HTMLImageElement | null = null;
    let width: number | undefined;
    let height: number | undefined;
    let currentTime: number | undefined;

    if (this.video && this.currentMediaIndex >= 0) {
      this.video.pause();
      const media = this.medias[this.currentMediaIndex];
      this.lastPausedTime = this.video.currentTime + DispalyUtility.calculateAccumulatedTime(this.currentMediaIndex);
      this.state.currentTime = this.lastPausedTime;
      // console.log(`[${new Date().toISOString()}] Display: Paused at globalSecond: ${this.lastPausedTime}`);
      mediaElement = this.video;
      width = this.video.videoWidth;
      height = this.video.videoHeight;
      currentTime = this.video.currentTime;
    } else if (this.currentImage && this.currentMediaIndex >= 0) {
      const media = this.medias[this.currentMediaIndex];
      this.lastPausedTime = this.state.currentTime;
      // console.log(`[${new Date().toISOString()}] Display: Paused image at globalSecond: ${this.lastPausedTime}`);
      mediaElement = this.currentImage;
      width = this.currentImage.width;
      height = this.currentImage.height;
      currentTime = this.state.currentTime - DispalyUtility.calculateAccumulatedTime(this.currentMediaIndex);
    }

    this.state.isPlaying = false;
    this.emitEvent({ type: 'playback.toggled', data: { isPlaying: false, currentTime: this.state.currentTime }, origin: 'domain' });
    this.emitEvent({
      type: 'render.frame',
      data: { mediaElement, width, height, currentTime },
      origin: 'domain',
      processed: false,
    });
  }

  private playFromSecond(globalSecond: number): void {
    // console.log(`[${new Date().toISOString()}] Display: playFromSecond`, { globalSecond, medias: this.medias.map(this.summarizeMedia) });
    if (!isFinite(globalSecond) || globalSecond < 0) {
      console.warn(`[${new Date().toISOString()}] Display: Invalid globalSecond: ${globalSecond}, defaulting to 0`);
      globalSecond = 0;
    }

    if (!this.medias.length) {
      console.error(`[${new Date().toISOString()}] Display: No medias available to play`);
      this.stopPlayback();
      return;
    }

    const result = DispalyUtility.getVideoIndexAndStartTime(globalSecond);
    // console.log(`[${new Date().toISOString()}] Display: getVideoIndexAndStartTime result`, result);
    if (!result) {
      console.warn(`[${new Date().toISOString()}] Display: No media found at time ${globalSecond}`);
      this.stopPlayback();
      return;
    }

    this.currentMediaIndex = result.index;
    // console.log(`[${new Date().toISOString()}] Display: Playing media at index ${result.index}, localSecond: ${result.localSecond}`);
    this.renderMedia(result.index, result.localSecond);
  }

  private stopPlayback(): void {
    // console.log(`[${new Date().toISOString()}] Display: stopPlayback`, { isPlaying: this.state.isPlaying });
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.video) {
      this.video.pause();
      this.video.remove();
      this.video = null;
    }
    this.currentImage = null;
    this.state.isPlaying = false;
    this.currentMediaIndex = -1;
    this.emitEvent({ type: 'playback.toggled', data: { isPlaying: false, currentTime: this.state.currentTime }, origin: 'domain' });
    this.emitEvent({ type: 'render.frame', data: { mediaElement: null }, origin: 'domain', processed: false });
  }

  private renderMedia(index: number, localSecond: number): void {
    if (index < 0 || index >= this.medias.length) {
      console.error(`[${new Date().toISOString()}] Display: Invalid index or no media available: ${index}, media count: ${this.medias.length}`);
      this.stopPlayback();
      return;
    }

    // console.log(`[${new Date().toISOString()}] Display: Rendering media at index ${index}, localSecond: ${localSecond}, currentPlaybackRate: ${this.state.playbackSpeed}`);

    this.stopPlayback();
    this.currentMediaIndex = index;
    const media = this.medias[index];
    if (!media || (!media.video && !media.image)) {
      console.error(`[${new Date().toISOString()}] Display: Invalid media at index ${index}, no video or image provided`);
      this.tryNextMedia(index + 1);
      return;
    }

    const startTime = media.startTime ?? 0;
    const endTime = media.endTime ?? media.time ?? Infinity;
    const duration = endTime - startTime;
    const accumulatedBefore = DispalyUtility.calculateAccumulatedTime(index);

    // console.log(`[${new Date().toISOString()}] Display: Media details`, {
    //   index,
    //   label: media.label,
    //   isVideo: !!media.video,
    //   isImage: !!media.image,
    //   startTime,
    //   endTime,
    //   duration,
    //   accumulatedBefore,
    //   playbackRate: this.state.playbackSpeed
    // });

    if (media.video) {
      this.renderVideo(media, index, localSecond, { startTime, endTime, duration, accumulatedBefore });
    } else if (media.image) {
      this.renderImage(media, index, localSecond, { startTime, duration, accumulatedBefore });
    }
  }

  private renderVideo(media: Media, index: number, localSecond: number, timing: { startTime: number; endTime: number; duration: number; accumulatedBefore: number }): void {
    if (!media.video?.match(/^(blob:|\/assets\/videos\/)/)) {
      console.error(`[${new Date().toISOString()}] Display: Invalid video URL for ${media.label}, url: ${media.video}`);
      this.tryNextMedia(index + 1, timing.accumulatedBefore + timing.duration);
      return;
    }

    this.video = document.createElement('video');
    this.video.dataset['id'] = `video-${Date.now()}`; // Added for debugging
    Object.assign(this.video, {
      src: media.video,
      crossOrigin: 'anonymous',
      muted: false,
      preload: 'auto',
      volume: this.state.volume,
      playbackRate: this.state.playbackSpeed
    });

    // console.log(`[${new Date().toISOString()}] Display: Created video element with playbackRate: ${this.state.playbackSpeed}, videoSrc: ${media.video}, videoId: ${this.video.dataset['id']}`);

    const handleMetadata = () => {
      // console.log(`[${new Date().toISOString()}] Display: Video metadata loaded: ${media.label}`, {
      //   duration: this.video!.duration,
      //   width: this.video!.videoWidth,
      //   height: this.video!.videoHeight,
      //   endTime: timing.endTime,
      //   playbackRate: this.video!.playbackRate
      // });
      this.video!.playbackRate = this.state.playbackSpeed;
      // console.log(`[${new Date().toISOString()}] Display: Reapplied playbackRate after metadata: ${this.video!.playbackRate}`);

      const actualEndTime = Math.min(timing.duration, this.video!.duration);
      let seekTime = localSecond;

      if (!isFinite(seekTime) || seekTime < 0) {
        seekTime = 0;
        console.warn(`[${new Date().toISOString()}] Display: Clamped seekTime to 0 for ${media.label}`);
      } else if (seekTime > actualEndTime) {
        seekTime = actualEndTime;
        console.warn(`[${new Date().toISOString()}] Display: Clamped seekTime from ${seekTime} to ${actualEndTime} for ${media.label}`);
      }

      this.video!.currentTime = seekTime;
      this.state.currentTime = timing.accumulatedBefore + seekTime;
      this.cursorX = this.state.currentTime * this.distancePerTime;
      // console.log(`[${new Date().toISOString()}] Display: Video seeked to ${seekTime} (global: ${this.state.currentTime}, cursorX: ${this.cursorX}) for ${media.label}, videoId: ${this.video!.dataset['id']}`);

      this.emitEvent({
        type: 'cursor.updated',
        data: { cursorX: this.cursorX, globalSecond: this.state.currentTime, mediaElement: this.video },
        origin: 'domain',
      });

      this.video!.play().then(() => {
        // console.log(`[${new Date().toISOString()}] Display: Video playback started, playbackRate: ${this.video!.playbackRate}`);
        this.startVideoLoops(media, index, timing, actualEndTime);
      }).catch((err) => {
        console.error(`[${new Date().toISOString()}] Display: Video play failed for ${media.label}, src: ${media.video}`, err.message);
        this.tryNextMedia(index + 1, timing.accumulatedBefore + timing.duration);
      });
    };

    this.video.addEventListener('loadedmetadata', handleMetadata);
    this.video.addEventListener('error', (e) => {
      console.error(`[${new Date().toISOString()}] Display: Video error for ${media.label}, src: ${media.video}`, this.video?.error, e);
      this.tryNextMedia(index + 1, timing.accumulatedBefore + timing.duration);
    });
    this.video.addEventListener('ended', () => {
      // console.log(`[${new Date().toISOString()}] Display: Video ended event for ${media.label}`, {
      //   currentTime: this.video?.currentTime,
      //   nextIndex: index + 1,
      //   playbackRate: this.video?.playbackRate
      // });
      this.tryNextMedia(index + 1, timing.accumulatedBefore + timing.duration);
    });

    this.video.addEventListener('loadeddata', () => {
      this.video!.playbackRate = this.state.playbackSpeed;
      console.log(`[${new Date().toISOString()}] Display: Reapplied playbackRate after loadeddata: ${this.video!.playbackRate}`);
    });

    this.video.load();
  }

  private startVideoLoops(media: Media, index: number, timing: { startTime: number; endTime: number; duration: number; accumulatedBefore: number }, actualEndTime: number): void {
    // console.log(`[${new Date().toISOString()}] Display: Video playing: ${media.label}`, {
    //   currentTime: this.video!.currentTime,
    //   accumulatedBefore: timing.accumulatedBefore,
    //   duration: timing.duration,
    //   playbackRate: this.video!.playbackRate
    // });
    this.state.isPlaying = true;
    this.emitEvent({ type: 'playback.toggled', data: { isPlaying: true, currentTime: this.state.currentTime }, origin: 'domain' });

    const renderFrame = () => {
      if (!this.state.isPlaying || !this.video || this.video.paused || this.video.ended) {
        // console.log(`[${new Date().toISOString()}] Display: Stopping render loop for ${media.label}`, {
        //   isPlaying: this.state.isPlaying,
        //   paused: this.video?.paused,
        //   ended: this.video?.ended
        // });
        return;
      }
      this.emitEvent({
        type: 'render.frame',
        data: { mediaElement: this.video, width: this.video.videoWidth, height: this.video.videoHeight, currentTime: this.video.currentTime },
        origin: 'domain',
        processed: false,
      });
      requestAnimationFrame(renderFrame);
    };

    const updateCursor = () => {
      if (!this.state.isPlaying || !this.video || this.video.paused) {
        // console.log(`[${new Date().toISOString()}] Display: Stopping cursor update for ${media.label}`, {
        //   isPlaying: this.state.isPlaying,
        //   paused: this.video?.paused,
        //   ended: this.video?.ended
        // });
        this.stopPlayback();
        return;
      }

      const currentLocalSecond = this.video.currentTime;
      const currentGlobalSecond = timing.accumulatedBefore + currentLocalSecond;
      this.state.currentTime = currentGlobalSecond;
      this.cursorX = this.state.currentTime * this.distancePerTime;

      // console.log(`[${new Date().toISOString()}] Display: Updating cursor for ${media.label}`, {
      //   currentTime: this.video.currentTime,
      //   localSecond: currentLocalSecond,
      //   globalSecond: currentGlobalSecond,
      //   cursorX: this.cursorX,
      //   distancePerTime: this.distancePerTime,
      //   actualEndTime,
      //   ended: this.video.ended,
      //   playbackRate: this.video.playbackRate
      // });

      this.emitEvent({
        type: 'cursor.updated',
        data: { cursorX: this.cursorX, globalSecond: currentGlobalSecond, mediaElement: this.video },
        origin: 'domain',
      });

      if (currentLocalSecond >= actualEndTime - this.options.endTimeTolerance || this.video.ended) {
        // console.log(`[${new Date().toISOString()}] Display: Video ended: ${media.label}`, {
        //   currentTime: this.video.currentTime,
        //   duration: timing.duration,
        //   nextIndex: index + 1
        // });
        this.tryNextMedia(index + 1, timing.accumulatedBefore + timing.duration);
      } else {
        this.updateTimer = setTimeout(updateCursor, 16);
      }
    };

    requestAnimationFrame(renderFrame);
    this.updateTimer = setTimeout(updateCursor, 16);
  }

  private renderImage(media: Media, index: number, localSecond: number, timing: { startTime: number; duration: number; accumulatedBefore: number }): void {
    // console.log(`[${new Date().toISOString()}] Display: Setting up image for ${media.label}`, {
    //   src: media.image,
    //   playbackSpeed: this.state.playbackSpeed
    // });
    if (media.isThumbnailOnly) {
      console.warn(`[${new Date().toISOString()}] Display: Skipping image rendering for ${media.label} as it is marked thumbnail-only`, { src: media.image });
      this.tryNextMedia(index + 1, timing.accumulatedBefore + timing.duration);
      return;
    }

    const image = new Image();
    image.src = media.image!;
    image.crossOrigin = 'anonymous';
    image.dataset['id'] = `image-${Date.now()}`;

    image.onload = () => {
      // console.log(`[${new Date().toISOString()}] Display: Image loaded: ${media.label}`, {
      //   width: image.width,
      //   height: image.height,
      //   imageId: image.dataset['id'],
      //   playbackSpeed: this.state.playbackSpeed
      // });
      this.currentImage = image;
      this.state.isPlaying = true;
      this.state.currentTime = timing.accumulatedBefore + localSecond;
      this.cursorX = this.state.currentTime * this.distancePerTime;

      // console.log(`[${new Date().toISOString()}] Display: Image seeked to ${localSecond} (global: ${this.state.currentTime}, cursorX: ${this.cursorX}) for ${media.label}, imageId: ${image.dataset['id']}`);

      this.emitEvent({ type: 'playback.toggled', data: { isPlaying: true, currentTime: this.state.currentTime }, origin: 'domain' });
      this.emitEvent({
        type: 'cursor.updated',
        data: { cursorX: this.cursorX, globalSecond: this.state.currentTime, mediaElement: image },
        origin: 'domain',
      });

      let currentLocalSecond = localSecond;
      const updateImageTimer = () => {
        if (!this.state.isPlaying) {
          // console.log(`[${new Date().toISOString()}] Display: Stopping image timer for ${media.label}`);
          this.stopPlayback();
          return;
        }

        this.emitEvent({
          type: 'render.frame',
          data: { mediaElement: image, width: image.width, height: image.height, currentTime: currentLocalSecond },
          origin: 'domain',
          processed: false,
        });

        const timeIncrement = this.options.frameInterval * this.state.playbackSpeed;
        currentLocalSecond += timeIncrement;
        const currentGlobalSecond = timing.accumulatedBefore + currentLocalSecond;
        this.state.currentTime = currentGlobalSecond;
        this.cursorX = currentGlobalSecond * this.distancePerTime;

        // console.log(`[${new Date().toISOString()}] Display: Updating image cursor for ${media.label}`, {
        //   imageId: image.dataset['id'],
        //   localSecond: currentLocalSecond,
        //   globalSecond: currentGlobalSecond,
        //   cursorX: this.cursorX,
        //   playbackSpeed: this.state.playbackSpeed,
        //   timeIncrement
        // });

        this.emitEvent({
          type: 'cursor.updated',
          data: { cursorX: this.cursorX, globalSecond: currentGlobalSecond, mediaElement: image },
          origin: 'domain',
        });

        if (currentLocalSecond >= timing.duration) {
          // console.log(`[${new Date().toISOString()}] Display: Image ended: ${media.label}`, {
          //   nextIndex: index + 1,
          //   playbackSpeed: this.state.playbackSpeed
          // });
          this.tryNextMedia(index + 1, timing.accumulatedBefore + timing.duration);
        } else {
          this.updateTimer = setTimeout(updateImageTimer, 16);
        }
      };
      this.updateTimer = setTimeout(updateImageTimer, 16);
    };

    image.onerror = () => {
      console.error(`[${new Date().toISOString()}] Display: Image error for ${media.label}, src: ${media.image}`);
      this.tryNextMedia(index + 1, timing.accumulatedBefore + timing.duration);
    };
  }

  private tryNextMedia(nextIndex: number, globalSecond?: number): void {
    // console.log(`[${new Date().toISOString()}] Display: Trying next media`, { nextIndex, globalSecond });
    if (nextIndex >= this.medias.length) {
      console.warn(`[${new Date().toISOString()}] Display: No more media to try, restarting playback`);
      this.rePlay(0);
      return;
    }
    this.renderMedia(nextIndex, 0);
  }

  private rePlay(globalSecond: number): void {
    // console.log(`[${new Date().toISOString()}] Display: Replaying from globalSecond: ${globalSecond}`);
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
        video.currentTime = Math.min(seekTo, video.duration / 2);
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/png');
        URL.revokeObjectURL(video.src);
        resolve({ thumbnail, duration: video.duration });
      };

      video.onerror = () => reject('Error while loading video');
    });
  }

  private setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.state.volume = clampedVolume;
    if (this.video) {
      this.video.volume = clampedVolume;
    }
    // console.log(`[${new Date().toISOString()}] Display: Volume set to ${clampedVolume}`);
    this.emitEvent({ type: 'volume.changed', data: { volume: clampedVolume }, origin: 'domain' });
  }

  private setPlaybackSpeed(playbackSpeed: number): void {
    const validSpeeds = [0.5, 1, 1.5, 2];
    const clampedSpeed = validSpeeds.includes(playbackSpeed) ? playbackSpeed : 1;
    this.state.playbackSpeed = clampedSpeed;
    if (this.video) {
      this.video.playbackRate = clampedSpeed;
      // console.log(`[${new Date().toISOString()}] Display: Applied playback speed ${clampedSpeed} to video, currentTime: ${this.video.currentTime}`);
    }
    this.emitEvent({ type: 'playback.speed.changed', data: { playbackSpeed: clampedSpeed }, origin: 'domain' });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.stopPlayback();
    this.medias.forEach(media => {
      if (media.video?.startsWith('blob:')) URL.revokeObjectURL(media.video);
      if (media.image?.startsWith('blob:')) URL.revokeObjectURL(media.image);
    });
  }
}