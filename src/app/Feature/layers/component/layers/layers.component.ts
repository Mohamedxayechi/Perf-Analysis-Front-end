import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Timeline } from '../../models/timeline.model';
// import { timeline } from '../../models/timeLineExemple';
import { ClipComponent } from '../clip/clip.component';
import { Subscription } from 'rxjs';
import { Engine } from '../../../../Core/Engine';
import { EventPayload } from '../../../../Core/Utility/event-bus';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'app-layers',
  standalone: true,
  imports: [
    CommonModule,
    ClipComponent,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
  ],
  templateUrl: './layers.component.html',
  styleUrls: ['./layers.component.css'],
})
export class LayersComponent implements OnInit {
  // Define the lists dynamically

  @Input() spaceBefore = 20;
  @Input() distancePerTime = 50;
  @Input() time = 30;
  timeLine: Timeline = new Timeline();
  layerHeight = 80;
  
  private subscription: Subscription = new Subscription();
  /**
   * Initializes the component by setting up event listeners for  timeline updates.
   */
  ngOnInit(): void {
    this.setupEngineListeners();
  }

  /**
   * Subscribes to engine events to update the media list, total time, and distance per time.
   */
  private setupEngineListeners(): void {
    this.subscription.add(
      Engine.getInstance()
        .getEvents()
        .on('*', (event: EventPayload) => {
          // console.log(`[${new Date().toISOString()}] ${event.data}DragDropHorizontalorting received event: ${event.type}, origin: ${event.origin}, processed: ${event.processed}`);
          switch (event.type) {
            case 'timeLine.initialized':
              if (event.data?.timeLine) {
                this.timeLine = event.data.timeLine;
                // console.log(
                //   `[${new Date().toISOString()}] LayersComponent: initialized timeline, layers: ${
                //     this.timeLine.layers.length
                //   }`
                // );
              } else {
                // console.warn(
                //   `[${new Date().toISOString()}] Layers: No updatedMedias in media.initialized event`
                // );
              }
              break;
            case 'timeLine.updated':
              if (event.data?.timeLine) {
                this.timeLine = event.data.timeLine;
                console.log(
                  `[${new Date().toISOString()}] LayersComponent: Updated timeline, layers:`,
                  this.timeLine
                );
              } else {
                console.warn(
                  `[${new Date().toISOString()}] Layers: No updatedMedias in media.initialized event`
                );
              }
              break;
            case 'timeLine.LayersAdjusted':
              if (event.data?.timeLine) {
                this.timeLine = event.data.timeLine;
                console.log(
                  `[${new Date().toISOString()}] LayersComponent: Adjust TimeLine Layers, TimeLine:`,
                  this.timeLine
                );
              } else {
                console.warn(
                  `[${new Date().toISOString()}] Layers: No updatedMedias in media.initialized event`
                );
              }
              break;

            default:
            // console.warn(
            //   `[${new Date().toISOString()}] Layers: Unhandled event: ${
            //     event.type
            //   }`
            // );
          }
        })
    );
  }

  get containerStyle() {
    return {
      width: `${this.time * this.distancePerTime + this.spaceBefore}px`,
      'padding-left': `${this.spaceBefore}px`,
      height: `${this.layerHeight * this.timeLine.layers.length}px`,
    };
  }
}
