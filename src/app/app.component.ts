

import { Component } from '@angular/core';
import { MainVideoEditComponent } from './Feature/video_edit/component/main-video-edit/main-video-edit.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainVideoEditComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Perf-analysis-Front-End';
}