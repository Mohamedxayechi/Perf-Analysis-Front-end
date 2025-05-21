import { Media } from '../Models/media-model';
import { DisplayUtility } from '../Dispaly_Utility/Displayutility';

export class MediaUtils {
  static handleInitialize(medias: Media[] | undefined, emitEvent: (event: any) => void): void {
    if (!medias?.length) {
      console.error(`[${new Date().toISOString()}] MediaUtils: Invalid medias for initialization`);
      return;
    }
    const { updatedMedias } = DisplayUtility.initializeMedias(medias);
    Promise.resolve().then(() => emitEvent({ type: 'Display.media.initialized', data: { updatedMedias }, origin: 'domain' }));
  }

  static handleDelete(index: number | undefined, emitEvent: (event: any) => void): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] MediaUtils: Invalid index for delete: ${index}`);
      return;
    }
    const result = DisplayUtility.delete(index);
    if (result.deletedMedia?.video?.startsWith('blob:')) URL.revokeObjectURL(result.deletedMedia.video);
    if (result.deletedMedia?.image?.startsWith('blob:')) URL.revokeObjectURL(result.deletedMedia.image);
    emitEvent({ type: 'Display.media.deleted', data: { index, deletedMedia: result.deletedMedia, updatedMedias: result.updatedMedias }, origin: 'domain' });
  }

  static handleDuplicate(index: number | undefined, emitEvent: (event: any) => void): void {
    if (typeof index !== 'number') {
      console.error(`[${new Date().toISOString()}] MediaUtils: Invalid index for duplicate: ${index}`);
      return;
    }
    const result = DisplayUtility.duplicate(index);
    emitEvent({ type: 'Display.media.duplicated', data: { index, duplicatedMedia: result.duplicatedMedia, updatedMedias: result.updatedMedias }, origin: 'domain' });
  }

  static handleSplit(time: number, emitEvent: (event: any) => void): void {
    if (time <= 0) {
      console.warn(`[${new Date().toISOString()}] MediaUtils: Invalid split time: ${time}, aborting`);
      return;
    }

    const result = DisplayUtility.getVideoIndexAndStartTime(time);
    if (!result) {
      console.warn(`[${new Date().toISOString()}] MediaUtils: No media found at time ${time} for split`);
      return;
    }

    const { index, localSecond } = result;
    try {
      const splitResult = DisplayUtility.splitMedia(index, localSecond);
      if (!splitResult.updatedMedias.length || splitResult.updatedMedias === DisplayUtility.mediasSubject.getValue()) {
        console.warn(`[${new Date().toISOString()}] MediaUtils: Split failed for index ${index}, splitTime ${localSecond}, no changes made`);
        return;
      }
      emitEvent({
        type: 'Display.media.splitted',
        data: { time, index, splitTime: localSecond, updatedMedias: splitResult.updatedMedias },
        origin: 'domain',
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] MediaUtils: Split error for index ${index}, splitTime ${localSecond}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static handleResize(index: number | undefined, time: number | undefined, emitEvent: (event: any) => void): void {
    if (typeof index !== 'number' || typeof time !== 'number' || time <= 0) {
      console.error(`[${new Date().toISOString()}] MediaUtils: Invalid resize data, index: ${index}, time: ${time}`);
      return;
    }
    const result = DisplayUtility.resize(index, time);
    emitEvent({ type: 'Display.media.resized.completed', data: { index, time, updatedMedias: result.updatedMedias }, origin: 'domain' });
  }

  static handleFileInputTrigger(emitEvent: (event: any) => void): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,image/*';
    input.multiple = true;
    input.onchange = (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files?.length) {
        console.warn(`[${new Date().toISOString()}] MediaUtils: No files selected for import`);
        return;
      }
      Array.from(files).forEach((file) => this.handleImportMedia(file, emitEvent));
    };
    input.click();
  }

  static handleMediaReordered(medias: Media[] | undefined, emitEvent: (event: any) => void): void {
    if (!medias?.length) {
      console.error(`[${new Date().toISOString()}] MediaUtils: Invalid medias for reorder`);
      return;
    }
    DisplayUtility.initializeMedias(medias);
    emitEvent({ type: 'Display.media.imported', data: { updatedMedias: medias }, origin: 'domain' });
  }

  private static handleImportMedia(file: File, emitEvent: (event: any) => void): void {
    const mediaURL = URL.createObjectURL(file);
    if (file.type.startsWith('video')) {
      this.getVideoThumbnail(file).then(({ thumbnail, duration }) => {
        const media: Media = { video: mediaURL, time: duration, label: file.name, thumbnail, startTime: 0, endTime: duration, isThumbnailOnly: false };
        DisplayUtility.add(media);
        const updatedMedias = DisplayUtility.mediasSubject.getValue();
        emitEvent({ type: 'Display.media.imported', data: { updatedMedias }, origin: 'domain' });
      }).catch((err) => console.error(`[${new Date().toISOString()}] MediaUtils: Failed to import video: ${file.name}`, err));
    } else if (file.type.startsWith('image')) {
      const media: Media = { image: mediaURL, time: 5, label: file.name, thumbnail: mediaURL, startTime: 0, endTime: 5, isThumbnailOnly: false };
      DisplayUtility.add(media);
      const updatedMedias = DisplayUtility.mediasSubject.getValue();
      emitEvent({ type: 'Display.media.imported', data: { updatedMedias }, origin: 'domain' });
    } else {
      console.error(`[${new Date().toISOString()}] MediaUtils: Unsupported file type: ${file.type}`);
    }
  }

  static getVideoThumbnail(file: File, seekTo = 1): Promise<{ thumbnail: string; duration: number }> {
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

  static cleanupMedias(medias: Media[]): void {
    medias.forEach(media => {
      if (media.video?.startsWith('blob:')) URL.revokeObjectURL(media.video);
      if (media.image?.startsWith('blob:')) URL.revokeObjectURL(media.image);
    });
  }
}