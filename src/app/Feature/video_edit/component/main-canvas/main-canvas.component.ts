/* eslint-disable @typescript-eslint/no-inferrable-types */

import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import Konva from 'konva';
import { ParameterService } from '../../services/parameter.service';
import { DragListService } from '../../services/drag-list.service';
import { Media } from '../../models/time-period.model';
import { EventsService } from '../../services/events.service';
import {  MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-main-canvas',
    standalone: true,
    imports: [MatButtonModule, MatDividerModule, MatIconModule],
    templateUrl: './main-canvas.component.html',
    styleUrl: './main-canvas.component.css'
})
export class MainCanvasComponent implements AfterViewInit {
  @ViewChild('mainCanvasContainer', { static: false })
  
  canvasContainerRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>; 

  cursorX = 0;
  distancePerTime = 0;
  private canvas!: HTMLCanvasElement;
  private video!: HTMLVideoElement;
  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private konvaImage!: Konva.Image;


  private medias: Media[] = [];
  private firstIndex = 0;
  private localSecondinit = 0;
   isPlaying = false;
  private animateFrame=0;
  

  constructor(
    private parameterService: ParameterService,
    private dragListService: DragListService,
    private eventsService: EventsService
  ) {
    this.parameterService.distancePerTime$.subscribe((distance) => {
      this.distancePerTime = distance;
    });
    this.dragListService.medias$.subscribe((medias) => {
      this.medias = medias;
    });

    this.parameterService.curosrX$.subscribe((cursorX) => {
      this.cursorX = cursorX;
    });

    this.eventsService.changeCursor$.subscribe((curosrX) => {
      if (this.isPlaying) this.rePlay(curosrX / this.distancePerTime);
    });
    this.eventsService.playPause$.subscribe(() => {
      this.togglePlayPause();
    });
    this.eventsService.triggerFileInput.subscribe(() => {
      this.fileInput.nativeElement.click();
    });
    this.parameterService.isPlaying$.subscribe((isPlaying) => {
      this.isPlaying = Boolean(isPlaying);
    })
  }

  ngAfterViewInit(): void {
    this.canvas = this.canvasContainerRef.nativeElement;
    this.stage = new Konva.Stage({
      container: this.canvas.parentElement! as HTMLDivElement, 
      width: 500,
      height: 500,
    });

     this.konvaImage = new Konva.Image({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      draggable: true,
      image: undefined,
    });
  
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    this.layer.add(this.konvaImage);
  }

  playFromSecond(globalSecond: number): void {
    const result = this.dragListService.getVideoIndexAndStartTime(globalSecond);
    if (!result) {
      console.warn('Second is beyond total media duration.');
      return;
    }

    const { index, localSecond } = result;
    this.playMediaFrom(index, localSecond);
    this.firstIndex = index;
    this.localSecondinit = localSecond;
  }

  stopPlayback(): void {
    if (this.animateFrame) {
      cancelAnimationFrame(this.animateFrame);
      this.animateFrame = 0;
    }
    if (this.video) {
      this.video.pause();
      this.parameterService.setIsPlaying(false);
    } else if (this.konvaImage) {
      this.parameterService.setIsPlaying(false);
    }
  }
  
  MediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const mediaURL = URL.createObjectURL(file);
      if (file.type.startsWith('video')) {
        this.getVideoThumbnail(file).then(({ thumbnail, duration }) => {
          const media: Media = {
            video: mediaURL,
            time: duration,
            label: '',
            thumbnail,
            startTime: 0,
            endTime: duration,
          };
          this.dragListService.addMedia(media);
        });
      } else if (file.type.startsWith('image')) {
        const media: Media = {
          image: mediaURL, 
          time: 5, 
          label: '',
          thumbnail: mediaURL,
          startTime: 0,
          endTime: 5, 
        };
        this.dragListService.addMedia(media);
      }
    }
  }

  private rePlay(globalSecond: number): void {
    this.stopPlayback();
    this.playFromSecond(globalSecond);
  }

  private getVideoThumbnail(file: File, seekTo = 1): Promise<{ thumbnail: string; duration: number }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
  
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
  
      video.onloadedmetadata = () => {
        const duration = video.duration;
        video.currentTime = Math.min(seekTo, duration / 2);
      };
  
      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/png');
        resolve({ thumbnail, duration: video.duration });
      };
  
      video.onerror = () => reject('Error while loading video');
    });
  }

  private playMediaFrom(index: number, localSecond: number): void {
    if ( index >= this.medias.length) {
      console.error('Invalid index or already playing media.');
      return;
    }
  
    this.stopPlayback();
    const media = this.medias[index];
    const startTime = media.startTime ?? 0;
    const endTime = media.endTime ?? media.time;
    const duration = endTime - startTime;
    const accumulatedBefore = this.dragListService.calculateAccumulatedTime(index);
  
    if (media.video) {
      this.video = document.createElement('video');
      this.video.src = media.video;
      this.video.crossOrigin = 'anonymous';
  
      this.video.addEventListener('loadedmetadata', () => {
        const seekTime = startTime + localSecond;
        this.video.currentTime = seekTime;
  
        this.video.play().then(() => {
          this.parameterService.setIsPlaying(true);
          this.konvaImage.image(this.video);
          this.layer.batchDraw();
  
          const renderVideoFrame = () => {
            if (!this.isPlaying) return;
  
            this.konvaImage.image(this.video);
            this.konvaImage.getLayer()?.batchDraw();
  
            const currentGlobalSecond = accumulatedBefore + (this.video.currentTime - startTime);
            this.parameterService.setCurosrX(currentGlobalSecond * this.distancePerTime);
  
            if (this.video.currentTime >= endTime) {
              this.stopPlayback();
              this.playMediaFrom(index + 1, 0);
            } else {
              this.animateFrame = requestAnimationFrame(renderVideoFrame);
            }
          };
  
          this.animateFrame = requestAnimationFrame(renderVideoFrame);
        }).catch((err) => {
          console.error('Video play failed:', err);
        });
      });
  
      this.video.load();
    } else if (media.image) {
      const image = new window.Image();
      image.src = media.image;
  
      image.onload = () => {
        this.parameterService.setIsPlaying(true);
        this.konvaImage.image(image);
        this.layer.batchDraw();
  
        const renderImageFrame = () => {
          if (!this.isPlaying) return;
  
          localSecond += 0.016; // ~60 FPS = 1/60 ≈ 0.016s
          const currentGlobalSecond = accumulatedBefore + localSecond;
          this.parameterService.setCurosrX(currentGlobalSecond * this.distancePerTime);
  
          if (localSecond >= duration) {
            this.stopPlayback();
            this.playMediaFrom(index + 1, 0);
          } else {
            this.animateFrame = requestAnimationFrame(renderImageFrame);
          }
        };
  
        this.animateFrame = requestAnimationFrame(renderImageFrame);
      };
    }
  }
  
  togglePlayPause(): void {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      const currentSecond = this.cursorX / this.distancePerTime;
      this.playFromSecond(currentSecond);
    }
  }

  
  

}
