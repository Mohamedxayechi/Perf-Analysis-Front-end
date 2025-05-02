// Import necessary Angular core modules and lifecycle hooks
import { Component, OnInit, OnDestroy } from '@angular/core'; // Component for defining the component, OnInit and OnDestroy for lifecycle hooks

// Import Angular Material modules for UI components
import { MatIconModule } from '@angular/material/icon'; // For using Material icons
import { MatFormFieldModule } from '@angular/material/form-field'; // For form field UI
import { MatInputModule } from '@angular/material/input'; // For input fields
import { MatButtonModule } from '@angular/material/button'; // For buttons
import { CommonModule } from '@angular/common'; // Provides common Angular directives like ngIf, ngFor

// Import custom service and RxJS Subscription
import { ToolPropertiesRightService } from '../../Services/tool-properties-right.service'; // Service to manage tool properties panel state
import { Subscription } from 'rxjs'; // For handling observable subscriptions

// Import Angular animations for panel transitions
import { trigger, state, style, animate, transition } from '@angular/animations'; // For defining animation triggers and states

// Component decorator to define metadata for the ToolPropertiesRightComponent
@Component({
  selector: 'app-tool-properties-right', // Unique selector for the component
  standalone: true, // Marks this as a standalone component (no NgModule required)
  imports: [
    CommonModule, // Import common Angular directives
    MatIconModule, // Import Material icon module
    MatFormFieldModule, // Import Material form field module
    MatInputModule, // Import Material input module
    MatButtonModule // Import Material button module
  ],
  templateUrl: './tool-properties-right.component.html', // Path to the component's HTML template
  styleUrls: ['./tool-properties-right.component.scss'], // Path to the component's styles
  animations: [
    // Define animation trigger for the properties panel
    trigger('panelAnimation', [
      // State for when the panel is visible
      state('visible', style({
        opacity: 1, // Fully opaque
        transform: 'translateX(0)' // No horizontal translation (panel is in place)
      })),
      // State for when the panel is hidden
      state('hidden', style({
        opacity: 0, // Fully transparent
        transform: 'translateX(100%)' // Move panel off-screen to the right
      })),
      // Transition between visible and hidden states
      transition('visible <=> hidden', [
        animate('500ms ease-in-out') // Animate over 500ms with easing
      ])
    ])
  ]
})
// Component class implementing OnInit and OnDestroy lifecycle hooks
export class ToolPropertiesRightComponent implements OnInit, OnDestroy {
  // Boolean to control the visibility of the properties panel
  showPropertiesPanel = false;

  // Subscription to manage the observable from the service
  private subscription: Subscription;

  // Boolean to control a flash effect (not used in provided code logic)
  flash = false;

  // Constructor with dependency injection for the ToolPropertiesRightService
  constructor(private toolPropertiesRightService: ToolPropertiesRightService) {
    // Initialize the subscription object
    this.subscription = new Subscription();
  }

  // Lifecycle hook: Called after component initialization
  ngOnInit(): void {
    // Subscribe to the service to listen for panel visibility changes
    this.subscribeToPropertiesPanel();
  }

  // Method to subscribe to the service's showProperties$ observable
  subscribeToPropertiesPanel() {
    // Update showPropertiesPanel based on the service's observable
    this.subscription = this.toolPropertiesRightService.showProperties$.subscribe((show) => {
      this.showPropertiesPanel = show; // Update panel visibility
    });
  }

  // Lifecycle hook: Called when the component is destroyed
  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.subscription.unsubscribe();
  }

  // Method to handle button click for toggling the properties panel
  onToolButtonClick() {
    // Call the service to toggle the panel's visibility
    this.toolPropertiesRightService.togglePropertiesPanel();
  }
}