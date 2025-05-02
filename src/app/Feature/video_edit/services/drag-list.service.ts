import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { EXTERNAL_TIME_PERIODS, Media } from '../models/time-period.model';
import { ParameterService } from './parameter.service';

@Injectable({
  providedIn: 'root',
})
export class DragListService {
  private mediasSubject = new BehaviorSubject<Media[]>(this.getMedias());

  medias$ = this.mediasSubject.asObservable();

  readonly totalTime$ = this.medias$.pipe(
    map((periods) => periods.reduce((sum, period) => sum + period.time, 0))
  );

  constructor(private parameterService: ParameterService) {}

  delete(index: number) {
    const current = this.mediasSubject.getValue();
    const updated = current.filter((_, i) => i !== index);
    this.mediasSubject.next(updated);
  }

  duplicate(index: number) {
    const current = this.mediasSubject.getValue();
    const copy = { ...current[index] };
    const updated = [...current];
    updated.splice(index + 1, 0, copy);
    this.mediasSubject.next(updated);
  }

  splitMedia(index: number, splitTime: number) {
    if (splitTime <= 0) {
      console.error('splitTime must be greater than 0');
      return;
    }
    const medias = this.mediasSubject.getValue();
    const media = medias[index];
    if (
      !media ||
      typeof media.startTime !== 'number' ||
      typeof media.endTime !== 'number'
    ) {
      console.error('Invalid media item or missing startTime/endTime');
      return;
    }

    const { startTime, endTime } = media;

    if (splitTime < 0 || splitTime >= endTime - startTime) {
      console.error('splitTime must be between 0 and media duration');
      return;
    }

    // Create two new items by slicing the original
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
    this.mediasSubject.next(updated);
  }

  resize(item: { index: number; width: number; timePerWidth: number }) {
    const newTime = item.width * item.timePerWidth;
    this.updateTime(item.index, newTime);
  }
  addMedia(media: Media) {
    const current = this.mediasSubject.getValue();
    const updated = [...current, media];
    this.mediasSubject.next(updated);
  }

  getVideoIndexAndStartTime(
    second: number
  ): { index: number; localSecond: number } | null {
    const medias = this.mediasSubject.getValue();
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

  private getMedias(): Media[] {
    return EXTERNAL_TIME_PERIODS.map((media) => ({
      ...media,
      startTime: media.startTime ?? 0,
      endTime: media.endTime ?? media.time,
    }));
  }

  private updateTime(index: number, newTime: number): void {
    const current = this.mediasSubject.getValue();
    const updated = [...current];
    const timeDiff = newTime - updated[index].time;
    if (current[index].video && timeDiff > 0) return;

    updated[index] = {
      ...updated[index],
      time: newTime,
      endTime: updated[index].endTime! + timeDiff,
    };
    this.mediasSubject.next(updated);
  }

  calculateAccumulatedTime(index: number): number {
    const medias = this.mediasSubject.getValue();
    let time = 0;
    for (let i = 0; i < index; i++) {
      time += medias[i].time;
    }
    return time;
  }
}
