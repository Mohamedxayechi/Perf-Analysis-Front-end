import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Engine } from '../Engine';
import { eventBus, EventPayload } from '../Utility/event-bus';
import { Media } from './Models/media-model';
import { DisplayUtility } from './Dispaly_Utility/Displayutility';
import { MediaConverter } from './Media-Utility/media_process';
import { MediaPlayer } from './Media-Utility/media_player.controller';
import { MediaUtils } from './Media-Utility/media_utils';

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
  private state: State = { isPlaying: false, currentTime: 0, duration: 0, volume: 0.5, playbackSpeed: 1 };
  private options: RenderOptions = { frameInterval: 0.016, endTimeTolerance: 0.1 };
  private medias: Media[] = [];
  private cursorX = 0;
  private distancePerTime = 50;
  private skipInterval = 5;
  private eventProcessing = false;
  private eventQueue: EventPayload[] = [];

  // Initialize media list directly
  private readonly EXTERNAL_TIME_PERIODS: Media[] = (() => {
    let currentStartTime = 0;
    return [
      {
        label: 'Bronze age',
        time: 5,
        thumbnail: '/assets/thumbnails/1.png',
        video: '/assets/videos/1.mp4',
        startTime: currentStartTime,
        endTime: (currentStartTime += 5),
      },
      {
        label: 'Iron age',
        time: 3,
        thumbnail: '/assets/thumbnails/2.png',
        image: '/assets/thumbnails/2.png',
        startTime: currentStartTime,
        endTime: (currentStartTime += 3),
      },
      {
        label: 'Middle ages',
        time: 3,
        thumbnail: '/assets/thumbnails/3.png',
        video: '/assets/videos/3.mp4',
        startTime: currentStartTime,
        endTime: (currentStartTime += 3),
      },
      {
        label: 'Early modern period',
        time: 6,
        thumbnail: '/assets/thumbnails/4.png',
        video: '/assets/videos/4.mp4',
        startTime: currentStartTime,
        endTime: (currentStartTime += 6),
      },
      {
        label: 'Long nineteenth century',
        time: 8,
        thumbnail: '/assets/thumbnails/5.png',
        video: '/assets/videos/5.mp4',
        startTime: currentStartTime,
        endTime: (currentStartTime += 8),
      },
      {
        label: 'last',
        time: 3,
        thumbnail: '/assets/thumbnails/6.png',
        video: '/assets/videos/6.mp4',
        startTime: currentStartTime,
        endTime: (currentStartTime += 3),
      },
    ];
  })();

  constructor() {
    this.initializeMediaList();
    this.setupSubscriptions();
  }

  private initializeMediaList(): void {
    console.log(`[${new Date().toISOString()}] Display: Initializing media list with ${this.EXTERNAL_TIME_PERIODS.length} medias`);
    MediaUtils.handleInitialize(this.EXTERNAL_TIME_PERIODS, this.emitEvent.bind(this));
    this.medias = DisplayUtility.mediasSubject.getValue();
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
        if (this.state.isPlaying) {
          this.medias = DisplayUtility.mediasSubject.getValue();
          MediaPlayer.rePlay(this.state.currentTime, this.medias, this.state, this.options, this.cursorX, this.distancePerTime, this.emitEvent.bind(this));
        }
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
      console.warn(`[${new Date().toISOString()}] Display: Queuing event: ${event.type}, eventProcessing: ${this.eventProcessing}, processed: ${event.processed}`);
      this.eventQueue.push(event);
      return;
    }

    this.eventProcessing = true;
    try {
      const handlers: { [key: string]: (data: any) => void } = {
        'ItemListMenuComponent.media.delete': (data) => {
          MediaUtils.handleDelete(data?.index, this.emitEvent.bind(this));
          this.medias = DisplayUtility.mediasSubject.getValue();
          if (this.state.isPlaying) {
            MediaPlayer.rePlay(this.state.currentTime, this.medias, this.state, this.options, this.cursorX, this.distancePerTime, this.emitEvent.bind(this));
          }
        },
        'ItemListMenuComponent.media.duplicate': (data) => {
          MediaUtils.handleDuplicate(data?.index, this.emitEvent.bind(this));
          this.medias = DisplayUtility.mediasSubject.getValue();
          if (this.state.isPlaying) {
            MediaPlayer.rePlay(this.state.currentTime, this.medias, this.state, this.options, this.cursorX, this.distancePerTime, this.emitEvent.bind(this));
          }
        },
        'ActionsBarComponent.media.split': (data) => {
          const splitTime = typeof data?.time === 'number' && data.time > 0 ? data.time : this.state.currentTime;
          MediaUtils.handleSplit(splitTime, this.emitEvent.bind(this));
          this.medias = DisplayUtility.mediasSubject.getValue();
          if (this.state.isPlaying) {
            MediaPlayer.rePlay(this.state.currentTime, this.medias, this.state, this.options, this.cursorX, this.distancePerTime, this.emitEvent.bind(this));
          }
        },
        'ActionsBarComponent.media.import.trigger': () => MediaUtils.handleFileInputTrigger(this.emitEvent.bind(this)),
        'DragDropHorizontalortingComponent.media.reordered': (data) => {
          MediaUtils.handleMediaReordered(data?.medias, this.emitEvent.bind(this));
          this.medias = DisplayUtility.mediasSubject.getValue();
          if (this.state.isPlaying) {
            MediaPlayer.rePlay(this.state.currentTime, this.medias, this.state, this.options, this.cursorX, this.distancePerTime, this.emitEvent.bind(this));
          }
        },
        'ResizableDirective.media.resized': (data) => {
          MediaUtils.handleResize(data?.index, data?.time, this.emitEvent.bind(this));
          this.medias = DisplayUtility.mediasSubject.getValue();
          if (this.state.isPlaying) {
            MediaPlayer.rePlay(this.state.currentTime, this.medias, this.state, this.options, this.cursorX, this.distancePerTime, this.emitEvent.bind(this));
          }
        },
        // 'ActionsBarComponent.media.convertToMP4': () => MediaConverter.handleConvertToMP4(this.medias, this.updateDuration.bind(this), this.emitEvent.bind(this)),
        'playback.playFromSecond': (data) => {
          this.medias = DisplayUtility.mediasSubject.getValue();
          MediaPlayer.playFromSecond(data?.globalSecond || 0, this.medias, this.state, this.options, this.cursorX, this.distancePerTime, this.emitEvent.bind(this));
        },
        'ActionsBarComponent.playback.toggle': () => {
          this.medias = DisplayUtility.mediasSubject.getValue();
          MediaPlayer.togglePlayPause(this.state, this.medias, this.cursorX, this.distancePerTime, this.emitEvent.bind(this));
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
          this.medias = DisplayUtility.mediasSubject.getValue();
          const currentSecond = this.state.currentTime;
          const newSecond = Math.min(currentSecond + this.skipInterval, this.state.duration);
          MediaPlayer.seekTo(newSecond, this.medias, this.state, this.options, this.cursorX, this.distancePerTime, this.emitEvent.bind(this));
        },
        'ActionsBarComponent.playback.skip.backward': () => {
          this.medias = DisplayUtility.mediasSubject.getValue();
          const currentSecond = this.state.currentTime;
          const newSecond = Math.max(0, currentSecond - this.skipInterval);
          MediaPlayer.seekTo(newSecond, this.medias, this.state, this.options, this.cursorX, this.distancePerTime, this.emitEvent.bind(this));
        },
        'MainVideoEditComponent.cursor.changed': (data) => this.handleCursorChange(data?.cursorX || 0),
        'MainVideoEditComponent.parameters.distancePerTimeUpdated': (data) => this.handleDistancePerTimeUpdate(data?.distancePerTime || this.distancePerTime),
        'ActionsBarComponent.volume.changed': (data) => {
          const volume = Math.max(0, Math.min(1, data?.volume ?? this.state.volume));
          MediaPlayer.setVolume(volume, this.state, this.emitEvent.bind(this));
        },
        'ActionsBarComponent.playback.speed.changed': (data) => {
          const playbackSpeed = data?.playbackSpeed ?? this.state.playbackSpeed;
          MediaPlayer.setPlaybackSpeed(playbackSpeed, this.state, this.emitEvent.bind(this));
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
      if (this.eventQueue.length) {
        const nextEvent = this.eventQueue.shift()!;
        this.handleEvent(nextEvent);
      }
    }
  }

  private updateDuration(duration: number): void {
    this.state.duration = duration;
    this.emitEvent({ type: 'Display.display.durationUpdated', data: { duration }, origin: 'domain' });
  }

 private handleCursorChange(cursorX: number): void {
  console.log(`[${new Date().toISOString()}] Display: Before handleCursorChange`, { cursorX, currentTime: this.state.currentTime, lastPausedTime: (MediaPlayer as any).lastPausedTime });
  this.cursorX = cursorX;
  const globalSecond = cursorX / this.distancePerTime;
  console.log(`[${new Date().toISOString()}] Display: handleCursorChange`, { cursorX, globalSecond, distancePerTime: this.distancePerTime });
  this.state.currentTime = globalSecond;
  this.medias = DisplayUtility.mediasSubject.getValue();
  this.emitEvent({ type: 'Display.cursor.updated', data: { cursorX, globalSecond, mediaElement: MediaPlayer.getCurrentMediaElement() }, origin: 'domain' });
  if (this.state.isPlaying) {
    console.log(`[${new Date().toISOString()}] Display: Replaying from globalSecond: ${globalSecond}`);
    MediaPlayer.rePlay(globalSecond, this.medias, this.state, this.options, this.cursorX, this.distancePerTime, this.emitEvent.bind(this));
  }
  console.log(`[${new Date().toISOString()}] Display: After handleCursorChange`, { currentTime: this.state.currentTime, lastPausedTime: (MediaPlayer as any).lastPausedTime });
}

  private handleDistancePerTimeUpdate(distancePerTime: number): void {
    this.distancePerTime = distancePerTime;
    this.emitEvent({ type: 'Display.parameters.distancePerTimeUpdated', data: { distancePerTime }, origin: 'domain' });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    MediaPlayer.stopPlayback(this.state, this.emitEvent.bind(this));
    MediaUtils.cleanupMedias(this.medias);
  }
}