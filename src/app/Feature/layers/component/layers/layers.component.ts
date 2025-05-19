import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Timeline } from '../../models/timeline.model';
import { timeline } from '../../models/timeLineExemple';
import { ClipComponent } from "../clip/clip.component";

@Component({
  selector: 'app-layers',
  standalone: true,
  imports: [CommonModule, ClipComponent],
  templateUrl: './layers.component.html',
  styleUrls: ['./layers.component.css'],
})
export class LayersComponent  {
  // Define the lists dynamically

  @Input() spaceBefore = 20;
  @Input() distancePerTime = 50;
  timeLine: Timeline = timeline;
  layerHeight = 80;
  time = 30;

  


  get containerStyle() {
    return {
      width: `${this.time * this.distancePerTime + this.spaceBefore}px`,
      'padding-left': `${this.spaceBefore}px`,
      height: `${this.layerHeight * this.timeLine.layers.length}px`,   
    };
  }
}
