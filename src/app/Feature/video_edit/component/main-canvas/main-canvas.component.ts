import { AfterViewInit, Component, ElementRef, ViewChild, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Added ChangeDetectorRef for potential advanced scenarios
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

  // Injected ChangeDetectorRef if manual change detection is ever needed,
  // though typically not required for property assignments if not using OnPush aggressively
  // or operating outside Angular zone.
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log(`[${new Date().toISOString()}] MainCanvas: Initializing`);
    this.setupEngineListeners();
  }

  ngAfterViewInit(): void {
    this.canvas = this.canvasContainerRef.nativeElement;
    this.stage = new Konva.Stage({
      container: this.canvas.parentElement! as HTMLDivElement,
      width: 500, // Consider making these dynamic or configurable
      height: 500,
    });

    this.konvaImage = new Konva.Image({
      x: 0,
      y: 0,
      width: 200, // Consider making these dynamic based on media or configurable
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
                this.medias = [...event.data.updatedMedias];
                console.log(`[${new Date().toISOString()}] MainCanvas: Initialized medias, count: ${this.medias.length}, medias:`, this.medias.map(m => m.label));
              }
              break;
            case 'media.imported':
              // Enhanced check for the media.imported event payload
              if (event.data && event.data.updatedMedias) {
                if (Array.isArray(event.data.updatedMedias)) {
                  this.medias = event.data.updatedMedias;
                  console.log(`[${new Date().toISOString()}] MainCanvas: Updated medias after import, count: ${this.medias.length}, medias:`, this.medias.map(m => m.label));
                  // If change detection is an issue (e.g. OnPush strategy or operations outside Angular zone),
                  // you might need to uncomment the following line:
                  // this.cdr.detectChanges();
                } else {
                  console.warn(`[${new Date().toISOString()}] MainCanvas: 'media.imported' event.data.updatedMedias is not an array. Received:`, event.data.updatedMedias);
                }
              } else {
                console.warn(`[${new Date().toISOString()}] MainCanvas: 'media.imported' event received without 'updatedMedias' in data, or data itself is missing. Event data:`, event.data);
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
              // console.warn(`[${new Date().toISOString()}] MainCanvas: Unhandled event: ${event.type}`); // Keep if you want to log all unhandled
          }
          // Mark event as processed by this component if it makes sense for your event bus logic
          // For example, if certain events should only be handled once.
          // event.processed = true; // Be cautious with this, depends on overall event strategy
        })
    );
  }

  MediaSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        console.log(`[${new Date().toISOString()}] MainCanvas: Emitting media.import for file: ${file.name}`);
        Engine.getInstance().emit({
          type: 'media.import',
          data: { file },
          origin: 'component',
          processed: false, // Should be false, as Engine needs to process it
        });
      });
      // Reset file input to allow selecting the same file again
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
    // Avoid emitting if cursor hasn't effectively changed to prevent event loops or redundant processing.
    if (this.cursorX === cursorX) return;

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
    // This component listens for 'media.import.trigger' and clicks the file input.
    // This emission seems redundant if this method is called directly from a button click in this component's template.
    // If called from outside, it's fine. If called by a button in this template, just call:
    // this.fileInput.nativeElement.click();
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

    // Stop any previous rendering/playback explicitly if necessary
    // (e.g., if video.play() is still in a requestAnimationFrame loop from a previous media)
    // This is implicitly handled by isPlaying check in render loops, but good to be mindful.

    if (media.video) {
      const video = document.createElement('video');
      video.src = media.video;
      video.crossOrigin = 'anonymous';
      // Muting video by default can help avoid "play() failed because the user didn't interact with the document first" errors.
      // Playback should ideally be initiated by user gesture.
      video.muted = true;


      video.addEventListener('loadedmetadata', () => {
        const seekTime = startTime + localSecond;
        if (isFinite(seekTime)) {
            video.currentTime = Math.max(0, seekTime); // Ensure currentTime is not NaN and non-negative
        } else {
            console.error(`[${new Date().toISOString()}] MainCanvas: Invalid seekTime ${seekTime} for video ${media.label}`);
            return;
        }


        // Autoplay might be blocked by browsers if not initiated by user interaction.
        // The 'playback.toggled' and 'playback.playFromSecond' flow should ensure user interaction.
        video.play().then(() => {
          console.log(`[${new Date().toISOString()}] MainCanvas: Video playing ${media.label} at ${video.currentTime}`);
          this.konvaImage.image(video);
          this.layer.batchDraw();

          const renderVideoFrame = () => {
            if (!this.isPlaying || video.paused || video.ended) { // Added checks for paused/ended
              console.log(`[${new Date().toISOString()}] MainCanvas: Stopping renderVideoFrame for ${media.label}, isPlaying: ${this.isPlaying}, paused: ${video.paused}, ended: ${video.ended}`);
              if (this.isPlaying && (video.currentTime >= endTime || video.ended)) { // If it naturally ended or reached logical end
                Engine.getInstance().emit({
                  type: 'playback.mediaEnded', // Potentially a new event type
                  data: { mediaIndex: index, currentGlobalSecond: accumulatedBefore + (video.currentTime - startTime) },
                  origin: 'component',
                  processed: false,
                });
              }
              return;
            }

            this.konvaImage.image(video);
            this.konvaImage.getLayer()?.batchDraw();

            const currentGlobalSecond = accumulatedBefore + (video.currentTime - startTime);
            this.changeCursor(currentGlobalSecond * this.distancePerTime);

            if (video.currentTime >= endTime) {
              console.log(`[${new Date().toISOString()}] MainCanvas: Video ${media.label} reached defined endTime ${endTime}.`);
              // Let the playback.mediaEnded event (if implemented as above) handle advancing,
              // or use the existing stop/playFromSecond logic.
              // For now, keeping original logic:
              Engine.getInstance().emit({ type: 'playback.stop', data: {}, origin: 'component', processed: false });
              Engine.getInstance().emit({ type: 'playback.playFromSecond', data: { globalSecond: currentGlobalSecond + 0.016 }, origin: 'component', processed: false });
            } else {
              requestAnimationFrame(renderVideoFrame);
            }
          };
          requestAnimationFrame(renderVideoFrame);
        }).catch((err) => {
          console.error(`[${new Date().toISOString()}] MainCanvas: Video play() failed for ${media.video} (${media.label}):`, err);
        });
      });

      video.addEventListener('error', (err) => {
        console.error(`[${new Date().toISOString()}] MainCanvas: Video load error for ${media.video} (${media.label}):`, err, video.error);
      });
      video.load(); // Start loading the video
    } else if (media.image) {
      const image = new window.Image();
      image.src = media.image;
      image.crossOrigin = 'anonymous';


      image.onload = () => {
        this.konvaImage.image(image);
        this.layer.batchDraw();

        let frameStartTime = performance.now();
        let currentLocalSecond = localSecond;

        const renderImageFrame = (timestamp: number) => {
          if (!this.isPlaying) {
            console.log(`[${new Date().toISOString()}] MainCanvas: Stopping renderImageFrame for ${media.label}, isPlaying: ${this.isPlaying}`);
            return;
          }

          const deltaTime = (timestamp - frameStartTime) / 1000; // seconds
          frameStartTime = timestamp;
          currentLocalSecond += deltaTime;

          const currentGlobalSecond = accumulatedBefore + currentLocalSecond;
          this.changeCursor(currentGlobalSecond * this.distancePerTime);

          if (currentLocalSecond >= duration) {
            console.log(`[${new Date().toISOString()}] MainCanvas: Image ${media.label} duration ended.`);
            Engine.getInstance().emit({ type: 'playback.stop', data: {}, origin: 'component', processed: false });
            Engine.getInstance().emit({ type: 'playback.playFromSecond', data: { globalSecond: accumulatedBefore + duration + 0.016 }, origin: 'component', processed: false });
          } else {
            requestAnimationFrame(renderImageFrame);
          }
        };
        requestAnimationFrame(renderImageFrame);
      };

      image.onerror = () => {
        console.error(`[${new Date().toISOString()}] MainCanvas: Image load error for ${media.image} (${media.label})`);
      };
    } else {
      console.warn(`[${new Date().toISOString()}] MainCanvas: No video or image for media at index ${index}, label: ${media.label}. Clearing canvas.`);
      this.konvaImage.image(undefined);
      this.layer.batchDraw();
      // Potentially advance to next media after a short delay or immediately
      if(this.isPlaying) {
        const currentGlobalSecond = accumulatedBefore + localSecond; // Or just 'duration' if it's treated as 0
        console.log(`[${new Date().toISOString()}] MainCanvas: Advancing past media ${media.label} due to no content.`);
        Engine.getInstance().emit({ type: 'playback.stop', data: {}, origin: 'component', processed: false });
        Engine.getInstance().emit({ type: 'playback.playFromSecond', data: { globalSecond: currentGlobalSecond + 0.016 }, origin: 'component', processed: false });
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.stage) {
      this.stage.destroy();
    }
    console.log(`[${new Date().toISOString()}] MainCanvas: Destroyed`);
  }
}