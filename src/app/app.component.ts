


import { Component } from '@angular/core';
import { MainVideoEditComponent } from './Feature/video_edit/component/main-video-edit/main-video-edit.component';
import { Engine } from '../app/Core/Engine';
import { MediaInitializerComponent } from "./Feature/video_edit/models/MediaInitializer.componet";
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainVideoEditComponent, MediaInitializerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Perf-analysis-Front-End';
  ngOnInit(): void {
    Engine.getInstance().init();
  }
}