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
  styleUrl: './main-video-edit.component.scss',
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
          // console.log(`[${new Date().toISOString()}] MainVideoEdit received event: ${event.type}`);
          switch (event.type) {
            case 'display.durationUpdated':
              if (event.data?.duration) {
                this.time = event.data.duration;
                this.updateWidth();
                // console.log(`[${new Date().toISOString()}] MainVideoEdit: Updated time to ${this.time}`);
              }
              break;
            case 'parameters.distancePerTimeUpdated':
              if (event.data?.distancePerTime) {
                this.distancePerTime = event.data.distancePerTime;
                this.updateWidth();
                // console.log(`[${new Date().toISOString()}] MainVideoEdit: Updated distancePerTime to ${this.distancePerTime}`);
              }
              break;
            case 'cursor.updated':
              if (event.data?.cursorX !== undefined) {
                this.cursorX = event.data.cursorX;
                // console.log(`[${new Date().toISOString()}] MainVideoEdit: Updated cursorX to ${this.cursorX}`);
              }
              break;
            default:
              console.warn(`[${new Date().toISOString()}] Unhandled event in MainVideoEdit: ${event.type}`);
          }
        })
    );
  }

  private updateWidth(): void {
    this.width = this.distancePerTime * this.time;
    // console.log(`[${new Date().toISOString()}] MainVideoEdit: Updated width to ${this.width}`);
  }

  onWidthChange(width: number): void {
    this.width = width;
    // console.log(`[${new Date().toISOString()}] MainVideoEdit: Width changed to ${width}`);
  }

  onScaleChange(scale: number): void {
    this.scale = parseFloat(scale.toFixed(2));
    // console.log(`[${new Date().toISOString()}] MainVideoEdit: Scale changed to ${this.scale}`);
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