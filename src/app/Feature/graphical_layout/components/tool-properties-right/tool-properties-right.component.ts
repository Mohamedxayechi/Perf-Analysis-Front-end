import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ToolPropertiesRightService } from '../../Services/tool-properties-right.service';
import { Subscription } from 'rxjs';
import { trigger, state, style, animate, transition } from '@angular/animations';

// Component decorator defining metadata for the ToolPropertiesRightComponent
@Component({
  selector: 'app-tool-properties-right', // Component selector for HTML
  standalone: true, // Standalone component, no module required
  imports: [
    CommonModule, // Provides common Angular directives (e.g., *ngIf, *ngFor)
    MatIconModule, // Material module for icons
    MatFormFieldModule, // Material module for form fields
    MatInputModule, // Material module for input fields
    MatButtonModule // Material module for buttons
  ],
  templateUrl: './tool-properties-right.component.html', // Path to HTML template
  styleUrls: ['./tool-properties-right.component.scss'], // Path to SCSS styles
  animations: [
    // Animation trigger for properties panel show/hide
    trigger('panelAnimation', [
      // Visible state: fully opaque and in position
      state('visible', style({
        opacity: 1,
        transform: 'translateX(0)'
      })),
      // Hidden state: transparent and slid to the right
      state('hidden', style({
        opacity: 0,
        transform: 'translateX(100%)'
      })),
      // Transition between states with 500ms animation
      transition('visible <=> hidden', [
        animate('500ms ease-in-out')
      ])
    ])
  ]
})
export class ToolPropertiesRightComponent {
  // Flag to control visibility of the properties panel
  showPropertiesPanel = false;
  // Subscription to manage observable subscriptions
  private subscription: Subscription;
  // Flag for flash effect (unused in current code)
  flash = false;

  // Constructor injecting the ToolPropertiesRightService
  constructor(private toolPropertiesRightService: ToolPropertiesRightService) {
    this.subscription = new Subscription();
  }

  // Lifecycle hook to initialize component
  ngOnInit() {
    this.subscribeToPropertiesPanel(); // Call method to set up subscription
  }

  // Subscribes to the showProperties$ observable to update panel visibility
  subscribeToPropertiesPanel() {
    this.subscription = this.toolPropertiesRightService.showProperties$.subscribe((show) => {
      this.showPropertiesPanel = show; // Update visibility based on service
    });
  }

  // Lifecycle hook to clean up subscriptions
  ngOnDestroy() {
    this.subscription.unsubscribe(); // Prevent memory leaks
  }

  // Toggles the properties panel visibility via the service
  onToolButtonClick() {
    this.toolPropertiesRightService.togglePropertiesPanel();
  }
}