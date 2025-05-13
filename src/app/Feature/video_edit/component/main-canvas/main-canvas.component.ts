import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import Konva from 'konva';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { eventBus, EventPayload } from '../../../../Core/Utility/event-bus';
import { Media } from '../../models/time-period.model';
import { MatDividerModule } from '@angular/material/divider';


@Component({
  selector: 'app-main-canvas',
  standalone: true,
  imports: [MatButtonModule, MatDividerModule, MatIconModule],
  templateUrl: './main-canvas.component.html',
  styleUrl: './main-canvas.component.css',
})
export class MainCanvasComponent implements AfterViewInit {
  @ViewChild('mainCanvasContainer', { static: false }) canvasContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private konvaImage!: Konva.Image;
  private video: HTMLVideoElement | null = null;
  private medias: Media[] = [];
  private animation: Konva.Animation | null = null;
  private cursorX: number = 0;
  private distancePerTime: number = 50;

  constructor() {
    console.log(`[${new Date().toISOString()}] MainCanvas: Constructor called, subscribing to eventBus`);
    eventBus.subscribe((event: EventPayload) => {
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Received event: ${event.type}, origin: ${event.origin}, data:`,
        event.data
      );
      this.handleEvent(event);
    });
  }

  ngAfterViewInit(): void {
    console.log(`[${new Date().toISOString()}] MainCanvas: ngAfterViewInit, setting up Konva stage`);
    this.stage = new Konva.Stage({
      container: this.canvasContainerRef.nativeElement,
      width: 500,
      height: 500,
    });
    this.layer = new Konva.Layer();
    this.konvaImage = new Konva.Image({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      draggable: true,
      image: undefined,
    });
    this.layer.add(this.konvaImage);
    this.stage.add(this.layer);
    this.stage.draw();
    console.log(
      `[${new Date().toISOString()}] MainCanvas: Konva stage initialized, stage size: ${this.stage.width()}x${this.stage.height()}`
    );
  }

  private handleEvent(event: EventPayload): void {
    if (event.processed && event.type !== 'render.frame') {
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Skipping processed event: ${event.type}`
      );
      return;
    }

    try {
      switch (event.type) {
        case 'render.frame':
          this.handleRenderFrame(event);
          break;
        case 'media.imported':
          this.handleMediaImported(event);
          break;
        case 'media.import.trigger':
          this.fileInput.nativeElement.click();
          console.log(
            `[${new Date().toISOString()}] MainCanvas: Triggered file input`
          );
          break;
        case 'cursor.updated':
          this.cursorX = event.data?.cursorX || 0;
          console.log(
            `[${new Date().toISOString()}] MainCanvas: Cursor updated, cursorX: ${this.cursorX}`
          );
          break;
        case 'parameters.distancePerTimeUpdated':
          this.distancePerTime = event.data?.distancePerTime || this.distancePerTime;
          console.log(
            `[${new Date().toISOString()}] MainCanvas: distancePerTime updated to ${this.distancePerTime}`
          );
          break;
        default:
          console.warn(
            `[${new Date().toISOString()}] MainCanvas: Unhandled event type: ${event.type}`
          );
      }
      event.processed = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${new Date().toISOString()}] MainCanvas: Error processing event: ${message}`);
    }
  }

  private handleRenderFrame(event: EventPayload): void {
    const { mediaElement, width, height } = event.data || {};
    console.log(
      `[${new Date().toISOString()}] MainCanvas: render.frame, mediaElement: ${mediaElement?.constructor.name || 'null'}, width: ${width}, height: ${height}`
    );

    if (this.animation) {
      this.animation.stop();
      this.animation = null;
    }

    if (!mediaElement) {
      this.konvaImage.image(null);
      this.video = null;
      this.layer.batchDraw();
      this.stage.draw();
      console.log(`[${new Date().toISOString()}] MainCanvas: Cleared canvas`);
      return;
    }

    this.konvaImage.width(width || 200);
    this.konvaImage.height(height || 200);
    this.stage.width(width || 500);
    this.stage.height(height || 500);

    if (mediaElement instanceof HTMLVideoElement) {
      this.video = mediaElement;
      this.konvaImage.image(this.video);
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Video set, src: ${this.video.src}, currentTime: ${this.video.currentTime}, readyState: ${this.video.readyState}, videoWidth: ${this.video.videoWidth}, videoHeight: ${this.video.videoHeight}`
      );

      this.animation = new Konva.Animation(() => {
        if (!this.video || this.video.paused || this.video.ended) {
          console.log(
            `[${new Date().toISOString()}] MainCanvas: Stopping animation, paused: ${this.video?.paused}, ended: ${this.video?.ended}`
          );
          return false;
        }
        this.konvaImage.image(this.video);
        this.layer.batchDraw();
        console.log(
          `[${new Date().toISOString()}] MainCanvas: Rendered video frame, currentTime: ${this.video.currentTime}`
        );
        return true;
      }, this.layer);
      this.animation.start();
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Started video animation`
      );
    } else if (mediaElement instanceof HTMLImageElement) {
      this.video = null;
      this.konvaImage.image(mediaElement);
      this.layer.batchDraw();
      this.stage.draw();
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Image rendered, src: ${mediaElement.src}, width: ${mediaElement.width}, height: ${mediaElement.height}`
      );
    }
  }

  private handleMediaImported(event: EventPayload): void {
    const { updatedMedias } = event.data || {};
    if (Array.isArray(updatedMedias)) {
      this.medias = updatedMedias;
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Media list updated, count: ${this.medias.length}, medias:`,
        this.medias.map((m) => ({ label: m.label, video: m.video, image: m.image }))
      );
    }
  }

  MediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Media selected, file: ${file.name}`
      );
      eventBus.next({
        type: 'media.import',
        data: { file },
        origin: 'component',
        processed: false,
      });
    }
  }

  togglePlayPause(): void {
    console.log(
      `[${new Date().toISOString()}] MainCanvas: Emitting playback.toggle, cursorX: ${this.cursorX}`
    );
    eventBus.next({
      type: 'playback.toggle',
      data: { currentSecond: this.cursorX / this.distancePerTime },
      origin: 'component',
      processed: false,
    });
  }
}