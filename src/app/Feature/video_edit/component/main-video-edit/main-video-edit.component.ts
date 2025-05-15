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

  constructor() {
    this.updateWidth();
  }

  ngOnInit(): void {
    this.setupEngineListeners();
  }

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

  private updateWidth(): void {
    this.width = this.distancePerTime * this.time; // Width based on distancePerTime
    // Optionally, apply scale to width if canvas uses it directly
    // this.width = this.distancePerTime * this.time * this.scale;
  }

  onWidthChange(width: number): void {
    this.width = width;
  }

  onScaleChange(scale: number): void {
    this.scale = parseFloat(scale.toFixed(2));
    this.distancePerTime = this.scale * 50; // Update distancePerTime when scale changes
    this.updateWidth();
    this.updateDistancePerTime(this.distancePerTime); // Emit updated distancePerTime
  }

  onCursorMove(cursorX: number): void {
    Engine.getInstance().emit({
      type: 'cursor.changed',
      data: { cursorX },
      origin: 'component',
      processed: false,
    });
  }

  updateDistancePerTime(distancePerTime: number): void {
    Engine.getInstance().emit({
      type: 'parameters.distancePerTimeUpdated',
      data: { distancePerTime },
      origin: 'component',
      processed: false,
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}