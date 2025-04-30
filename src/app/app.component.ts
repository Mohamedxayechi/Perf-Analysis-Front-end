import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


import Konva from 'konva';
import { ToolbarComponent } from './Feature/basic-drawing/toolbar/toolbar.component';
import { MediaplayerComponent } from './Feature/basic-drawing/mediaplayer/mediaplayer.component';
import { PropertiesBarComponent } from './Feature/basic-drawing/properties-bar/properties-bar.component';

@Component({
  selector: 'app-root',
  imports: [ToolbarComponent, MediaplayerComponent, PropertiesBarComponent],
  standalone: true,

  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'basic_drawings';

 
  updatedProps!: Konva.Shape  | Konva.Group;


  onShapeUpdated(shape: Konva.Shape | Konva.Group) {
    this.updatedProps = shape;
  }
}
