import { AfterViewInit, Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import Konva from 'konva';
import { Subscription } from 'rxjs';
import { Media } from '../../models/time-period.model';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Engine } from '../../../../Core/Engine';
import { EventPayload } from '../../../../Core/Utility/event-bus';

@Component({
  selector: 'app-main-canvas',
  standalone: true,
  imports: [MatButtonModule, MatDividerModule, MatIconModule],
  templateUrl: './main-canvas.component.html',
  styleUrl: './main-canvas.component.css',
})
export class MainCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mainCanvasContainer', { static: false })
  canvasContainerRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  cursorX = 0;
  distancePerTime = 50;
  private canvas!: HTMLCanvasElement;
  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private konvaImage!: Konva.Image;

  private medias: Media[] = [];
  isPlaying = false;
  private subscription: Subscription = new Subscription();

  constructor() {}

  ngOnInit(): void {
    console.log(`[${new Date().toISOString()}] MainCanvas: Initializing`);
    this.setupEngineListeners();
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

  private setupEngineListeners(): void {
    this.subscription.add(
      Engine.getInstance()
        .getEvents()
        .on('*', (event: EventPayload) => {
          console.log(`[${new Date().toISOString()}] MainCanvas received event: ${event.type}, origin: ${event.origin}, processed: ${event.processed}`);
          if (event.processed) return;

          switch (event.type) {
            case 'playback.toggled':
              this.isPlaying = event.data?.isPlaying || false;
              console.log(`[${new Date().toISOString()}] MainCanvas: Playback toggled, isPlaying: ${this.isPlaying}, currentSecond: ${event.data?.currentSecond}`);
              if (event.data?.isPlaying && event.data?.currentSecond !== undefined) {
                Engine.getInstance().emit({
                  type: 'playback.playFromSecond',
                  data: { globalSecond: event.data.currentSecond },
                  origin: 'component',
                  processed: false,
                });
              } else {
                this.konvaImage.image(undefined);
                this.layer.batchDraw();
              }
              break;
            case 'media.initialized':
              if (event.data?.medias) {
                this.medias = event.data.medias;
                console.log(`[${new Date().toISOString()}] MainCanvas: Initialized medias, count: ${this.medias.length}, medias:`, this.medias.map(m => m.label));
              }
              break;
            case 'media.imported':
              if (event.data?.updatedMedias) {
                this.medias = event.data.updatedMedias;
                console.log(`[${new Date().toISOString()}] MainCanvas: Updated medias after import, count: ${this.medias.length}, medias:`, this.medias.map(m => m.label));
              }
              break;
            case 'media.resized.completed':
              if (event.data?.updatedMedias) {
                this.medias = event.data.updatedMedias;
                console.log(`[${new Date().toISOString()}] MainCanvas: Updated medias after resize at index ${event.data.index}, new time: ${event.data.time}`);
              }
              break;
            case 'playback.seeked':
              if (event.data?.currentTime !== undefined) {
                Engine.getInstance().emit({
                  type: 'playback.replay',
                  data: { globalSecond: event.data.currentTime },
                  origin: 'component',
                  processed: false,
                });
              }
              break;
            case 'playback.mediaPlayed':
              if (event.data?.media && event.data?.index !== undefined && event.data?.localSecond !== undefined) {
                this.renderMedia(event.data.media, event.data.index, event.data.localSecond, event.data.accumulatedBefore);
              }
              break;
            case 'playback.stopped':
              this.konvaImage.image(undefined);
              this.layer.batchDraw();
              this.isPlaying = false;
              break;
            case 'cursor.updated':
              this.cursorX = event.data?.cursorX || this.cursorX;
              console.log(`[${new Date().toISOString()}] MainCanvas: Cursor updated to ${this.cursorX}`);
              break;
            case 'media.import.trigger':
              this.fileInput.nativeElement.click();
              break;
            case 'parameters.distancePerTimeUpdated':
              this.distancePerTime = event.data?.distancePerTime || this.distancePerTime;
              console.log(`[${new Date().toISOString()}] MainCanvas: distancePerTime updated to ${this.distancePerTime}`);
              break;
            default:
              console.warn(`[${new Date().toISOString()}] MainCanvas: Unhandled event: ${event.type}`);
          }
        })
    );
  }

  MediaSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        Engine.getInstance().emit({
          type: 'media.import',
          data: { file },
          origin: 'component',
          processed: false,
        });
      });
      (event.target as HTMLInputElement).value = '';
    }
  }

  togglePlayPause(): void {
    const currentSecond = this.cursorX / this.distancePerTime;
    console.log(`[${new Date().toISOString()}] MainCanvas: Emitting playback.toggle, currentSecond: ${currentSecond}, isPlaying: ${this.isPlaying}`);
    Engine.getInstance().emit({
      type: 'playback.toggle',
      data: { currentSecond },
      origin: 'component',
      processed: false,
    });
  }

  changeCursor(cursorX: number): void {
    console.log(`[${new Date().toISOString()}] MainCanvas: Emitting cursor.changed with cursorX: ${cursorX}`);
    Engine.getInstance().emit({
      type: 'cursor.changed',
      data: { cursorX },
      origin: 'component',
      processed: false,
    });
  }

  openFileDialog(): void {
    console.log(`[${new Date().toISOString()}] MainCanvas: Emitting media.import.trigger`);
    Engine.getInstance().emit({
      type: 'media.import.trigger',
      data: {},
      origin: 'component',
      processed: false,
    });
  }

  private renderMedia(media: Media, index: number, localSecond: number, accumulatedBefore: number): void {
    const startTime = media.startTime ?? 0;
    const endTime = media.endTime ?? media.time;
    const duration = endTime - startTime;

    if (media.video) {
      const video = document.createElement('video');
      video.src = media.video;
      video.crossOrigin = 'anonymous';

      video.addEventListener('loadedmetadata', () => {
        const seekTime = startTime + localSecond;
        video.currentTime = seekTime;

        video.play().then(() => {
          this.konvaImage.image(video);
          this.layer.batchDraw();

          const renderVideoFrame = () => {
            if (!this.isPlaying) {
              console.log(`[${new Date().toISOString()}] MainCanvas: Stopping renderVideoFrame, isPlaying: ${this.isPlaying}`);
              return;
            }

            this.konvaImage.image(video);
            this.konvaImage.getLayer()?.batchDraw();

            const currentGlobalSecond = accumulatedBefore + (video.currentTime - startTime);
            this.changeCursor(currentGlobalSecond * this.distancePerTime);

            if (video.currentTime >= endTime) {
              console.log(`[${new Date().toISOString()}] MainCanvas: Video ended at index ${index}, advancing to next`);
              Engine.getInstance().emit({
                type: 'playback.stop',
                data: {},
                origin: 'component',
                processed: false,
              });
              Engine.getInstance().emit({
                type: 'playback.playFromSecond',
                data: { globalSecond: currentGlobalSecond + 0.016 },
                origin: 'component',
                processed: false,
              });
            } else {
              requestAnimationFrame(renderVideoFrame);
            }
          };

          requestAnimationFrame(renderVideoFrame);
        }).catch((err) => {
          console.error(`[${new Date().toISOString()}] MainCanvas: Video play failed for ${media.video}:`, err);
        });
      });

      video.addEventListener('error', (err) => {
        console.error(`[${new Date().toISOString()}] MainCanvas: Video load error for ${media.video}:`, err);
      });

      video.load();
    } else if (media.image) {
      const image = new window.Image();
      image.src = media.image;

      image.onload = () => {
        this.konvaImage.image(image);
        this.layer.batchDraw();

        let currentLocalSecond = localSecond;
        const renderImageFrame = () => {
          if (!this.isPlaying) {
            console.log(`[${new Date().toISOString()}] MainCanvas: Stopping renderImageFrame, isPlaying: ${this.isPlaying}`);
            return;
          }

          currentLocalSecond += 0.016;
          const currentGlobalSecond = accumulatedBefore + currentLocalSecond;
          this.changeCursor(currentGlobalSecond * this.distancePerTime);

          if (currentLocalSecond >= duration) {
            console.log(`[${new Date().toISOString()}] MainCanvas: Image ended at index ${index}, advancing to next`);
            Engine.getInstance().emit({
              type: 'playback.stop',
              data: {},
              origin: 'component',
              processed: false,
            });
            Engine.getInstance().emit({
              type: 'playback.playFromSecond',
              data: { globalSecond: currentGlobalSecond + 0.016 },
              origin: 'component',
              processed: false,
            });
          } else {
            requestAnimationFrame(renderImageFrame);
          }
        };

        requestAnimationFrame(renderImageFrame);
      };

      image.onerror = () => {
        console.error(`[${new Date().toISOString()}] MainCanvas: Image load error for ${media.image}`);
      };
    } else {
      console.warn(`[${new Date().toISOString()}] MainCanvas: No video or image for media at index ${index}, label: ${media.label}`);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}