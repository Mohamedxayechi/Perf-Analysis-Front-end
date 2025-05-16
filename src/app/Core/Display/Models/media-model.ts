import { BehaviorSubject } from 'rxjs';

export interface Media {
  label: string;
  time: number;
  thumbnail: string;
  video?: string;
  image?: string;
  startTime: number;
  endTime: number;
  isThumbnailOnly?: boolean;
}

