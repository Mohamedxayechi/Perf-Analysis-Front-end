import { Component, OnInit } from '@angular/core';
import { TimelineCanvasDirective } from '../../directives/time-line-canvas.directive';
import { DragDropHorizontalortingComponent } from '../drag-drop-horizontalorting/drag-drop-horizontalorting.component';
import { FormsModule } from '@angular/forms';
import { ZoomComponent } from '../zoom/zoom.component';
import { MainCanvasComponent } from '../main-canvas/main-canvas.component';
import { CursorComponent } from '../cursor/cursor.component';
import { ActionsBarComponent } from '../tool/actions-bar/actions-bar.component';
import { DragListService } from '../../services/drag-list.service';
import { ParameterService } from '../../services/parameter.service';
import { LayersComponent } from '../../../layers/component/layers/layers.component';

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
        LayersComponent
    ],
    templateUrl: './main-video-edit.component.html',
    styleUrl: './main-video-edit.component.scss'
})
export class MainVideoEditComponent implements OnInit {
  distancePerTime = 50;
  width = 3000;
  time = 30;
  scale = 1;
  cursorX = 0;
  spaceBefore = 20;

  constructor(
    private dragListService: DragListService,
    private parameterService: ParameterService
  ) {
    this.width = this.distancePerTime * this.time;
  }
  ngOnInit(): void {
    this.dragListService.totalTime$.subscribe((total) => {
      this.time = total;
    });
    this.parameterService.distancePerTime$.subscribe((distance) => {
      this.distancePerTime = distance;
    });
    this.parameterService.curosrX$.subscribe((cursorX) => {
      this.cursorX = cursorX;
    });
  }

  onWidthChange(width: number) {
    this.width = width;
  }

  onScaleChange(scale: number) {
    this.scale = parseFloat(scale.toFixed(2));
  }
  onCursorMove(cursorX: number) {
    this.cursorX = cursorX;
  }
}
