import { BehaviorSubject } from 'rxjs';
import {Media} from '../Models/media-model'


export class DispalyUtility {
  static mediasSubject = new BehaviorSubject<Media[]>([]);
  static totalTimeSubject = new BehaviorSubject<number>(0);
  static isPlayingSubject = new BehaviorSubject<boolean>(false);
  static medias$ = DispalyUtility.mediasSubject.asObservable();
  static totalTime$ = DispalyUtility.totalTimeSubject.asObservable();
  static isPlaying$ = DispalyUtility.isPlayingSubject.asObservable();

  /**
   * Initializes the media list with provided media items, filtering out invalid entries and setting start/end times.
   * @param medias Array of media items to initialize.
   * @returns Object containing the updated media list.
   */
  static initializeMedias(medias: Media[]): { updatedMedias: Media[] } {
    // console.log(
    //   `[${new Date().toISOString()}] DispalyUtility.initializeMedias: Initializing with ${medias.length} medias:`,
    //   medias.map((m, i) => ({ index: i, label: m.label, video: m.video, image: m.image, thumbnail: m.thumbnail, time: m.time }))
    // );
    let accumulatedTime = 0;
    const updatedMedias = medias
      .filter((m) => {
        if (m.time <= 0) {
          console.warn(
            `[${new Date().toISOString()}] DispalyUtility: Filtering out invalid media with time <= 0:`,
            m
          );
          return false;
        }
        if (!m.video && !m.image) {
          console.warn(
            `[${new Date().toISOString()}] DispalyUtility: Filtering out invalid media with no video or image:`,
            m
          );
          return false;
        }
        return true;
      })
      .map((media, i) => {
        const startTime = accumulatedTime;
        const endTime = startTime + media.time;
        accumulatedTime = endTime;
        const updatedMedia = {
          ...media,
          startTime,
          endTime,
          thumbnail: media.thumbnail || '',
          video: media.video || undefined,
          image: media.image || undefined,
          isThumbnailOnly: media.isThumbnailOnly ?? false,
        };
        // console.log(
        //   `[${new Date().toISOString()}] DispalyUtility: Initialized media ${i}:`,
        //   { label: updatedMedia.label, startTime, endTime, video: updatedMedia.video, image: updatedMedia.image, thumbnail: updatedMedia.thumbnail, isThumbnailOnly: updatedMedia.isThumbnailOnly }
        // );
        return updatedMedia;
      });
    DispalyUtility.mediasSubject.next(updatedMedias);
    DispalyUtility.totalTimeSubject.next(accumulatedTime);
    // console.log(
    //   `[${new Date().toISOString()}] DispalyUtility: Initialization complete, updatedMedias: ${updatedMedias.length}, totalTime: ${accumulatedTime}`
    // );
    return { updatedMedias };
  }

  /**
   * Resizes the duration of a media item at the specified index and updates all subsequent media timings.
   * @param index Index of the media item to resize.
   * @param time New duration for the media item.
   * @returns Object containing the updated media list.
   */
  static resize(index: number, time: number): { updatedMedias: Media[] } {
    const medias = DispalyUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length || time <= 0) {
      console.error(
        `[${new Date().toISOString()}] DispalyUtility: Invalid resize parameters, index: ${index}, time: ${time}`
      );
      return { updatedMedias: medias };
    }
    const updatedMedias = [...medias];
    updatedMedias[index] = { ...medias[index], time, endTime: medias[index].startTime + time };
    let accumulatedTime = 0;
    updatedMedias.forEach((media, i) => {
      media.startTime = accumulatedTime;
      media.endTime = accumulatedTime + media.time;
      accumulatedTime = media.endTime;
    });
    DispalyUtility.mediasSubject.next(updatedMedias);
    DispalyUtility.totalTimeSubject.next(accumulatedTime);
    // console.log(
    //   `[${new Date().toISOString()}] DispalyUtility: Resized media at index ${index} to time ${time}, totalTime: ${accumulatedTime}`
    // );
    return { updatedMedias };
  }

  /**
   * Retrieves a media item at the specified index.
   * @param index Index of the media item to retrieve.
   * @returns The media item or null if the index is invalid.
   */
  static getMedia(index: number): Media | null {
    const medias = DispalyUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      console.error(`[${new Date().toISOString()}] DispalyUtility: Invalid getMedia index: ${index}`);
      return null;
    }
    return medias[index];
  }

  /**
   * Adds a new media item to the end of the media list and updates timings.
   * @param media The media item to add.
   */
  static add(media: Media): void {
    if (!media.video && !media.image) {
      console.error(
        `[${new Date().toISOString()}] DispalyUtility: Cannot add media with no video or image:`,
        media
      );
      return;
    }
    if (media.time <= 0) {
      console.error(
        `[${new Date().toISOString()}] DispalyUtility: Cannot add media with invalid time: ${media.time}`
      );
      return;
    }
    const medias = DispalyUtility.mediasSubject.getValue();
    const updatedMedias = [...medias, {
      ...media,
      thumbnail: media.thumbnail || '',
      video: media.video || undefined,
      image: media.image || undefined,
      isThumbnailOnly: media.isThumbnailOnly ?? false,
    }];
    let accumulatedTime = 0;
    updatedMedias.forEach((m) => {
      m.startTime = accumulatedTime;
      m.endTime = accumulatedTime + m.time;
      accumulatedTime = m.endTime;
    });
    DispalyUtility.mediasSubject.next(updatedMedias);
    DispalyUtility.totalTimeSubject.next(accumulatedTime);
    // console.log(
    //   `[${new Date().toISOString()}] DispalyUtility: Added media:`,
    //   { label: media.label, video: media.video, image: media.image, thumbnail: media.thumbnail, time: media.time, isThumbnailOnly: media.isThumbnailOnly }
    // );
  }

  /**
   * Deletes a media item at the specified index and updates timings.
   * @param index Index of the media item to delete.
   * @returns Object containing the deleted media item (or null if invalid index) and the updated media list.
   */
  static delete(index: number): { deletedMedia: Media | null; updatedMedias: Media[] } {
    const medias = DispalyUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      console.error(`[${new Date().toISOString()}] DispalyUtility: Invalid delete index: ${index}`);
      return { deletedMedia: null, updatedMedias: medias };
    }
    const deletedMedia = medias[index];
    const updatedMedias = medias.filter((_, i) => i !== index);
    let accumulatedTime = 0;
    updatedMedias.forEach((media) => {
      media.startTime = accumulatedTime;
      media.endTime = accumulatedTime + media.time;
      accumulatedTime = media.endTime;
    });
    DispalyUtility.mediasSubject.next(updatedMedias);
    DispalyUtility.totalTimeSubject.next(accumulatedTime);
    // console.log(
    //   `[${new Date().toISOString()}] DispalyUtility: Deleted media at index ${index}:`,
    //   deletedMedia
    // );
    return { deletedMedia, updatedMedias };
  }

  /**
   * Duplicates a media item at the specified index and updates timings.
   * @param index Index of the media item to duplicate.
   * @returns Object containing the duplicated media item (or null if invalid index) and the updated media list.
   */
  static duplicate(index: number): { duplicatedMedia: Media | null; updatedMedias: Media[] } {
    const medias = DispalyUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      console.error(`[${new Date().toISOString()}] DispalyUtility: Invalid duplicate index: ${index}`);
      return { duplicatedMedia: null, updatedMedias: medias };
    }
    const duplicatedMedia = { ...medias[index], label: `${medias[index].label} (copy)` };
    const updatedMedias = [...medias.slice(0, index + 1), duplicatedMedia, ...medias.slice(index + 1)];
    let accumulatedTime = 0;
    updatedMedias.forEach((media) => {
      media.startTime = accumulatedTime;
      media.endTime = accumulatedTime + media.time;
      accumulatedTime = media.endTime;
    });
    DispalyUtility.mediasSubject.next(updatedMedias);
    DispalyUtility.totalTimeSubject.next(accumulatedTime);
    // console.log(
    //   `[${new Date().toISOString()}] DispalyUtility: Duplicated media at index ${index}:`,
    //   duplicatedMedia
    // );
    return { duplicatedMedia, updatedMedias };
  }

  /**
   * Splits a media item at the specified index into two parts at the given split time.
   * @param index Index of the media item to split.
   * @param splitTime Time at which to split the media item.
   * @returns Object containing the updated media list.
   */
  static splitMedia(index: number, splitTime: number): { updatedMedias: Media[] } {
    const medias = DispalyUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length || splitTime <= 0) {
      console.error(
        `[${new Date().toISOString()}] DispalyUtility: Invalid split parameters, index: ${index}, splitTime: ${splitTime}`
      );
      return { updatedMedias: medias };
    }
    const media = medias[index];
    const duration = media.time;
    if (splitTime >= duration) {
      console.warn(
        `[${new Date().toISOString()}] DispalyUtility: Split time ${splitTime} exceeds media duration ${duration}`
      );
      return { updatedMedias: medias };
    }
    const firstPart = { ...media, time: splitTime, endTime: media.startTime + splitTime };
    const secondPart = { ...media, time: duration - splitTime, startTime: media.startTime + splitTime };
    const updatedMedias = [...medias.slice(0, index), firstPart, secondPart, ...medias.slice(index + 1)];
    let accumulatedTime = 0;
    updatedMedias.forEach((m) => {
      m.startTime = accumulatedTime;
      m.endTime = accumulatedTime + m.time;
      accumulatedTime = m.endTime;
    });
    DispalyUtility.mediasSubject.next(updatedMedias);
    DispalyUtility.totalTimeSubject.next(accumulatedTime);
    // console.log(
    //   `[${new Date().toISOString()}] DispalyUtility: Split media at index ${index}, splitTime: ${splitTime}`
    // );
    return { updatedMedias };
  }

  /**
   * Toggles the play/pause state of the media playback.
   */
  static togglePlayPause(): void {
    const currentIsPlaying = DispalyUtility.isPlayingSubject.getValue();
    // console.log(`[${new Date().toISOString()}] DispalyUtility: Toggling play/pause, current isPlaying: ${currentIsPlaying}`);
    DispalyUtility.isPlayingSubject.next(!currentIsPlaying);
  }

  /**
   * Finds the media item and local time corresponding to a given global time.
   * @param globalSecond The global time in seconds.
   * @returns Object containing the media index and local time within the media, or null if not found.
   */
  static getVideoIndexAndStartTime(globalSecond: number): { index: number; localSecond: number } | null {
    const medias = this.mediasSubject.getValue();
    let accumulatedTime = 0;

    for (let i = 0; i < medias.length; i++) {
      const media = medias[i];
      const startTime = media.startTime ?? accumulatedTime;
      const endTime = media.endTime ?? (startTime + (media.time ?? 0));
      if (globalSecond >= startTime && globalSecond < endTime) {
        // console.log(`[${new Date().toISOString()}] DispalyUtility: Found media at index ${i}`, {
        //   globalSecond,
        //   startTime,
        //   endTime,
        //   localSecond: globalSecond - startTime,
        //   label: media.label,
        // });
        return { index: i, localSecond: globalSecond - startTime };
      }
      accumulatedTime = endTime;
    }
    console.warn(`[${new Date().toISOString()}] DispalyUtility: No media found for globalSecond ${globalSecond}`);
    return null;
  }

  /**
   * Calculates the accumulated time up to the specified media index.
   * @param index Index of the media item up to which to calculate the accumulated time.
   * @returns The total accumulated time in seconds, or 0 if the index is invalid.
   */
  static calculateAccumulatedTime(index: number): number {
    const medias = DispalyUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      console.error(`[${new Date().toISOString()}] DispalyUtility: Invalid index for calculateAccumulatedTime: ${index}`);
      return 0;
    }
    let accumulated = 0;
    for (let i = 0; i < index; i++) {
      accumulated += medias[i].time;
    }
    return accumulated;
  }

  /**
   * Retrieves the total duration of all media items.
   * @returns The total time in seconds.
   */
  static getTotalTime(): number {
    return DispalyUtility.totalTimeSubject.getValue();
  }
}