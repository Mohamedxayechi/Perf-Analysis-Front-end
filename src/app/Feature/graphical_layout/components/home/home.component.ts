import { Component } from '@angular/core';
import { ToolPropertiesRightComponent } from '../tool-properties-right/tool-properties-right.component';
import { TopScreenMenuComponent } from '../top-screen-menu/top-screen-menu.component';
import { ToolGraphicalLeftComponent } from '../tool-graphical-left/tool-graphical-left.component';
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

}