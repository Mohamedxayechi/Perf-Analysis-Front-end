

import { Component } from '@angular/core';
import { MainVideoEditComponent } from './Feature/video_edit/component/main-video-edit/main-video-edit.component';
import { TimelineInitializerComponent } from './Feature/layers/models/time-line-initialize.component';
import { MediaInitializerComponent } from './Feature/video_edit/models/MediaInitializer.componet';
import { Engine } from './Core/Engine';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainVideoEditComponent, MediaInitializerComponent,TimelineInitializerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent  {
  constructor() {
    // Initialize Engine in constructor to ensure it’s ready before component lifecycle
    Engine.getInstance().init();
  
    // console.log(`[${new Date().toISOString()}] AppComponent: Engine initialized`);
  }

}