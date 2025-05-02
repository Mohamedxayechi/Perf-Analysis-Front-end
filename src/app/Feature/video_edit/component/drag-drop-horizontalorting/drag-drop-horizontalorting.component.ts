import { Component, Input, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { DragListElementsComponent } from '../drag-list-elements/drag-list-elements.component';
import { DragListService } from '../../services/drag-list.service';
import { Media } from '../../models/time-period.model';
import { ParameterService } from '../../services/parameter.service';

@Component({
    selector: 'app-drag-drop-horizontalorting',
    standalone: true,
    templateUrl: 'drag-drop-horizontalorting.component.html',
    styleUrl: 'drag-drop-horizontalorting.component.css',
    imports: [CdkDropList, CommonModule, DragListElementsComponent]
})
export class DragDropHorizontalortingComponent implements OnInit {

  medias: Media[] = [];
  constructor(private dragListService: DragListService,private parameterService : ParameterService) {}

  @Input() spaceBefore = 15;
  @Input() distancePerTime = 50;
  time = 30;
  
  
  ngOnInit(): void {

     this.dragListService.medias$.subscribe((medias) => {
      this.medias = medias;
     });
     
     this.dragListService.totalTime$.subscribe(total => {
      this.time = total;
    });
    this.parameterService.distancePerTime$.subscribe((distance) => {
      this.distancePerTime = distance;
      
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.medias, event.previousIndex, event.currentIndex);
  }

  get containerStyle() {
    return {
      width: `${this.time * this.distancePerTime + this.spaceBefore}px`,
      'padding-left': `${this.spaceBefore}px`
    };
  }
}
