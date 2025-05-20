import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import Konva from 'konva';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { eventBus, EventPayload } from '../../../../Core/Utility/event-bus';
import { Media } from '../../models/time-period.model';
import { MatDividerModule } from '@angular/material/divider';
import { Engine } from '../../../../Core/Engine';

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
  private animateFrame: number = 0;
  private cursorX: number = 0;
  private distancePerTime: number = 50;
  private isPlaying: boolean = false;
  private readonly CANVAS_WIDTH = 500;
  private readonly CANVAS_HEIGHT = 500;

  /**
   * Initializes the component and subscribes to the event bus for event handling.
   */
  constructor() {
    console.log(`[${new Date().toISOString()}] MainCanvas: Constructor called, subscribing to eventBus`);
    eventBus.subscribe((event: EventPayload) => {
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Received event: ${event.type}, origin: ${event.origin}, mediaElement: ${event.data?.mediaElement?.constructor.name || 'undefined'}`
      );
      this.handleEvent(event);
    });
  }

  /**
   * Sets up the Konva stage and layer after the view is initialized.
   */
  ngAfterViewInit(): void {
    console.log(`[${new Date().toISOString()}] MainCanvas: ngAfterViewInit, setting up Konva stage`);
    this.stage = new Konva.Stage({
      container: this.canvasContainerRef.nativeElement,
      width: this.CANVAS_WIDTH,
      height: this.CANVAS_HEIGHT,
    });
    this.layer = new Konva.Layer();
    this.konvaImage = new Konva.Image({
      x: 0,
      y: 0,
      width: this.CANVAS_WIDTH,
      height: this.CANVAS_HEIGHT,
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

  /**
   * Handles incoming events from the event bus and processes them based on type.
   * @param event The event payload to process.
   */
  private handleEvent(event: EventPayload): void {
    // Only process render.frame from 'domain' origin (Display service)
    if (event.type === 'render.frame' && event.origin !== 'domain') {
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Ignoring render.frame from non-domain origin: ${event.origin}`
      );
      return;
    }

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
        case 'playback.toggled':
          this.isPlaying = event.data?.isPlaying || false;
          console.log(
            `[${new Date().toISOString()}] MainCanvas: Playback toggled, isPlaying: ${this.isPlaying}`
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

  /**
   * Renders a frame on the canvas based on the provided media element.
   * @param event The event payload containing the media element and dimensions.
   */
  private handleRenderFrame(event: EventPayload): void {
    const { mediaElement, width, height } = event.data || {};
    console.log(
      `[${new Date().toISOString()}] MainCanvas: render.frame, mediaElement: ${mediaElement?.constructor.name || 'null'}, width: ${width}, height: ${height}, isPlaying: ${this.isPlaying}, src: ${mediaElement?.src || 'undefined'}`
    );

    // Stop any ongoing animation
    if (this.animateFrame) {
      cancelAnimationFrame(this.animateFrame);
      this.animateFrame = 0;
    }

    // Clear canvas if mediaElement is null
    if (!mediaElement) {
      this.konvaImage.image(null);
      this.video = null;
      this.layer.batchDraw();
      this.stage.draw();
      console.log(`[${new Date().toISOString()}] MainCanvas: Cleared canvas`);
      return;
    }

    // Calculate scaling to fit media within fixed canvas while preserving aspect ratio
    const mediaWidth = width || 200;
    const mediaHeight = height || 200;
    const scale = Math.min(this.CANVAS_WIDTH / mediaWidth, this.CANVAS_HEIGHT / mediaHeight);
    this.konvaImage.width(mediaWidth * scale);
    this.konvaImage.height(mediaHeight * scale);
    this.konvaImage.x((this.CANVAS_WIDTH - this.konvaImage.width()) / 2);
    this.konvaImage.y((this.CANVAS_HEIGHT - this.konvaImage.height()) / 2);

    if (mediaElement instanceof HTMLVideoElement) {
      this.video = mediaElement;
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Video element received, src: ${this.video.src}, currentTime: ${this.video.currentTime}, readyState: ${this.video.readyState}, videoWidth: ${this.video.videoWidth}, videoHeight: ${this.video.videoHeight}`
      );

      const renderVideoFrame = () => {
        if (!this.isPlaying || !this.video || this.video.paused || this.video.ended) {
          console.log(
            `[${new Date().toISOString()}] MainCanvas: Stopping video frame render, isPlaying: ${this.isPlaying}, paused: ${this.video?.paused}, ended: ${this.video?.ended}`
          );
          this.animateFrame = 0;
          return;
        }
        this.konvaImage.image(this.video);
        this.layer.batchDraw();
        this.stage.draw();
        console.log(
          `[${new Date().toISOString()}] MainCanvas: Rendered video frame, currentTime: ${this.video.currentTime}`
        );
        this.animateFrame = requestAnimationFrame(renderVideoFrame);
      };

      if (this.video.readyState >= 2) { // HAVE_CURRENT_DATA
        this.konvaImage.image(this.video);
        this.layer.batchDraw();
        this.stage.draw();
        console.log(
          `[${new Date().toISOString()}] MainCanvas: Initial video frame rendered, currentTime: ${this.video.currentTime}`
        );
        if (this.isPlaying) {
          renderVideoFrame();
        }
      } else {
        this.video.addEventListener('loadedmetadata', () => {
          console.log(
            `[${new Date().toISOString()}] MainCanvas: Video metadata loaded, starting render`
          );
          this.konvaImage.image(this.video);
          this.layer.batchDraw();
          this.stage.draw();
          if (this.isPlaying) {
            renderVideoFrame();
          }
        }, { once: true });
        this.video.addEventListener('error', () => {
          console.error(
            `[${new Date().toISOString()}] MainCanvas: Video load error, src: ${this.video?.src}`
          );
          this.konvaImage.image(null);
          this.layer.batchDraw();
          this.stage.draw();
          console.log(`[${new Date().toISOString()}] MainCanvas: Cleared canvas due to video error`);
        }, { once: true });
      }
    } else if (mediaElement instanceof HTMLImageElement) {
      this.video = null;
      // Render the image regardless of playback state
      this.konvaImage.image(mediaElement);
      this.layer.batchDraw();
      this.stage.draw();
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Image rendered, src: ${mediaElement.src}, width: ${mediaElement.width}, height: ${mediaElement.height}`
      );
    } else {
      console.error(
        `[${new Date().toISOString()}] MainCanvas: Invalid mediaElement type: ${mediaElement?.constructor.name}`
      );
      this.konvaImage.image(null);
      this.video = null;
      this.layer.batchDraw();
      this.stage.draw();
      console.log(`[${new Date().toISOString()}] MainCanvas: Cleared canvas due to invalid mediaElement`);
    }
  }

  /**
   * Updates the media list when new media is imported.
   * @param event The event payload containing the updated media list.
   */
  private handleMediaImported(event: EventPayload): void {
    const { updatedMedias } = event.data || {};
    if (Array.isArray(updatedMedias)) {
      this.medias = updatedMedias;
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Media list updated, count: ${this.medias.length}, medias:`,
        this.medias.map((m) => ({ label: m.label, video: m.video, image: m.image, thumbnail: m.thumbnail }))
      );
    }
  }

  /**
   * Handles file selection for media import and emits an event with the selected file.
   * @param event The input event containing the selected file.
   */
  MediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log(
        `[${new Date().toISOString()}] MainCanvas: Media selected, file: ${file.name}`
      );
      Engine.getInstance().emit({
        type: 'media.import',
        data: { file },
        origin: 'component',
        processed: false,
      });
    }
  }


}