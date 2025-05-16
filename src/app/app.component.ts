


import { Component, OnInit } from '@angular/core';
import { MainVideoEditComponent } from './Feature/video_edit/component/main-video-edit/main-video-edit.component';
import { Engine } from '../app/Core/Engine';
import { MediaInitializerComponent } from "./Feature/video_edit/models/MediaInitializer.componet";
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainVideoEditComponent, MediaInitializerComponent,HttpClientModule,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor() {
    // Initialize Engine in constructor to ensure it’s ready before component lifecycle
    Engine.getInstance().init();
  
    console.log(`[${new Date().toISOString()}] AppComponent: Engine initialized`);
  }

  ngOnInit(): void {
    // Additional setup if needed
  }
}