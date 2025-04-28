import { Component, Input } from '@angular/core';
import { ResizableDirective } from '../../directives/resizeable.directive';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ItemListMenuComponent } from "../tool/item-list-menu/item-list-menu.component";
import { Media } from '../../models/time-period.model';

@Component({
    selector: 'app-drag-list-elements',
    standalone: true,
    imports: [ResizableDirective, CommonModule, CdkDrag, CdkDragHandle, ItemListMenuComponent],
    templateUrl: './drag-list-elements.component.html',
    styleUrl: "./drag-list-elements.component.css"
})
export class DragListElementsComponent {
@Input () distancePerTime = 50;
@Input() index = 0;
@Input() item :Media = {
    startTime: 0, endTime: 0, label: '',
    time: 0,
    thumbnail: ''
};


}
