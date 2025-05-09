import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DragListElementsComponent } from '../drag-list-elements/drag-list-elements.component';
import { Media } from '../../models/time-period.model';
import { Engine } from '../../../../Core/Engine';
import { EventPayload } from '../../../../Core/Utility/event-bus';

@Component({
  selector: 'app-drag-drop-horizontalorting',
  standalone: true,
  templateUrl: './drag-drop-horizontalorting.component.html',
  styleUrl: './drag-drop-horizontalorting.component.css',
  imports: [CdkDropList, CommonModule, DragListElementsComponent],
})
export class DragDropHorizontalortingComponent implements OnInit, OnDestroy {
  medias: Media[] = [];
  private subscription: Subscription = new Subscription();

  @Input() spaceBefore = 15;
  @Input() distancePerTime = 50;
  time = 30;

  constructor() {}

  ngOnInit(): void {
   
    this.setupEngineListeners();
  }

  private setupEngineListeners(): void {
    this.subscription.add(
      Engine.getInstance()
        .getEvents()
        .on('*', (event: EventPayload) => {
          console.log(`[${new Date().toISOString()}] ${event.data}DragDropHorizontalorting received event: ${event.type}, origin: ${event.origin}, processed: ${event.processed}`);
         

          switch (event.type) {
            case 'media.initialized':
              console.log('AAAAAAAAAAAAAAAtriggrerd');
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                console.log(
                  `[${new Date().toISOString()}] DragDropHorizontalSorting: Updated medias on initialization, count: ${this.medias.length}, medias:`,
                  this.medias.map((m) => m.label)
                );
              } else {
                console.warn(
                  `[${new Date().toISOString()}] DragDropHorizontalSorting: No updatedMedias in media.initialized event`
                );
              }
              break;

            case 'media.imported':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated medias after import, count: ${this.medias.length}, medias:`, this.medias.map(m => m.label));
              } else {
                console.warn(`[${new Date().toISOString()}] DragDropHorizontalorting: No updatedMedias in media.imported event`);
              }
              break;

            case 'media.deleted':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated medias after delete at index ${event.data.index}, count: ${this.medias.length}`);
              }
              break;

            case 'media.duplicated':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated medias after duplicate at index ${event.data.index}, count: ${this.medias.length}`);
              }
              break;

            case 'media.splitted':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated medias after split at index ${event.data.index}, splitTime: ${event.data.splitTime}`);
              }
              break;

            case 'media.resized.completed':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated medias after resize at index ${event.data.index}, new time: ${event.data.time}`);
              }
              break;

            case 'display.durationUpdated':
              if (event.data?.duration) {
                this.time = event.data.duration;
                console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated total time to ${this.time}`);
              }
              break;

            case 'parameters.distancePerTimeUpdated':
              if (event.data?.distancePerTime) {
                this.distancePerTime = event.data.distancePerTime;
                console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Updated distancePerTime to ${this.distancePerTime}`);
              }
              break;

            default:
              console.warn(`[${new Date().toISOString()}] DragDropHorizontalorting: Unhandled event: ${event.type}`);
          }
        })
    );
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.medias, event.previousIndex, event.currentIndex);
    console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Reordered medias, new order:`, this.medias.map(m => m.label));
    Engine.getInstance().emit({
      type: 'media.reordered',
      data: { medias: this.medias },
      origin: 'component',
      processed: false,
    });
  }

  updateDistancePerTime(distancePerTime: number): void {
    console.log(`[${new Date().toISOString()}] DragDropHorizontalorting: Emitting parameters.distancePerTimeUpdated with ${distancePerTime}`);
    Engine.getInstance().emit({
      type: 'parameters.distancePerTimeUpdated',
      data: { distancePerTime },
      origin: 'component',
      processed: false,
    });
  }

  get containerStyle() {
    return {
      width: `${this.time * this.distancePerTime + this.spaceBefore}px`,
      'padding-left': `${this.spaceBefore}px`,
    };
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}