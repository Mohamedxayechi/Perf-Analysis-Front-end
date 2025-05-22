import { BehaviorSubject } from 'rxjs';
import { Media } from '../Models/media-model';

export class DisplayUtility {
  static mediasSubject = new BehaviorSubject<Media[]>([]);
  static totalTimeSubject = new BehaviorSubject<number>(0);
  static isPlayingSubject = new BehaviorSubject<boolean>(false);
  static medias$ = DisplayUtility.mediasSubject.asObservable();
  static totalTime$ = DisplayUtility.totalTimeSubject.asObservable();
  static isPlaying$ = DisplayUtility.isPlayingSubject.asObservable();

  //private method to handle common media timing updates ***
  private static updateMediasAndTimes(medias: Media[]): Media[] {
    let accumulatedTime = 0;
    const updatedMedias = medias.map((media) => {
      const startTime = accumulatedTime;
      const endTime = startTime + media.time;
      accumulatedTime = endTime;
      return { ...media, startTime, endTime };
    });
    DisplayUtility.mediasSubject.next(updatedMedias);
    DisplayUtility.totalTimeSubject.next(accumulatedTime);
    return updatedMedias;
  }

  /**
   * Initializes the media list with provided media items, filtering out invalid entries and setting start/end times.
   * @param medias Array of media items to initialize.
   * @returns Object containing the updated media list.
   */
  static initializeMedias(medias: Media[]): { updatedMedias: Media[] } {
    // console.log(
    //   `[${new Date().toISOString()}] DisplayUtility.initializeMedias: Initializing with ${medias.length} medias:`,
    //   medias.map((m, i) => ({ index: i, label: m.label, video: m.video, image: m.image, thumbnail: m.thumbnail, time: m.time }))
    // );
    const updatedMedias = medias
      .filter((m) => {
        if (m.time <= 0) {
          console.warn(
            `[${new Date().toISOString()}] DisplayUtility: Filtering out invalid media with time <= 0:`,
            m
          );
          return false;
        }
        if (!m.video && !m.image) {
          console.warn(
            `[${new Date().toISOString()}] DisplayUtility: Filtering out invalid media with no video or image:`,
            m
          );
          return false;
        }
        return true;
      })
      .map((media) => ({
        ...media,
        thumbnail: media.thumbnail || '',
        video: media.video || undefined,
        image: media.image || undefined,
        isThumbnailOnly: media.isThumbnailOnly ?? false,
      }));

    return { updatedMedias: DisplayUtility.updateMediasAndTimes(updatedMedias) };
  }

  /**
   * Resizes the duration of a media item at the specified index and updates all subsequent media timings.
   * @param index Index of the media item to resize.
   * @param time New duration for the media item.
   * @returns Object containing the updated media list.
   */
  static resize(index: number, time: number): { updatedMedias: Media[] } {
    const medias = DisplayUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length || time <= 0) {
      console.error(
        `[${new Date().toISOString()}] DisplayUtility: Invalid resize parameters, index: ${index}, time: ${time}`
      );
      return { updatedMedias: medias };
    }
    const updatedMedias = [...medias];
    updatedMedias[index] = { ...medias[index], time, endTime: medias[index].startTime + time };

    return { updatedMedias: DisplayUtility.updateMediasAndTimes(updatedMedias) };
  }

  /**
   * Retrieves a media item at the specified index.
   * @param index Index of the media item to retrieve.
   * @returns The media item or null if the index is invalid.
   */
  static getMedia(index: number): Media | null {
    const medias = DisplayUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      console.error(`[${new Date().toISOString()}] DisplayUtility: Invalid getMedia index: ${index}`);
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
        `[${new Date().toISOString()}] DisplayUtility: Cannot add media with no video or image:`,
        media
      );
      return;
    }
    if (media.time <= 0) {
      console.error(
        `[${new Date().toISOString()}] DisplayUtility: Cannot add media with invalid time: ${media.time}`
      );
      return;
    }
    const medias = DisplayUtility.mediasSubject.getValue();
    const updatedMedias = [...medias, {
      ...media,
      thumbnail: media.thumbnail || '',
      video: media.video || undefined,
      image: media.image || undefined,
      isThumbnailOnly: media.isThumbnailOnly ?? false,
    }];
 
    DisplayUtility.updateMediasAndTimes(updatedMedias);
  }

  /**
   * Deletes a media item at the specified index and updates timings.
   * @param index Index of the media item to delete.
   * @returns Object containing the deleted media item (or null if invalid index) and the updated media list.
   */
  static delete(index: number): { deletedMedia: Media | null; updatedMedias: Media[] } {
    const medias = DisplayUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      console.error(`[${new Date().toISOString()}] DisplayUtility: Invalid delete index: ${index}`);
      return { deletedMedia: null, updatedMedias: medias };
    }
  const deletedMedia = medias[index];
    const updatedMedias = medias.filter((_, i) => i !== index);

    return { deletedMedia, updatedMedias: DisplayUtility.updateMediasAndTimes(updatedMedias) };
  }

  /**
   * Duplicates a media item at the specified index and updates timings.
   * @param index Index of the media item to duplicate.
   * @returns Object containing the duplicated media item (or null if invalid index) and the updated media list.
   */
  static duplicate(index: number): { duplicatedMedia: Media | null; updatedMedias: Media[] } {
    const medias = DisplayUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      console.error(`[${new Date().toISOString()}] DisplayUtility: Invalid duplicate index: ${index}`);
      return { duplicatedMedia: null, updatedMedias: medias };
    }
    const duplicatedMedia = { ...medias[index], label: `${medias[index].label} (copy)` };
    const updatedMedias = [...medias.slice(0, index + 1), duplicatedMedia, ...medias.slice(index + 1)];

    return { duplicatedMedia, updatedMedias: DisplayUtility.updateMediasAndTimes(updatedMedias) };
  }

  /**
   * Splits a media item at the specified index into two parts at the given split time.
   * @param index Index of the media item to split.
   * @param splitTime Time at which to split the media item.
   * @returns Object containing the updated media list.
   */
  static splitMedia(index: number, splitTime: number): { updatedMedias: Media[] } {
    const medias = DisplayUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length || splitTime <= 0) {
      console.error(
        `[${new Date().toISOString()}] DisplayUtility: Invalid split parameters, index: ${index}, splitTime: ${splitTime}`
      );
      return { updatedMedias: medias };
    }
    const media = medias[index];
    const duration = media.time;
    if (splitTime >= duration) {
      console.warn(
        `[${new Date().toISOString()}] DisplayUtility: Split time ${splitTime} exceeds media duration ${duration}`
      );
      return { updatedMedias: medias };
    }
    const firstPart = { ...media, time: splitTime, endTime: media.startTime + splitTime };
    const secondPart = { ...media, time: duration - splitTime, startTime: media.startTime + splitTime };
    const updatedMedias = [...medias.slice(0, index), firstPart, secondPart, ...medias.slice(index + 1)];
 
    return { updatedMedias: DisplayUtility.updateMediasAndTimes(updatedMedias) };
  }

  /**
   * Toggles the play/pause state of the media playback.
   */
  static togglePlayPause(): void {
    const currentIsPlaying = DisplayUtility.isPlayingSubject.getValue();
    // console.log(`[${new Date().toISOString()}] DisplayUtility: Toggling play/pause, current isPlaying: ${currentIsPlaying}`);
    DisplayUtility.isPlayingSubject.next(!currentIsPlaying);
  }

  /**
   * Finds the media item and local time corresponding to a given global time.
   * @param globalSecond The global time in seconds.
   * @returns Object containing the media index and local time within the media, or null if not found.
   */
 static getVideoIndexAndStartTime(globalSecond: number): { index: number; localSecond: number } | null {
  const medias = this.mediasSubject.getValue();
  console.log(`[${new Date().toISOString()}] DisplayUtility: getVideoIndexAndStartTime`, {
    globalSecond,
    medias: medias.map(m => ({ label: m.label, startTime: m.startTime, endTime: m.endTime, time: m.time })),
  });

  let accumulatedTime = 0;
  for (let i = 0; i < medias.length; i++) {
    const media = medias[i];
    const startTime = media.startTime ?? accumulatedTime;
    const endTime = media.endTime ?? (startTime + (media.time ?? 0));
    if (globalSecond >= startTime && globalSecond < endTime) {
      const localSecond = globalSecond - startTime;
      console.log(`[${new Date().toISOString()}] DisplayUtility: Found media at index ${i}`, {
        globalSecond,
        startTime,
        endTime,
        localSecond,
        label: media.label,
      });
      return { index: i, localSecond };
    }
    accumulatedTime = endTime;
  }
  console.warn(`[${new Date().toISOString()}] DisplayUtility: No media found for globalSecond ${globalSecond}`);
  return null;
}

  /**
   * Calculates the accumulated time up to the specified media index.
   * @param index Index of the media item up to which to calculate the accumulated time.
   * @returns The total accumulated time in seconds, or 0 if the index is invalid.
   */
  static calculateAccumulatedTime(index: number): number {
    const medias = DisplayUtility.mediasSubject.getValue();
    if (index < 0 || index >= medias.length) {
      console.error(`[${new Date().toISOString()}] DisplayUtility: Invalid index for calculateAccumulatedTime: ${index}`);
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
    return DisplayUtility.totalTimeSubject.getValue();
  }
}