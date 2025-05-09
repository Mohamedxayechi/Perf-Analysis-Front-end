import { BehaviorSubject } from 'rxjs';
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
  static mediasSubject = new BehaviorSubject<Media[]>([]);
  static totalTimeSubject = new BehaviorSubject<number>(0);
  static isPlayingSubject = new BehaviorSubject<boolean>(false);
  static medias$ = MediaModel.mediasSubject.asObservable();
  static totalTime$ = MediaModel.totalTimeSubject.asObservable();
  static isPlaying$ = MediaModel.isPlayingSubject.asObservable();

  static initializeMedias(medias: Media[]): void {
    console.log(`[${new Date().toISOString()}] MediaModel.initializeMedias: Initializing with ${medias.length} medias`);
    let accumulatedTime = 0;
    const updatedMedias = medias.filter(m => m.time > 0).map((media) => {
      const startTime = accumulatedTime;
      const endTime = startTime + (media.time || 0);
      accumulatedTime = endTime;
      return {
        ...media,
        startTime,
        endTime,
        thumbnail: media.thumbnail || '',
        video: media.video || undefined,
        image: media.image || undefined,
      };
    });
    MediaModel.mediasSubject.next(updatedMedias);
    MediaModel.totalTimeSubject.next(accumulatedTime);
  }

  static resize(index: number, time: number): { updatedMedias: Media[] } {
    const medias = MediaModel.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      console.error(`[${new Date().toISOString()}] MediaModel: Invalid resize index: ${index}`);
      return { updatedMedias: medias };
    }
    const updatedMedias = [...medias];
    updatedMedias[index] = { ...medias[index], time };
    let accumulatedTime = 0;
    updatedMedias.forEach((media, i) => {
      media.startTime = accumulatedTime;
      media.endTime = accumulatedTime + (media.time || 0);
      accumulatedTime = media.endTime;
    });
    MediaModel.mediasSubject.next(updatedMedias);
    MediaModel.totalTimeSubject.next(accumulatedTime);
    return { updatedMedias };
  }

  static getMedia(index: number): Media | null {
    const medias = MediaModel.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      console.error(`[${new Date().toISOString()}] MediaModel: Invalid getMedia index: ${index}`);
      return null;
    }
    return medias[index];
  }

  static add(media: Media): void {
    const medias = MediaModel.mediasSubject.getValue();
    const updatedMedias = [...medias, media];
    let accumulatedTime = 0;
    updatedMedias.forEach((m) => {
      m.startTime = accumulatedTime;
      m.endTime = accumulatedTime + (m.time || 0);
      accumulatedTime = m.endTime;
    });
    MediaModel.mediasSubject.next(updatedMedias);
    MediaModel.totalTimeSubject.next(accumulatedTime);
  }

  static delete(index: number): { deletedMedia: Media | null; updatedMedias: Media[] } {
    const medias = MediaModel.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      return { deletedMedia: null, updatedMedias: medias };
    }
    const deletedMedia = medias[index];
    const updatedMedias = medias.filter((_, i) => i !== index);
    let accumulatedTime = 0;
    updatedMedias.forEach((media) => {
      media.startTime = accumulatedTime;
      media.endTime = accumulatedTime + (media.time || 0);
      accumulatedTime = media.endTime;
    });
    MediaModel.mediasSubject.next(updatedMedias);
    MediaModel.totalTimeSubject.next(accumulatedTime);
    return { deletedMedia, updatedMedias };
  }

  static duplicate(index: number): { duplicatedMedia: Media | null; updatedMedias: Media[] } {
    const medias = MediaModel.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      return { duplicatedMedia: null, updatedMedias: medias };
    }
    const duplicatedMedia = { ...medias[index], label: `${medias[index].label} (copy)` };
    const updatedMedias = [...medias.slice(0, index + 1), duplicatedMedia, ...medias.slice(index + 1)];
    let accumulatedTime = 0;
    updatedMedias.forEach((media) => {
      media.startTime = accumulatedTime;
      media.endTime = accumulatedTime + (media.time || 0);
      accumulatedTime = media.endTime;
    });
    MediaModel.mediasSubject.next(updatedMedias);
    MediaModel.totalTimeSubject.next(accumulatedTime);
    return { duplicatedMedia, updatedMedias };
  }

  static splitMedia(index: number, splitTime: number): { updatedMedias: Media[] } {
    const medias = MediaModel.mediasSubject.getValue();
    if (index < 0 || index >= medias.length || splitTime <= 0) {
      return { updatedMedias: medias };
    }
    const media = medias[index];
    const duration = (media.endTime || media.time) - (media.startTime || 0);
    if (splitTime >= duration) {
      return { updatedMedias: medias };
    }
    const firstPart = { ...media, time: splitTime };
    const secondPart = { ...media, time: duration - splitTime };
    const updatedMedias = [...medias.slice(0, index), firstPart, secondPart, ...medias.slice(index + 1)];
    let accumulatedTime = 0;
    updatedMedias.forEach((m) => {
      m.startTime = accumulatedTime;
      m.endTime = accumulatedTime + (m.time || 0);
      accumulatedTime = m.endTime;
    });
    MediaModel.mediasSubject.next(updatedMedias);
    MediaModel.totalTimeSubject.next(accumulatedTime);
    return { updatedMedias };
  }

  static togglePlayPause(): void {
    const currentIsPlaying = MediaModel.isPlayingSubject.getValue();
    console.log(`[${new Date().toISOString()}] MediaModel: Toggling play/pause, current isPlaying: ${currentIsPlaying}`);
    MediaModel.isPlayingSubject.next(!currentIsPlaying);
  }

  static getVideoIndexAndStartTime(globalSecond: number): { index: number; localSecond: number; startTime: number } | null {
    const medias = MediaModel.mediasSubject.getValue();
    let accumulated = 0;
    for (let i = 0; i < medias.length; i++) {
      const media = medias[i];
      const duration = (media.endTime || media.time) - (media.startTime || 0);
      if (globalSecond >= accumulated && globalSecond < accumulated + duration) {
        return {
          index: i,
          localSecond: globalSecond - accumulated,
          startTime: media.startTime || 0,
        };
      }
      accumulated += duration;
    }
    return null;
  }

  static calculateAccumulatedTime(index: number): number {
    const medias = MediaModel.mediasSubject.getValue();
    let accumulated = 0;
    for (let i = 0; i < index; i++) {
      accumulated += (medias[i].endTime || medias[i].time) - (medias[i].startTime || 0);
    }
    return accumulated;
  }

  static getTotalTime(): number {
    return MediaModel.totalTimeSubject.getValue();
  }
}