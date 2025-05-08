import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DragListElementsComponent } from '../drag-list-elements/drag-list-elements.component';
import { DragListService } from '../../services/drag-list.service';
import { ParameterService } from '../../services/parameter.service';
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

  constructor(
    private dragListService: DragListService,
    private parameterService: ParameterService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.dragListService.medias$.subscribe((medias) => {
        this.medias = medias;
      })
    );

    this.subscription.add(
      this.dragListService.totalTime$.subscribe((total) => {
        this.time = total;
      })
    );

    this.subscription.add(
      this.parameterService.distancePerTime$.subscribe((distance) => {
        this.distancePerTime = distance;
      })
    );

    this.setupEngineListeners();
  }

  private setupEngineListeners(): void {
    this.subscription.add(
      Engine.getInstance()
        .getEvents()
        .on('*', (event: EventPayload) => {
          console.log(`[${new Date().toISOString()}] DragDropHorizontalorting received event: ${event.type}`);

          switch (event.type) {
            case 'media.initialized':
              if (event.data?.medias) {
                this.medias = [...event.data.medias];
                console.log(`[${new Date().toISOString()}] Updated medias on initialization: ${this.medias.length} items`);
              }
              break;

            case 'media.deleted':
              if (event.data?.updatedMedias) {
                this.medias = [...event.data.updatedMedias];
                console.log(`[${new Date().toISOString()}] Updated medias after delete at index ${event.data.index}`);
              }
              break;

              case 'media.duplicated':
                if (event.data?.updatedMedias) {
                  this.medias = [...event.data.updatedMedias];
                  console.log(`[${new Date().toISOString()}] Updated medias after duplicate at index ${event.data.index}, new count: ${this.medias.length}`);
                } else {
                  console.warn(`[${new Date().toISOString()}] No updatedMedias in media.duplicated event`);
                }
                break;

            default:
              console.warn(`[${new Date().toISOString()}] Unhandled event in DragDropHorizontalorting: ${event.type}`);
          }
        })
    );
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.medias, event.previousIndex, event.currentIndex);
    Engine.getInstance().emit({
      type: 'media.reordered',
      data: { medias: this.medias },
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