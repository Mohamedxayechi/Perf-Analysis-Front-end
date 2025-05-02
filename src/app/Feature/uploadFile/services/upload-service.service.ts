import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Kept for potential future use
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private videoUrlSubject = new BehaviorSubject<string | null>(null);
  videoUrl$ = this.videoUrlSubject.asObservable();

  constructor(private http: HttpClient) {}

  setVideoUrl(videoUrl: string | null) {
    this.videoUrlSubject.next(videoUrl);
  }

  getVideoUrl(): Observable<string | null> {
    return this.videoUrl$;
  }
}