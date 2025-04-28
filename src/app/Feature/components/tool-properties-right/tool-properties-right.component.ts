import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ToolPropertiesRightService } from '../../Services/tool-properties-right.service';
import { Subscription } from 'rxjs';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-tool-properties-right',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './tool-properties-right.component.html',
  styleUrls: ['./tool-properties-right.component.scss'],
  animations: [
    trigger('panelAnimation', [
      state('visible', style({
        opacity: 1,
        transform: 'translateX(0)'
      })),
      state('hidden', style({
        opacity: 0,
        transform: 'translateX(100%)'
      })),
      transition('visible <=> hidden', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class ToolPropertiesRightComponent {
  showPropertiesPanel = false;
  private subscription: Subscription;
  flash = false;

  constructor(private toolPropertiesRightService: ToolPropertiesRightService) {
    this.subscription = new Subscription();
  }

  ngOnInit() {
    this.subscription = this.toolPropertiesRightService.showProperties$.subscribe((show) => {
      this.showPropertiesPanel = show;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onToolButtonClick() {
    this.toolPropertiesRightService.togglePropertiesPanel();
  }
}