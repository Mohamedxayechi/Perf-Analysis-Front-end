import { BehaviorSubject, map } from 'rxjs';

export interface Media {
  label: string;
  time: number;
  thumbnail: string;
  video?: string;
  image?: string;
  startTime?: number;
  endTime?: number;
}

export class MediaModel {
  private static mediasSubject = new BehaviorSubject<Media[]>([]);

  static medias$ = MediaModel.mediasSubject.asObservable();

  static readonly totalTime$ = MediaModel.medias$.pipe(
    map((periods) => periods.reduce((sum, period) => sum + period.time, 0))
  );

  label: string;
  time: number;
  thumbnail: string;
  video?: string;
  image?: string;
  startTime?: number;
  endTime?: number;

  constructor(data: Partial<Media>) {
    this.label = data.label || '';
    this.time = data.time || 0;
    this.thumbnail = data.thumbnail || '';
    this.video = data.video;
    this.image = data.image;
    this.startTime = data.startTime ?? 0;
    this.endTime = data.endTime ?? this.time;
  }

  static initializeMedias(medias: Media[]): void {
    console.log(`[${new Date().toISOString()}] MediaModel.initializeMedias: Initializing with ${medias.length} medias`);
    const initializedMedias = medias.map((media) => ({
      ...media,
      startTime: media.startTime ?? 0,
      endTime: media.endTime ?? media.time,
    }));
    MediaModel.mediasSubject.next(initializedMedias);
  }

  static add(newMedia: Media): void {
    console.log(`[${new Date().toISOString()}] MediaModel.add: Adding media: ${newMedia.label}`);
    const current = MediaModel.mediasSubject.getValue();
    const updated = [...current, {
      ...newMedia,
      startTime: newMedia.startTime ?? 0,
      endTime: newMedia.endTime ?? newMedia.time,
    }];
    MediaModel.mediasSubject.next(updated);
  }

  static delete(index: number): { updatedMedias: Media[]; deletedMedia?: Media } {
    if (index < 0 || index >= MediaModel.mediasSubject.getValue().length) {
      console.error(`[${new Date().toISOString()}] MediaModel.delete: Invalid index ${index} for deletion. Medias length: ${MediaModel.mediasSubject.getValue().length}`);
      return { updatedMedias: MediaModel.mediasSubject.getValue() };
    }
    const current = MediaModel.mediasSubject.getValue();
    const deletedMedia = current[index];
    const updatedMedias = current.filter((_, i) => i !== index);
    console.log(`[${new Date().toISOString()}] MediaModel.delete: Deleted media at index: ${index}, label: ${deletedMedia.label}`);
    MediaModel.mediasSubject.next(updatedMedias);
    return { updatedMedias, deletedMedia };
  }

  static duplicate(index: number): { duplicatedMedia: Media, updatedMedias: Media[] } {
    if (index < 0 || index >= MediaModel.mediasSubject.getValue().length) {
      console.error(`[${new Date().toISOString()}] MediaModel.duplicate: Invalid index ${index} for duplication`);
      return { duplicatedMedia: null, updatedMedias: MediaModel.mediasSubject.getValue() } as any;
    }
    const current = MediaModel.mediasSubject.getValue();
    const duplicatedMedia = { ...current[index], label: `${current[index].label}_copy` }; // Add suffix to label
    const updated = [...current];
    updated.splice(index + 1, 0, duplicatedMedia);
    console.log(`[${new Date().toISOString()}] MediaModel.duplicate: Duplicated media at index: ${index}, new label: ${duplicatedMedia.label}`);
    MediaModel.mediasSubject.next(updated);
    return { duplicatedMedia, updatedMedias: updated };
  }

  static splitMedia(index: number, splitTime: number): void {
    if (splitTime <= 0) {
      console.error(`[${new Date().toISOString()}] MediaModel.splitMedia: splitTime must be greater than 0`);
      return;
    }
    if (index < 0 || index >= MediaModel.mediasSubject.getValue().length) {
      console.error(`[${new Date().toISOString()}] MediaModel.splitMedia: Invalid index ${index}`);
      return;
    }
    const medias = MediaModel.mediasSubject.getValue();
    const media = medias[index];
    if (
      !media ||
      typeof media.startTime !== 'number' ||
      typeof media.endTime !== 'number'
    ) {
      console.error(`[${new Date().toISOString()}] MediaModel.splitMedia: Invalid media item or missing startTime/endTime`);
      return;
    }

    const { startTime, endTime } = media;

    if (splitTime < 0 || splitTime >= endTime - startTime) {
      console.error(`[${new Date().toISOString()}] MediaModel.splitMedia: splitTime must be between 0 and media duration`);
      return;
    }

    const firstHalf = {
      ...media,
      endTime: splitTime + media.startTime,
      time: splitTime,
    };
    const secondHalf = {
      ...media,
      startTime: media.startTime + splitTime,
      time: media.time - splitTime,
    };

    const updated = [...medias];
    updated.splice(index, 1, firstHalf, secondHalf);
    console.log(`[${new Date().toISOString()}] MediaModel.splitMedia: Split media at index: ${index}, splitTime: ${splitTime}`);
    MediaModel.mediasSubject.next(updated);
  }

  static resize(index: number, width: number, timePerWidth: number): void {
    if (index < 0 || index >= MediaModel.mediasSubject.getValue().length) {
      console.error(`[${new Date().toISOString()}] MediaModel.resize: Invalid index ${index}`);
      return;
    }
    const newTime = width * timePerWidth;
    const current = MediaModel.mediasSubject.getValue();
    const media = current[index];
    const timeDiff = newTime - media.time;

    if (media.video && timeDiff > 0) {
      console.warn(`[${new Date().toISOString()}] MediaModel.resize: Cannot extend video duration at index ${index}`);
      return;
    }

    const updated = [...current];
    updated[index] = {
      ...media,
      time: newTime,
      endTime: media.endTime! + timeDiff,
    };
    console.log(`[${new Date().toISOString()}] MediaModel.resize: Resized media at index: ${index}, newTime: ${newTime}`);
    MediaModel.mediasSubject.next(updated);
  }

  static getVideoIndexAndStartTime(second: number): { index: number; localSecond: number } | null {
    const medias = MediaModel.mediasSubject.getValue();
    let accumulatedTime = 0;

    for (let i = 0; i < medias.length; i++) {
      const mediaDuration = medias[i].time;
      if (second < accumulatedTime + mediaDuration) {
        return {
          index: i,
          localSecond: second - accumulatedTime,
        };
      }
      accumulatedTime += mediaDuration;
    }

    return null;
  }

  static calculateAccumulatedTime(index: number): number {
    const medias = MediaModel.mediasSubject.getValue();
    let time = 0;
    for (let i = 0; i < index; i++) {
      time += medias[i].time;
    }
    return time;
  }

  static getTotalTime(): number {
    const medias = MediaModel.mediasSubject.getValue();
    return medias.reduce((sum, period) => sum + period.time, 0);
  }
}