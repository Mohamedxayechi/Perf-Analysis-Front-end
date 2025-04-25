import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToolPropertiesRightComponent } from '../tool-properties-right/tool-properties-right.component';
import { TopScreenMenuComponent } from '../top-screen-menu/top-screen-menu.component';
import { ToolGraphicalLeftComponent } from '../tool-graphical-left/tool-graphical-left.component';
import { Subscription } from 'rxjs';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ToolPropertiesRightService } from '../../Services/tool-properties-right.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  
  imports: [
    CommonModule,
    ToolPropertiesRightComponent,
    TopScreenMenuComponent,
    ToolGraphicalLeftComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
 
})
export class HomeComponent  {

  constructor() {
  }

}