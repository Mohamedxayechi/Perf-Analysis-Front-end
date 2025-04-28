import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ParameterService {
  private distancePerTimeSource = new BehaviorSubject<number>(80);
  distancePerTime$ = this.distancePerTimeSource.asObservable();

  private curosrXSource = new BehaviorSubject<number>(0);
  curosrX$ = this.curosrXSource.asObservable();

  private isPlayingSource = new BehaviorSubject<Boolean>(false);
  isPlaying$ = this.isPlayingSource.asObservable();

  setDistancePerTime(value: number) {
    this.distancePerTimeSource.next(value);
  }

  setCurosrX(value: number) {
    this.curosrXSource.next(value);
  }

  setIsPlaying(value: boolean) {
    this.isPlayingSource.next(value);
  }
}
