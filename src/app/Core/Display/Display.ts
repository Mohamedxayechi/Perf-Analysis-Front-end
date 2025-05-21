import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Engine } from '../Engine';
import { eventBus, EventPayload } from '../Utility/event-bus';
import { Media } from './Models/media-model';
import { DisplayUtility } from './Utility/Displayutility';
import * as MP4Box from 'mp4box';

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
  private skipInterval = 5;
  private state: State = { isPlaying: false, currentTime: 0, duration: 0, volume: 0.5, playbackSpeed: 1 };
  private options: RenderOptions = { frameInterval: 0.016, endTimeTolerance: 0.1 };

  constructor() {
    this.setupSubscriptions();
  }

  private emitEvent(event: EventPayload): void {
    Engine.getInstance().emit({ ...event, processed: false, origin: event.origin || 'domain' });
  }

  private setupSubscriptions(): void {
    console.log(`[${new Date().toISOString()}] Display: Setting up subscriptions`);
    this.subscription.add(
      DisplayUtility.medias$.subscribe((medias) => {
        this.medias = medias;
        console.log(`[${new Date().toISOString()}] Display: Media list updated`, { count: medias.length, medias: medias.map(this.summarizeMedia) });
        this.emitEvent({ type: 'Display.media.imported', data: { updatedMedias: medias }, origin: 'domain' });
      })
    );

    this.subscription.add(
      DisplayUtility.totalTime$.subscribe((duration) => {
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
    if (this.eventProcessing || event.processed) {
      console.warn(`[${new Date().toISOString()}] Display: Skipped event: ${event.type}, eventProcessing: ${this.eventProcessing}, processed: ${event.processed}`);
      return;
    }

    this.eventProcessing = true;
    try {
      const handlers: { [key: string]: (data: any) => void } = {
     
        'MediaInitializerComponent.media.initialize': (data) => this.handleInitialize(data?.medias),
        'ItemListMenuComponent.media.delete': (data) => this.handleDelete(data?.index),
        'ItemListMenuComponent.media.duplicate': (data) => this.handleDuplicate(data?.index),
        'ActionsBarComponent.media.split': (data) => {
          const splitTime = typeof data?.time === 'number' && data.time > 0 ? data.time : this.state.currentTime;
          this.handleSplit(splitTime);
        },
       
        'ActionsBarComponent.media.import.trigger': () => this.handleFileInputTrigger(),
        'DragDropHorizontalortingComponent.media.reordered': (data) => this.handleMediaReordered(data?.medias),
        'ResizableDirective.media.resized': (data) => this.handleResize(data?.index, data?.time),
       
        'ActionsBarComponent.media.convertToMP4': () => this.handleConvertToMP4(),
        'playback.playFromSecond': (data) => this.playFromSecond(data?.globalSecond || 0),
        'ActionsBarComponent.playback.toggle': (data) => {
          this.togglePlayPause();
        },
        
        'ActionsBarComponent.skip.interval.changed': (data) => {
          const skipInterval = data?.skipInterval;
          if (isNaN(skipInterval) || ![5, 10, 30].includes(skipInterval)) {
            console.warn(`[${new Date().toISOString()}] Display: Invalid skip interval: ${skipInterval}`);
            return;
          }
          this.skipInterval = skipInterval;
          this.emitEvent({
            type: 'Display.skip.interval.updated',
            data: { skipInterval: this.skipInterval },
            origin: 'domain',
          });
        },
        'ActionsBarComponent.playback.skip.forward': () => {
          const currentSecond = this.state.currentTime;
          const newSecond = Math.min(currentSecond + this.skipInterval, this.state.duration);
          this.seekTo(newSecond);
        },
        'ActionsBarComponent.playback.skip.backward': () => {
          const currentSecond = this.state.currentTime;
          const newSecond = Math.max(0, currentSecond - this.skipInterval);
          this.seekTo(newSecond);
        },
        'MainVideoEditComponent.cursor.changed': (data) => this.handleCursorChange(data?.cursorX || 0),
        'MainVideoEditComponent.parameters.distancePerTimeUpdated': (data) => this.handleDistancePerTimeUpdate(data?.distancePerTime || this.distancePerTime),
        'ActionsBarComponent.volume.changed': (data) => {
          const volume = Math.max(0, Math.min(1, data?.volume ?? this.state.volume));
          this.setVolume(volume);
        },
        'ActionsBarComponent.playback.speed.changed': (data) => {
          const playbackSpeed = data?.playbackSpeed ?? this.state.playbackSpeed;
          this.setPlaybackSpeed(playbackSpeed);
        },
        'ZoomComponent.zoom.get': () => {
          const zoom = this.distancePerTime / 50;
          this.emitEvent({ type: 'Display.zoom.changed', data: { zoom }, origin: 'domain' });
        },
        'ZoomComponent.zoom.in': (data) => {
          const stepScale = data?.stepScale || 0.1;
          this.distancePerTime = Math.min(this.distancePerTime + stepScale * 50, 100);
          const zoom = this.distancePerTime / 50;
          this.emitEvent({ type: 'Display.zoom.changed', data: { zoom }, origin: 'domain' });
          this.emitEvent({ type: 'Display.parameters.distancePerTimeUpdated', data: { distancePerTime: this.distancePerTime }, origin: 'domain' });
        },
        'ZoomComponent.zoom.out': (data) => {
          const stepScale = data?.stepScale || 0.1;
          this.distancePerTime = Math.max(this.distancePerTime - stepScale * 50, 5);
          const zoom = this.distancePerTime / 50;
          this.emitEvent({ type: 'Display.zoom.changed', data: { zoom }, origin: 'domain' });
          this.emitEvent({ type: 'Display.parameters.distancePerTimeUpdated', data: { distancePerTime: this.distancePerTime }, origin: 'domain' });
        },
        'ZoomComponent.zoom.change': (data) => {
          const zoom = Math.max(data?.minScale || 0.1, Math.min(data?.maxScale || 2, data?.zoom || 1));
          this.distancePerTime = zoom * 50;
          this.emitEvent({ type: 'Display.zoom.changed', data: { zoom }, origin: 'domain' });
          this.emitEvent({ type: 'Display.parameters.distancePerTimeUpdated', data: { distancePerTime: this.distancePerTime }, origin: 'domain' });
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

  private async handleConvertToMP4(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Display: Handling convert to MP4`);
    const imageMedias = this.medias.filter(media => media.image && !media.isThumbnailOnly);
    if (!imageMedias.length) {
      console.warn(`[${new Date().toISOString()}] Display: No images to convert to MP4`);
      this.emitEvent({ type: 'Display.media.convertToMP4.completed', data: { updatedMedias: this.medias }, origin: 'domain' });
      return;
    }

    try {
      const { videoURL, duration, updatedMedias } = await this.convertImagesToMP4(imageMedias);
      console.log(`[${new Date().toISOString()}] Display: MP4 conversion successful, duration: ${duration}, videoURL: ${videoURL}, updated medias: ${updatedMedias.length}`);

      // Update media list and duration
      DisplayUtility.initializeMedias(updatedMedias);
      this.updateDuration(DisplayUtility.getTotalTime());
      console.log(`[${new Date().toISOString()}] Display: Media list updated after MP4 conversion`, { count: updatedMedias.length });

      this.emitEvent({
        type: 'Display.media.convertToMP4.completed',
        data: { updatedMedias, videoURL },
        origin: 'domain',
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Display: Error during MP4 conversion: ${error instanceof Error ? error.message : String(error)}`);
      this.emitEvent({
        type: 'Display.media.convertToMP4.failed',
        data: { error: error instanceof Error ? error.message : String(error) },
        origin: 'domain',
      });
    }
  }

  private async convertImagesToMP4(imageMedias: Media[]): Promise<{ videoURL: string; duration: number; updatedMedias: Media[] }> {
    const mp4box = MP4Box.createFile();
    let trackId: number;
    let totalDuration = 0;
    const FPS = 30;
    const timescale = 1000;

    for (const [index, media] of imageMedias.entries()) {
      if (!media.image) continue;
      const duration = ((media.endTime ?? media.time ?? 5) - (media.startTime ?? 0)) * timescale;
      totalDuration += duration;

      const image = new Image();
      image.src = media.image;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error(`Failed to load image: ${media.image}`));
      });

      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);

      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      if (index === 0) {
        // Initialize video track
        trackId = mp4box.addTrack({
          timescale,
          width: canvas.width,
          height: canvas.height,
          avcDecoderConfigRecord: null,
        });
      }

      // Add image as a single frame for its duration
      const sample = {
        data: frameData.buffer,
        size: frameData.length,
        duration,
        cts: totalDuration - duration,
        dts: totalDuration - duration,
        is_sync: true,
      };
      mp4box.addSample(trackId!, sample);
    }

    mp4box.setSegmentOptions(trackId!, null, {
      nbSamples: 1000,
    });

    const buffer = await new Promise<Uint8Array>((resolve) => {
      const chunks: Uint8Array[] = [];
      mp4box.onSegment = (id: number, user: any, buffer: ArrayBuffer, sampleNumber: number, last: boolean) => {
        chunks.push(new Uint8Array(buffer));
        if (last) {
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }
          resolve(result);
        }
      };
      mp4box.start();
    });

    const blob = new Blob([buffer], { type: 'video/mp4' });
    const videoURL = URL.createObjectURL(blob);

    // Create a new media object for the MP4
    const newMedia: Media = {
      video: videoURL,
      time: totalDuration / timescale,
      label: 'Converted_Video.mp4',
      thumbnail: imageMedias[0].thumbnail || imageMedias[0].image!,
      startTime: 0,
      endTime: totalDuration / timescale,
      isThumbnailOnly: false,
    };

    // Replace images with the new MP4 in the media list
    const firstImageIndex = this.medias.findIndex(media => media.image && !media.isThumbnailOnly);
    const updatedMedias = [
      ...this.medias.slice(0, firstImageIndex),
      newMedia,
      ...this.medias.slice(firstImageIndex + imageMedias.length).map(media => ({
        ...media,
        startTime: (media.startTime ?? 0) + (totalDuration / timescale) - imageMedias.reduce((sum, m) => sum + ((m.endTime ?? m.time ?? 0) - (m.startTime ?? 0)), 0),
        endTime: (media.endTime ?? media.time ?? 0) + (totalDuration / timescale) - imageMedias.reduce((sum, m) => sum + ((m.endTime ?? m.time ?? 0) - (m.startTime ?? 0)), 0),
      })),
    ];

    return { videoURL, duration: totalDuration / timescale, updatedMedias };
  }

  private seekTo(seekTime: number): void {
    if (isNaN(seekTime) || seekTime < 0) {
      console.warn(`[${new Date().toISOString()}] Display: Invalid seek time: ${seekTime}`);
      return;
    }

    seekTime = Math.min(seekTime, this.state.duration);

    let newIndex = -1;
    let localSecond = 0;
    let accumulatedTime = 0;

    for (let i = 0; i < this.medias.length; i++) {
      const media = this.medias[i];
      const startTime = media.startTime ?? 0;
      const endTime = media.endTime ?? media.time ?? Infinity;
      const duration = endTime - startTime;

      if (seekTime >= accumulatedTime && seekTime < accumulatedTime + duration) {
        newIndex = i;
        localSecond = seekTime - accumulatedTime;
        break;
      }
      accumulatedTime += duration;
    }

    if (newIndex === -1) {
      newIndex = this.medias.length - 1;
      const lastMedia = this.medias[newIndex];
      const startTime = lastMedia.startTime ?? 0;
      const endTime = lastMedia.endTime ?? lastMedia.time ?? Infinity;
      localSecond = endTime - startTime;
      console.warn(`[${new Date().toISOString()}] Display: Seek time ${seekTime} adjusted to last media index ${newIndex}, localSecond: ${localSecond}`);
    }

    this.currentMediaIndex = newIndex;
    this.state.currentTime = seekTime;
    this.cursorX = seekTime * this.distancePerTime;

    this.emitEvent({
      type: 'Display.cursor.updated',
      data: { cursorX: this.cursorX, globalSecond: seekTime, mediaElement: this.video || this.currentImage || null, mediaIndex: newIndex, localSecond },
      origin: 'domain',
    });

    if (this.state.isPlaying) {
      this.rePlay(seekTime);
    }
  }

  private updateDuration(duration: number): void {
    this.state.duration = duration;
    this.totalTime = duration;
    this.emitEvent({ type: 'Display.display.durationUpdated', data: { duration }, origin: 'domain' });
  }

  private handleInitialize(medias: Media[] | undefined): void {
    if (!medias?.length) {
      console.error(`[${new Date().toISOString()}] Display: Invalid medias for initialization`);
      return;
    }
    const { updatedMedias } = DisplayUtility.initializeMedias(medias);
    Promise.resolve().then(() => this.emitEvent({ type: 'Display.media.initialized', data: { updatedMedias }, origin: 'domain' }));
  }

  private handleDelete(index: number | undefined): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] Display: Invalid index for delete: ${index}`);
      return;
    }
    const result = DisplayUtility.delete(index);
    if (result.deletedMedia?.video?.startsWith('blob:')) URL.revokeObjectURL(result.deletedMedia.video);
    if (result.deletedMedia?.image?.startsWith('blob:')) URL.revokeObjectURL(result.deletedMedia.image);
    this.emitEvent({ type: 'Display.media.deleted', data: { index, deletedMedia: result.deletedMedia, updatedMedias: result.updatedMedias }, origin: 'domain' });
  }

  private handleDuplicate(index: number | undefined): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] Display: Invalid index for duplicate: ${index}`);
      return;
    }
    const result = DisplayUtility.duplicate(index);
    this.emitEvent({ type: 'Display.media.duplicated', data: { index, duplicatedMedia: result.duplicatedMedia, updatedMedias: result.updatedMedias }, origin: 'domain' });
  }

  private handleSplit(time: number): void {
    if (time <= 0) {
      console.warn(`[${new Date().toISOString()}] Display: Invalid split time: ${time}, aborting`);
      return;
    }

    const result = DisplayUtility.getVideoIndexAndStartTime(time);
    if (!result) {
      console.warn(`[${new Date().toISOString()}] Display: No media found at time ${time} for split`);
      return;
    }

    const { index, localSecond } = result;
    try {
      const splitResult = DisplayUtility.splitMedia(index, localSecond);
      if (!splitResult.updatedMedias.length || splitResult.updatedMedias === this.medias) {
        console.warn(`[${new Date().toISOString()}] Display: Split failed for index ${index}, splitTime ${localSecond}, no changes made`);
        return;
      }
      this.emitEvent({
        type: 'Display.media.splitted',
        data: { time, index, splitTime: localSecond, updatedMedias: splitResult.updatedMedias },
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
    const result = DisplayUtility.resize(index, time);
    
    this.emitEvent({ type: 'Display.media.resized.completed', data: { index, time, updatedMedias: result.updatedMedias }, origin: 'domain' });
  }

  


  private handleImportMedia(file?: File): void {
    if (!file) {
      this.handleFileInputTrigger();
      return;
    }
    const mediaURL = URL.createObjectURL(file);
    if (file.type.startsWith('video')) {
      this.getVideoThumbnail(file).then(({ thumbnail, duration }) => {
        const media: Media = { video: mediaURL, time: duration, label: file.name, thumbnail, startTime: 0, endTime: duration, isThumbnailOnly: false };
        DisplayUtility.add(media);
        const updatedMedias = DisplayUtility.mediasSubject.getValue();
        this.emitEvent({ type: 'Display.media.imported', data: { updatedMedias }, origin: 'domain' });
      }).catch((err) => console.error(`[${new Date().toISOString()}] Display: Failed to import video: ${file.name}`, err));
    } else if (file.type.startsWith('image')) {
      const media: Media = { image: mediaURL, time: 5, label: file.name, thumbnail: mediaURL, startTime: 0, endTime: 5, isThumbnailOnly: false };
      DisplayUtility.add(media);
      const updatedMedias = DisplayUtility.mediasSubject.getValue();
      this.emitEvent({ type: 'Display.media.imported', data: { updatedMedias }, origin: 'domain' });
    } else {
      console.error(`[${new Date().toISOString()}] Display: Unsupported file type: ${file.type}`);
    }
  }

  private handleFileInputTrigger(): void {
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
    DisplayUtility.initializeMedias(medias);
    this.emitEvent({ type: 'Display.media.imported', data: { updatedMedias: medias }, origin: 'domain' });
  }

  private handleCursorChange(cursorX: number): void {
    this.cursorX = cursorX;
    const globalSecond = cursorX / this.distancePerTime;
    this.state.currentTime = globalSecond;
    this.emitEvent({ type: 'Display.cursor.updated', data: { cursorX, globalSecond, mediaElement: this.video || this.currentImage || null }, origin: 'domain' });
    if (this.state.isPlaying) {
      this.rePlay(globalSecond);
    }
  }

  private handleDistancePerTimeUpdate(distancePerTime: number): void {
    this.distancePerTime = distancePerTime;
    this.emitEvent({ type: 'Display.parameters.distancePerTimeUpdated', data: { distancePerTime }, origin: 'domain' });
  }

  private togglePlayPause(): void {
    if (this.state.isPlaying) {
      this.pausePlayback();
    } else {
      const playSecond = this.state.currentTime > 0 ? this.state.currentTime : (this.lastPausedTime > 0 ? this.lastPausedTime : 0);
      this.playFromSecond(playSecond);
    }
  }

  private pausePlayback(): void {
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
      this.lastPausedTime = this.video.currentTime + DisplayUtility.calculateAccumulatedTime(this.currentMediaIndex);
      this.state.currentTime = this.lastPausedTime;
      mediaElement = this.video;
      width = this.video.videoWidth;
      height = this.video.videoHeight;
      currentTime = this.video.currentTime;
    } else if (this.currentImage && this.currentMediaIndex >= 0) {
      const media = this.medias[this.currentMediaIndex];
      this.lastPausedTime = this.state.currentTime;
      mediaElement = this.currentImage;
      width = this.currentImage.width;
      height = this.currentImage.height;
      currentTime = this.state.currentTime - DisplayUtility.calculateAccumulatedTime(this.currentMediaIndex);
    }

    this.state.isPlaying = false;
    this.emitEvent({ type: 'Display.playback.toggled', data: { isPlaying: false, currentTime: this.state.currentTime }, origin: 'domain' });
    this.emitEvent({
      type: 'Display.render.frame',
      data: { mediaElement, width, height, currentTime },
      origin: 'domain',
      processed: false,
    });
  }

  private playFromSecond(globalSecond: number): void {
    if (!isFinite(globalSecond) || globalSecond < 0) {
      console.warn(`[${new Date().toISOString()}] Display: Invalid globalSecond: ${globalSecond}, defaulting to 0`);
      globalSecond = 0;
    }

    if (!this.medias.length) {
      console.error(`[${new Date().toISOString()}] Display: No medias available to play`);
      this.stopPlayback();
      return;
    }

    const result = DisplayUtility.getVideoIndexAndStartTime(globalSecond);
    if (!result) {
      console.warn(`[${new Date().toISOString()}] Display: No media found at time ${globalSecond}`);
      this.stopPlayback();
      return;
    }

    this.currentMediaIndex = result.index;
    this.renderMedia(result.index, result.localSecond);
  }

  private stopPlayback(): void {
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
    this.emitEvent({ type: 'Display.playback.toggled', data: { isPlaying: false, currentTime: this.state.currentTime }, origin: 'domain' });
    this.emitEvent({ type: 'Display.render.frame', data: { mediaElement: null }, origin: 'domain', processed: false });
  }

  private renderMedia(index: number, localSecond: number): void {
    if (index < 0 || index >= this.medias.length) {
      console.error(`[${new Date().toISOString()}] Display: Invalid index or no media available: ${index}, media count: ${this.medias.length}`);
      this.stopPlayback();
      return;
    }

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
    const accumulatedBefore = DisplayUtility.calculateAccumulatedTime(index);

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
    this.video.dataset['id'] = `video-${Date.now()}`;
    Object.assign(this.video, {
      src: media.video,
      crossOrigin: 'anonymous',
      muted: false,
      preload: 'auto',
      volume: this.state.volume,
      playbackRate: this.state.playbackSpeed
    });

    const handleMetadata = () => {
      this.video!.playbackRate = this.state.playbackSpeed;
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

      this.emitEvent({
        type: 'Display.cursor.updated',
        data: { cursorX: this.cursorX, globalSecond: this.state.currentTime, mediaElement: this.video },
        origin: 'domain',
      });

      this.video!.play().then(() => {
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
      this.tryNextMedia(index + 1, timing.accumulatedBefore + timing.duration);
    });

    this.video.addEventListener('loadeddata', () => {
      this.video!.playbackRate = this.state.playbackSpeed;
    });

    this.video.load();
  }

  private startVideoLoops(media: Media, index: number, timing: { startTime: number; endTime: number; duration: number; accumulatedBefore: number }, actualEndTime: number): void {
    this.state.isPlaying = true;
    this.emitEvent({ type: 'Display.playback.toggled', data: { isPlaying: true, currentTime: this.state.currentTime }, origin: 'domain' });

    const renderFrame = () => {
      if (!this.state.isPlaying || !this.video || this.video.paused || this.video.ended) {
        return;
      }
      this.emitEvent({
        type: 'Display.render.frame',
        data: { mediaElement: this.video, width: this.video.videoWidth, height: this.video.videoHeight, currentTime: this.video.currentTime },
        origin: 'domain',
        processed: false,
      });
      requestAnimationFrame(renderFrame);
    };

    const updateCursor = () => {
      if (!this.state.isPlaying || !this.video || this.video.paused) {
        this.stopPlayback();
        return;
      }

      const currentLocalSecond = this.video.currentTime;
      const currentGlobalSecond = timing.accumulatedBefore + currentLocalSecond;
      this.state.currentTime = currentGlobalSecond;
      this.cursorX = this.state.currentTime * this.distancePerTime;

      this.emitEvent({
        type: 'Display.cursor.updated',
        data: { cursorX: this.cursorX, globalSecond: currentGlobalSecond, mediaElement: this.video },
        origin: 'domain',
      });

      if (currentLocalSecond >= actualEndTime - this.options.endTimeTolerance || this.video.ended) {
        this.tryNextMedia(index + 1, timing.accumulatedBefore + timing.duration);
      } else {
        this.updateTimer = setTimeout(updateCursor, 16);
      }
    };

    requestAnimationFrame(renderFrame);
    this.updateTimer = setTimeout(updateCursor, 16);
  }

  private renderImage(media: Media, index: number, localSecond: number, timing: { startTime: number; duration: number; accumulatedBefore: number }): void {
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
      this.currentImage = image;
      this.state.isPlaying = true;
      this.state.currentTime = timing.accumulatedBefore + localSecond;
      this.cursorX = this.state.currentTime * this.distancePerTime;

      this.emitEvent({ type: 'Display.playback.toggled', data: { isPlaying: true, currentTime: this.state.currentTime }, origin: 'domain' });
      this.emitEvent({
        type: 'Display.cursor.updated',
        data: { cursorX: this.cursorX, globalSecond: this.state.currentTime, mediaElement: image },
        origin: 'domain',
      });

      let currentLocalSecond = localSecond;
      const updateImageTimer = () => {
        if (!this.state.isPlaying) {
          this.stopPlayback();
          return;
        }

        this.emitEvent({
          type: 'Display.render.frame',
          data: { mediaElement: image, width: image.width, height: image.height, currentTime: currentLocalSecond },
          origin: 'domain',
          processed: false,
        });

        const timeIncrement = this.options.frameInterval * this.state.playbackSpeed;
        currentLocalSecond += timeIncrement;
        const currentGlobalSecond = timing.accumulatedBefore + currentLocalSecond;
        this.state.currentTime = currentGlobalSecond;
        this.cursorX = currentGlobalSecond * this.distancePerTime;

        this.emitEvent({
          type: 'Display.cursor.updated',
          data: { cursorX: this.cursorX, globalSecond: currentGlobalSecond, mediaElement: image },
          origin: 'domain',
        });

        if (currentLocalSecond >= timing.duration) {
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
    if (nextIndex >= this.medias.length) {
      console.warn(`[${new Date().toISOString()}] Display: No more media to try, restarting playback`);
      this.rePlay(0);
      return;
    }
    this.renderMedia(nextIndex, 0);
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
    this.emitEvent({ type: 'Display.volume.changed', data: { volume: clampedVolume }, origin: 'domain' });
  }

  private setPlaybackSpeed(playbackSpeed: number): void {
    const validSpeeds = [0.5, 1, 1.5, 2];
    const clampedSpeed = validSpeeds.includes(playbackSpeed) ? playbackSpeed : 1;
    this.state.playbackSpeed = clampedSpeed;
    if (this.video) {
      this.video.playbackRate = clampedSpeed;
    }
    this.emitEvent({ type: 'Display.playback.speed.changed', data: { playbackSpeed: clampedSpeed }, origin: 'domain' });
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