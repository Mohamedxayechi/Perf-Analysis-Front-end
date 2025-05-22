import { Media } from '../Models/media-model';
import { DisplayUtility } from '../Dispaly_Utility/Displayutility';

export class MediaPlayer {
  private static video: HTMLVideoElement | null = null;
  private static currentImage: HTMLImageElement | null = null;
  private static updateTimer: NodeJS.Timeout | null = null;
  private static cursorFrameId: number | null = null; // CHANGE: Replaced cursorTimer with cursorFrameId for requestAnimationFrame

  private static currentMediaIndex = -1;
  private static lastPausedTime = 0;

  static getCurrentMediaElement(): HTMLVideoElement | HTMLImageElement | null {
    return this.video || this.currentImage || null;
  }

  static playFromSecond(
    globalSecond: number,
    medias: Media[],
    state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
    options: { frameInterval: number; endTimeTolerance: number },
    cursorX: number,
    distancePerTime: number,
    emitEvent: (event: any) => void
  ): void {
    if (!isFinite(globalSecond) || globalSecond < 0) {
      console.warn(`[${new Date().toISOString()}] MediaPlayer: Invalid globalSecond: ${globalSecond}, defaulting to 0`);
      globalSecond = 0;
    }

    if (!medias.length) {
      console.error(`[${new Date().toISOString()}] MediaPlayer: No medias available to play`);
      this.stopPlayback(state, emitEvent);
      return;
    }

    const result = DisplayUtility.getVideoIndexAndStartTime(globalSecond);
    if (!result) {
      console.warn(`[${new Date().toISOString()}] MediaPlayer: No media found at time ${globalSecond}`);
      this.stopPlayback(state, emitEvent);
      return;
    }

    this.currentMediaIndex = result.index;
    this.renderMedia(result.index, result.localSecond, medias, state, options, cursorX, distancePerTime, emitEvent);
  }

  static seekTo(
    seekTime: number,
    medias: Media[],
    state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
    options: { frameInterval: number; endTimeTolerance: number },
    cursorX: number,
    distancePerTime: number,
    emitEvent: (event: any) => void
  ): void {
    if (isNaN(seekTime) || seekTime < 0) {
      console.warn(`[${new Date().toISOString()}] MediaPlayer: Invalid seek time: ${seekTime}`);
      return;
    }

    seekTime = Math.min(seekTime, state.duration);

    let newIndex = -1;
    let localSecond = 0;
    let accumulatedTime = 0;

    for (let i = 0; i < medias.length; i++) {
      const media = medias[i];
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
      newIndex = medias.length - 1;
      const lastMedia = medias[newIndex];
      const startTime = lastMedia.startTime ?? 0;
      const endTime = lastMedia.endTime ?? lastMedia.time ?? Infinity;
      localSecond = endTime - startTime;
      console.warn(`[${new Date().toISOString()}] MediaPlayer: Seek time ${seekTime} adjusted to last media index ${newIndex}, localSecond: ${localSecond}`);
    }

    this.currentMediaIndex = newIndex;
    state.currentTime = seekTime;
    cursorX = seekTime * distancePerTime;

    emitEvent({
      type: 'Display.cursor.updated',
      data: { cursorX, globalSecond: seekTime, mediaElement: this.getCurrentMediaElement(), mediaIndex: newIndex, localSecond },
      origin: 'domain',
    });

    if (state.isPlaying) {
      this.rePlay(seekTime, medias, state, options, cursorX, distancePerTime, emitEvent);
    }
  }

static togglePlayPause(
  state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
  medias: Media[],
  cursorX: number,
  distancePerTime: number,
  emitEvent: (event: any) => void
): void {
  if (state.isPlaying) {
    this.pausePlayback(state, medias, emitEvent);
  } else {
    const playSecond = Math.max(0, state.currentTime); // Always use state.currentTime
    console.log(`[${new Date().toISOString()}] MediaPlayer: togglePlayPause resuming`, { currentTime: state.currentTime, lastPausedTime: this.lastPausedTime, playSecond });
    this.playFromSecond(playSecond, medias, state, { frameInterval: 0.016, endTimeTolerance: 0.1 }, cursorX, distancePerTime, emitEvent);
  }
}
static pausePlayback(
  state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
  medias: Media[],
  emitEvent: (event: any) => void
): void {
  console.log(`[${new Date().toISOString()}] MediaPlayer: Before pausePlayback`, { currentTime: state.currentTime, lastPausedTime: this.lastPausedTime });
  if (this.updateTimer) {
    clearTimeout(this.updateTimer);
    this.updateTimer = null;
  }
  if (this.cursorFrameId) {
    cancelAnimationFrame(this.cursorFrameId);
    this.cursorFrameId = null;
  }
  let mediaElement: HTMLVideoElement | HTMLImageElement | null = null;
  let width: number | undefined;
  let height: number | undefined;
  let currentTime: number | undefined;

  if (this.video && this.currentMediaIndex >= 0) {
    this.video.pause();
    const media = medias[this.currentMediaIndex];
    this.lastPausedTime = this.video.currentTime + DisplayUtility.calculateAccumulatedTime(this.currentMediaIndex);
    state.currentTime = this.lastPausedTime;
    mediaElement = this.video;
    width = this.video.videoWidth;
    height = this.video.videoHeight;
    currentTime = this.video.currentTime;
  } else if (this.currentImage && this.currentMediaIndex >= 0) {
    const media = medias[this.currentMediaIndex];
    this.lastPausedTime = state.currentTime;
    mediaElement = this.currentImage;
    width = this.currentImage.width;
    height = this.currentImage.height;
    currentTime = state.currentTime - DisplayUtility.calculateAccumulatedTime(this.currentMediaIndex);
  } else {
    this.lastPausedTime = 0; // Reset lastPausedTime if no media is active
  }

  state.isPlaying = false;
  emitEvent({ type: 'Display.playback.toggled', data: { isPlaying: false, currentTime: state.currentTime }, origin: 'domain' });
  emitEvent({
    type: 'Display.render.frame',
    data: { mediaElement, width, height, currentTime },
    origin: 'domain',
    processed: false,
  });
  console.log(`[${new Date().toISOString()}] MediaPlayer: After pausePlayback`, { currentTime: state.currentTime, lastPausedTime: this.lastPausedTime });
}



  static stopPlayback(
    state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
    emitEvent: (event: any) => void
  ): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.cursorFrameId) {
      cancelAnimationFrame(this.cursorFrameId);
      this.cursorFrameId = null;
    }
    if (this.video) {
      this.video.pause();
      this.video.remove();
      this.video = null;
    }
    this.currentImage = null;
    state.isPlaying = false;
    this.currentMediaIndex = -1;
    emitEvent({ type: 'Display.playback.toggled', data: { isPlaying: false, currentTime: state.currentTime }, origin: 'domain' });
    emitEvent({ type: 'Display.render.frame', data: { mediaElement: null }, origin: 'domain', processed: false });
  }


  static rePlay(
    globalSecond: number,
    medias: Media[],
    state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
    options: { frameInterval: number; endTimeTolerance: number },
    cursorX: number,
    distancePerTime: number,
    emitEvent: (event: any) => void
  ): void {
    this.stopPlayback(state, emitEvent);
    this.playFromSecond(globalSecond, medias, state, options, cursorX, distancePerTime, emitEvent);
  }

  private static renderMedia(
    index: number,
    localSecond: number,
    medias: Media[],
    state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
    options: { frameInterval: number; endTimeTolerance: number },
    cursorX: number,
    distancePerTime: number,
    emitEvent: (event: any) => void
  ): void {
    if (index < 0 || index >= medias.length) {
      console.error(`[${new Date().toISOString()}] MediaPlayer: Invalid index or no media available: ${index}, media count: ${medias.length}`);
      this.stopPlayback(state, emitEvent);
      return;
    }

    this.stopPlayback(state, emitEvent);
    this.currentMediaIndex = index;
    const currentMedia = medias[index];
    if (!currentMedia || (!currentMedia.video && !currentMedia.image)) {
      console.error(`[${new Date().toISOString()}] MediaPlayer: Invalid media at index ${index}, no video or image provided`);
      this.tryNextMedia(index + 1, medias, state, options, cursorX, distancePerTime, emitEvent);
      return;
    }

    const startTime = currentMedia.startTime ?? 0;
    const endTime = currentMedia.endTime ?? currentMedia.time ?? Infinity;
    const duration = endTime - startTime;
    const accumulatedBefore = DisplayUtility.calculateAccumulatedTime(index);

    if (currentMedia.video) {
      this.renderVideo(medias, currentMedia, index, localSecond, { startTime, endTime, duration, accumulatedBefore }, state, options, cursorX, distancePerTime, emitEvent);
    } else if (currentMedia.image) {
      this.renderImage(medias, currentMedia, index, localSecond, { startTime, duration, accumulatedBefore }, state, options, cursorX, distancePerTime, emitEvent);
    }
  }

  private static renderVideo(
    medias: Media[],
    currentMedia: Media,
    index: number,
    localSecond: number,
    timing: { startTime: number; endTime: number; duration: number; accumulatedBefore: number },
    state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
    options: { frameInterval: number; endTimeTolerance: number },
    cursorX: number,
    distancePerTime: number,
    emitEvent: (event: any) => void
  ): void {
    if (!currentMedia.video?.match(/^(blob:|\/assets\/videos\/)/)) {
      console.error(`[${new Date().toISOString()}] MediaPlayer: Invalid video URL for ${currentMedia.label}, url: ${currentMedia.video}`);
      this.tryNextMedia(index + 1, medias, state, options, cursorX, distancePerTime, emitEvent);
      return;
    }

    this.video = document.createElement('video');
    this.video.dataset['id'] = `video-${Date.now()}`;
    Object.assign(this.video, {
      src: currentMedia.video,
      crossOrigin: 'anonymous',
      muted: false,
      preload: 'auto',
      volume: state.volume,
      playbackRate: state.playbackSpeed
    });

    const handleMetadata = () => {
      this.video!.playbackRate = state.playbackSpeed;
      const actualEndTime = Math.min(timing.duration, this.video!.duration);
      let seekTime = localSecond;

      if (!isFinite(seekTime) || seekTime < 0) {
        seekTime = 0;
        console.warn(`[${new Date().toISOString()}] MediaPlayer: Clamped seekTime to 0 for ${currentMedia.label}`);
      } else if (seekTime > actualEndTime) {
        seekTime = actualEndTime;
        console.warn(`[${new Date().toISOString()}] MediaPlayer: Clamped seekTime from ${seekTime} to ${actualEndTime} for ${currentMedia.label}`);
      }

      this.video!.currentTime = seekTime;
      state.currentTime = timing.accumulatedBefore + seekTime;
      cursorX = state.currentTime * distancePerTime;

      emitEvent({
        type: 'Display.cursor.updated',
        data: { cursorX, globalSecond: state.currentTime, mediaElement: this.video },
        origin: 'domain',
      });

      this.video!.play().then(() => {
        this.startVideoLoops(currentMedia, index, timing, actualEndTime, medias, state, options, cursorX, distancePerTime, emitEvent);
      }).catch((err) => {
        console.error(`[${new Date().toISOString()}] MediaPlayer: Video play failed for ${currentMedia.label}, src: ${currentMedia.video}`, err.message);
        this.tryNextMedia(index + 1, medias, state, options, cursorX, distancePerTime, emitEvent);
      });
    };

    this.video.addEventListener('loadedmetadata', handleMetadata);
    this.video.addEventListener('error', (e) => {
      console.error(`[${new Date().toISOString()}] MediaPlayer: Video error for ${currentMedia.label}, src: ${currentMedia.video}`, this.video?.error, e);
      this.tryNextMedia(index + 1, medias, state, options, cursorX, distancePerTime, emitEvent);
    });
    this.video.addEventListener('ended', () => {
      this.tryNextMedia(index + 1, medias, state, options, cursorX, distancePerTime, emitEvent);
    });

    this.video.addEventListener('loadeddata', () => {
      this.video!.playbackRate = state.playbackSpeed;
    });

    this.video.load();
  }

  private static startVideoLoops(
    currentMedia: Media,
    index: number,
    timing: { startTime: number; endTime: number; duration: number; accumulatedBefore: number },
    actualEndTime: number,
    medias: Media[],
    state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
    options: { frameInterval: number; endTimeTolerance: number },
    cursorX: number,
    distancePerTime: number,
    emitEvent: (event: any) => void
  ): void {
    state.isPlaying = true;
    emitEvent({ type: 'Display.playback.toggled', data: { isPlaying: true, currentTime: state.currentTime }, origin: 'domain' });

    const renderFrame = () => {
      if (!state.isPlaying || !this.video || this.video.paused || this.video.ended) {
        return;
      }
      emitEvent({
        type: 'Display.render.frame',
        data: { mediaElement: this.video, width: this.video.videoWidth, height: this.video.videoHeight, currentTime: this.video.currentTime },
        origin: 'domain',
        processed: false,
      });
      requestAnimationFrame(renderFrame);
    };

    const updateCursor = () => {
      if (!state.isPlaying || !this.video || this.video.paused) {
        this.stopPlayback(state, emitEvent);
        return;
      }

      const currentLocalSecond = this.video.currentTime;
      const currentGlobalSecond = timing.accumulatedBefore + currentLocalSecond;
      state.currentTime = currentGlobalSecond;
      cursorX = state.currentTime * distancePerTime;

      emitEvent({
        type: 'Display.cursor.updated',
        data: { cursorX, globalSecond: currentGlobalSecond, mediaElement: this.video },
        origin: 'domain',
      });

      if (currentLocalSecond >= actualEndTime - options.endTimeTolerance || this.video.ended) {
        this.tryNextMedia(index + 1, medias, state, options, cursorX, distancePerTime, emitEvent);
      } else {
        this.updateTimer = setTimeout(updateCursor, 16);
      }
    };

    requestAnimationFrame(renderFrame);
    this.updateTimer = setTimeout(updateCursor, 16);
  }

 
  private static renderImage(
    medias: Media[],
    currentMedia: Media,
    index: number,
    localSecond: number,
    timing: { startTime: number; duration: number; accumulatedBefore: number },
    state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
    options: { frameInterval: number; endTimeTolerance: number },
    cursorX: number,
    distancePerTime: number,
    emitEvent: (event: any) => void
  ): void {
    if (currentMedia.isThumbnailOnly) {
      console.warn(`[${new Date().toISOString()}] MediaPlayer: Skipping image rendering for ${currentMedia.label} as it is marked thumbnail-only`, { src: currentMedia.image });
      this.tryNextMedia(index + 1, medias, state, options, cursorX, distancePerTime, emitEvent);
      return;
    }

    const image = new Image();
    image.src = currentMedia.image!;
    image.crossOrigin = 'anonymous';
    image.dataset['id'] = `image-${Date.now()}`;

    image.onload = () => {
      this.currentImage = image;
      state.isPlaying = true;
      state.currentTime = timing.accumulatedBefore + localSecond;
      cursorX = state.currentTime * distancePerTime;

      emitEvent({ type: 'Display.playback.toggled', data: { isPlaying: true, currentTime: state.currentTime }, origin: 'domain' });
      emitEvent({
        type: 'Display.cursor.updated',
        data: { cursorX, globalSecond: state.currentTime, mediaElement: image },
        origin: 'domain',
      });

      // Render the image once
      emitEvent({
        type: 'Display.render.frame',
        data: { mediaElement: image, width: image.width, height: image.height, currentTime: localSecond },
        origin: 'domain',
        processed: false,
      });

      // Use a single timer for the image duration
      const defaultImageDuration = 2; // Fallback duration in seconds
      const imageDuration = isFinite(timing.duration) && timing.duration > 0 ? timing.duration : defaultImageDuration;
      const remainingDurationMs = (imageDuration - localSecond) * 1000 / state.playbackSpeed;
      this.updateTimer = setTimeout(() => {
        if (state.isPlaying) {
          this.tryNextMedia(index + 1, medias, state, options, cursorX, distancePerTime, emitEvent);
        }
      }, remainingDurationMs);

      // Cursor update loop using requestAnimationFrame
      let lastFrameTime = performance.now();
      let currentLocalSecond = localSecond;
      const updateCursor = (currentTime: number) => {
        if (!state.isPlaying) {
          this.cursorFrameId = null;
          return;
        }

        const deltaTime = (currentTime - lastFrameTime) / 1000; // Time since last frame in seconds
        lastFrameTime = currentTime;

        const timeIncrement = deltaTime * state.playbackSpeed;
        currentLocalSecond += timeIncrement;
        const currentGlobalSecond = timing.accumulatedBefore + currentLocalSecond;
        state.currentTime = currentGlobalSecond;
        cursorX = currentGlobalSecond * distancePerTime;

        emitEvent({
          type: 'Display.cursor.updated',
          data: { cursorX, globalSecond: currentGlobalSecond, mediaElement: image },
          origin: 'domain',
        });

        if (currentLocalSecond < imageDuration) {
          this.cursorFrameId = requestAnimationFrame(updateCursor);
        } else {
          this.cursorFrameId = null;
        }
      };
      this.cursorFrameId = requestAnimationFrame(updateCursor);
    };

    image.onerror = () => {
      console.error(`[${new Date().toISOString()}] MediaPlayer: Image error for ${currentMedia.label}, src: ${currentMedia.image}`);
      this.tryNextMedia(index + 1, medias, state, options, cursorX, distancePerTime, emitEvent);
    };
  }


  private static tryNextMedia(
    nextIndex: number,
    medias: Media[],
    state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
    options: { frameInterval: number; endTimeTolerance: number },
    cursorX: number,
    distancePerTime: number,
    emitEvent: (event: any) => void
  ): void {
    if (nextIndex >= medias.length) {
      console.warn(`[${new Date().toISOString()}] MediaPlayer: No more media to try, restarting playback`);
      this.rePlay(0, medias, state, options, cursorX, distancePerTime, emitEvent);
      return;
    }
    this.renderMedia(nextIndex, 0, medias, state, options, cursorX, distancePerTime, emitEvent);
  }

  static setVolume(
    volume: number,
    state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
    emitEvent: (event: any) => void
  ): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    state.volume = clampedVolume;
    if (this.video) {
      this.video.volume = clampedVolume;
    }
    emitEvent({ type: 'Display.volume.changed', data: { volume: clampedVolume }, origin: 'domain' });
  }

  static setPlaybackSpeed(
    playbackSpeed: number,
    state: { isPlaying: boolean; currentTime: number; duration: number; volume: number; playbackSpeed: number },
    emitEvent: (event: any) => void
  ): void {
    const validSpeeds = [0.5, 1, 1.5, 2];
    const clampedSpeed = validSpeeds.includes(playbackSpeed) ? playbackSpeed : 1;
    state.playbackSpeed = clampedSpeed;
    if (this.video) {
      this.video.playbackRate = clampedSpeed;
    }
    emitEvent({ type: 'Display.playback.speed.changed', data: { playbackSpeed: clampedSpeed }, origin: 'domain' });
  }
}