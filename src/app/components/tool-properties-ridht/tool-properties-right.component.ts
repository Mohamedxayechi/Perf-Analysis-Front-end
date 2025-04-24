import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-tool-properties-ridht',
  standalone: true,
  imports: [  
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule],
  templateUrl: './tool-properties-right.component.html',
  styleUrl: './tool-properties-right.component.scss'
})
export class ToolPropertiesRightComponent {

}
