import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { DragListService } from '../../../services/drag-list.service';
import { Media } from '../../../models/time-period.model';
import { ParameterService } from '../../../services/parameter.service';
import { EventsService } from '../../../services/events.service';

@Component({
    selector: 'app-actions-bar',
    standalone: true,
    imports: [MatButtonModule, MatDividerModule, MatIconModule],
    templateUrl: './actions-bar.component.html',
    styleUrl: './actions-bar.component.css'
})
export class ActionsBarComponent {
  
  medias: Media[] = [];
  private distancePerTime = 0;
  private cursorX = 0;
  isPlaying = false;
  

  constructor(private dragListService: DragListService,private parameterService: ParameterService,private eventsService: EventsService) {
    this.dragListService.medias$.subscribe((medias) => {
      this.medias = medias;
    });
    this.parameterService.distancePerTime$.subscribe((distance) => {
      this.distancePerTime = distance;
    });
    this.parameterService.curosrX$.subscribe((cursorX) => {
      this.cursorX = cursorX;
    });
    this.parameterService.isPlaying$.subscribe((isPlaying) => {
      this.isPlaying = Boolean(isPlaying);
    })
  }
  onSplit() {
    const result = this.dragListService.getVideoIndexAndStartTime(this.cursorX / this.distancePerTime);
    if (result) {
      const { index, localSecond } = result;
      this.dragListService.splitMedia(index, localSecond);
    }
  }
  onTogglePlayPause(){
    this.eventsService.togglePlayPauseEvent();
  }
  onClicImportMedia(){
    this.eventsService.openFileDialog();
  }
}
