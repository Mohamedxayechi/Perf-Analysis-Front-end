import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimelineCanvasDirective } from '../../directives/time-line-canvas.directive';
import { DragDropHorizontalortingComponent } from '../drag-drop-horizontalorting/drag-drop-horizontalorting.component';
import { FormsModule } from '@angular/forms';
import { ZoomComponent } from '../zoom/zoom.component';
import { MainCanvasComponent } from '../main-canvas/main-canvas.component';
import { CursorComponent } from '../cursor/cursor.component';
import { ActionsBarComponent } from '../tool/actions-bar/actions-bar.component';
import { Engine } from '../../../../Core/Engine';
import { EventPayload } from '../../../../Core/Utility/event-bus';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-video-edit',
  standalone: true,
  imports: [
    TimelineCanvasDirective,
    DragDropHorizontalortingComponent,
    FormsModule,
    ZoomComponent,
    MainCanvasComponent,
    CursorComponent,
    ActionsBarComponent,
  ],
  templateUrl: './main-video-edit.component.html',
  styleUrls: ['./main-video-edit.component.scss'],
})
export class MainVideoEditComponent implements OnInit, OnDestroy {
  distancePerTime = 50;
  width = 3000;
  time = 30;
  scale = 1;
  cursorX = 0;
  spaceBefore = 20;
  private subscription: Subscription = new Subscription();

  /**
   * Initializes the component and calculates the initial timeline width.
   */
  constructor() {
    this.updateWidth();
  }

  /**
   * Sets up event listeners for engine events on component initialization.
   */
  ngOnInit(): void {
    this.setupEngineListeners();
  }

  /**
   * Subscribes to engine events to update timeline duration, zoom, and cursor position.
   */
  private setupEngineListeners(): void {
    this.subscription.add(
      Engine.getInstance()
        .getEvents()
        .on('*', (event: EventPayload) => {
          switch (event.type) {
            case 'display.durationUpdated':
              if (event.data?.duration) {
                this.time = event.data.duration;
                this.updateWidth();
              }
              break;
            case 'parameters.distancePerTimeUpdated':
              if (event.data?.distancePerTime) {
                this.distancePerTime = event.data.distancePerTime;
                this.scale = this.distancePerTime / 50; // Sync scale with distancePerTime
                this.updateWidth();
              }
              break;
            case 'cursor.updated':
              if (event.data?.cursorX !== undefined) {
                this.cursorX = event.data.cursorX;
                
              }
              break;
            case 'zoom.changed': // Handle zoom changes from Display service
              if (event.data?.zoom) {
                this.scale = event.data.zoom;
                this.distancePerTime = this.scale * 50;
                this.updateWidth();
              }
              break;
            default:
              console.warn(`[${new Date().toISOString()}] Unhandled event in MainVideoEdit: ${event.type}`);
          }
        })
    );
  }

  /**
   * Updates the timeline width based on the current duration and distance per time.
   */
  private updateWidth(): void {
    this.width = this.distancePerTime * this.time; // Width based on distancePerTime
    // Optionally, apply scale to width if canvas uses it directly
    // this.width = this.distancePerTime * this.time * this.scale;
  }

  /**
   * Handles changes to the timeline width.
   * @param width The new width value in pixels.
   */
  onWidthChange(width: number): void {
    this.width = width;
  }

  /**
   * Handles changes to the zoom scale and updates the distance per time.
   * @param scale The new scale value.
   */
  onScaleChange(scale: number): void {
    this.scale = parseFloat(scale.toFixed(2));
    this.distancePerTime = this.scale * 50; // Update distancePerTime when scale changes
    this.updateWidth();
    this.updateDistancePerTime(this.distancePerTime); // Emit updated distancePerTime
  }

  /**
   * Emits an event when the cursor position changes.
   * @param cursorX The new x-coordinate of the cursor in pixels.
   */
  onCursorMove(cursorX: number): void {
    Engine.getInstance().emit({
      type: 'cursor.changed',
      data: { cursorX },
      origin: 'component',
      processed: false,
    });
  }

  /**
   * Emits an event to update the distance per time (pixels per second) for the timeline.
   * @param distancePerTime The new distance per time value.
   */
  updateDistancePerTime(distancePerTime: number): void {
    Engine.getInstance().emit({
      type: 'parameters.distancePerTimeUpdated',
      data: { distancePerTime },
      origin: 'component',
      processed: false,
    });
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}