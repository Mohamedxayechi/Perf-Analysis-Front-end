import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { Media } from '../../models/time-period.model';
import { Engine } from '../../../../Core/Engine';
import { EventPayload } from '../../../../Core/Utility/event-bus';
import { DragListElementComponent } from '../drag-list-element/drag-list-element.component';

@Component({
  selector: 'app-drag-drop-horizontalorting',
  standalone: true,
  templateUrl: './drag-drop-horizontalorting.component.html',
  styleUrl: './drag-drop-horizontalorting.component.css',
  imports: [CdkDropList, CommonModule, DragListElementComponent],
})
export class DragDropHorizontalortingComponent implements OnInit, OnDestroy {
  medias: Media[] = [];
  private subscription: Subscription = new Subscription();

  @Input() spaceBefore = 15;
  @Input() distancePerTime = 50;
  @Input()  time = 30;


  /**
   * Initializes the component by setting up event listeners for media and timeline updates.
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
            case 'media.initialized':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                // console.log(
                //   `[${new Date().toISOString()}] DragDropHorizontalSorting: Updated medias on initialization, count: ${this.medias.length}, medias:`,
                //   this.medias.map((m) => m.label)
                // );
              } else {
                // console.warn(
                //   `[${new Date().toISOString()}] DragDropHorizontalSorting: No updatedMedias in media.initialized event`
                // );
              }
              break;

            case 'media.imported':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                // console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated medias after import, count: ${this.medias.length}, medias:`, this.medias.map(m => m.label));
              } else {
                // console.warn(`[${new Date().toISOString()}] DragDropHorizontalorting: No updatedMedias in media.imported event`);
              }
              break;

            case 'media.deleted':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                // console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated medias after delete at index ${event.data.index}, count: ${this.medias.length}`);
              }
              break;

            case 'media.duplicated':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                // console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated medias after duplicate at index ${event.data.index}, count: ${this.medias.length}`);
              }
              break;

            case 'media.splitted':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                // console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated medias after split at index ${event.data.index}, splitTime: ${event.data.splitTime}`);
              }
              break;

            case 'media.resized.completed':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                // console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated medias after resize at index ${event.data.index}, new time: ${event.data.time}`);
              }
              break;

            case 'display.durationUpdated':
              if (event.data?.duration) {
                this.time = event.data.duration;
                //  console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated total time to ${this.time}`);
              }
              break;

            case 'parameters.distancePerTimeUpdated':
              if (event.data?.distancePerTime) {
                this.distancePerTime = event.data.distancePerTime;
                // console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated distancePerTime to ${this.distancePerTime}`);
              }
              break;

            default:
              // console.warn(`[${new Date().toISOString()}] DragDropHorizontalorting: Unhandled event: ${event.type}`);
          }
        })
    );
  }

  /**
   * Handles the drag-and-drop event to reorder media items and emits the updated list.
   * @param event The drag-and-drop event containing previous and current indices.
   */
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.medias, event.previousIndex, event.currentIndex);
    // console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Reordered medias, new order:`, this.medias.map(m => m.label));
    Engine.getInstance().emit({
      type: 'media.reordered',
      data: { medias: this.medias },
      origin: 'component',
      processed: false,
    });
  }

  /**
   * Emits an event to update the distance per time (pixels per second) for the timeline.
   * @param distancePerTime The new distance per time value.
   */
  updateDistancePerTime(distancePerTime: number): void {
    // console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Emitting parameters.distancePerTimeUpdated with ${distancePerTime}`);
    Engine.getInstance().emit({
      type: 'parameters.distancePerTimeUpdated',
      data: { distancePerTime },
      origin: 'component',
      processed: false,
    });
  }

  /**
   * Computes the CSS styles for the container based on total time and distance per time.
   * @returns An object containing the width and padding-left styles.
   */
  get containerStyle() {
    return {
      width: `${this.time * this.distancePerTime + this.spaceBefore}px`,
      'padding-left': `${this.spaceBefore}px`,
    };
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}