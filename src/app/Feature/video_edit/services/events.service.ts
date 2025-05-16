// import { Injectable } from '@angular/core';
// import { Subject } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class EventsService {

  

//   private changeCursorSource = new Subject<number>();
//   changeCursor$ = this.changeCursorSource.asObservable();

//   private playPauseSubject = new Subject<void>();
//   playPause$ = this.playPauseSubject.asObservable();

//   triggerFileInput = new Subject<void>();



//   changeCursorEvent(curosrX: number) {
//     this.changeCursorSource.next(curosrX);
//   }
  
//   togglePlayPauseEvent(){
//     this.playPauseSubject.next();
//   }

//   openFileDialog() {
//     this.triggerFileInput.next();
//   }
  
// }
