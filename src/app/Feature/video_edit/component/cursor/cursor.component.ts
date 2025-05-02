import { Component, Input } from '@angular/core';
import { ParameterService } from '../../services/parameter.service';

@Component({
  selector: 'app-cursor',
  standalone: true,
  imports: [],
  templateUrl: './cursor.component.html',
  styleUrl: './cursor.component.css',
})
export class CursorComponent {
  @Input() spaceBefore = 15;
  @Input() scale = 1;
  @Input() cursorX = 0;
  @Input() distancePerTime = 50;
  seconds = 0;

  constructor(private parameterService: ParameterService) {}
}
