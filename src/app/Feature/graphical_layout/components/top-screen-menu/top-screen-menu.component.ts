// Import necessary Angular core and common modules
import { Component } from '@angular/core'; // Component for defining the component
import { CommonModule } from '@angular/common'; // Provides common Angular directives like ngIf, ngFor
import { Router } from '@angular/router'; // Router for navigating between routes

// Component decorator to define metadata for the TopScreenMenuComponent
@Component({
  selector: 'app-top-screen-menu', // Unique selector for the component
  standalone: true, // Marks this as a standalone component (no NgModule required)
  imports: [CommonModule], // Import common Angular directives
  templateUrl: './top-screen-menu.component.html', // Path to the component's HTML template
  styleUrl: './top-screen-menu.component.scss' // Path to the component's styles
})
export class TopScreenMenuComponent {
  // Inject the Router service for navigation
  constructor(private router: Router) {}

  // Array of menu items, each with a name, options, and isOpen state
  menuItems = [
    {
      name: 'File', // Menu category
      options: ['New File', 'Open File', 'Save File'], // Dropdown options
      isOpen: false // Tracks whether the dropdown is open
    },
    {
      name: 'Tools', // Menu category
      options: ['Tool Option 1', 'Tool Option 2', 'Tool Option 3'], // Dropdown options
      isOpen: false // Tracks whether the dropdown is open
    },
    {
      name: 'View', // Menu category
      options: ['Zoom In', 'Zoom Out', 'Reset View'], // Dropdown options
      isOpen: false // Tracks whether the dropdown is open
    },
    {
      name: 'Settings', // Menu category
      options: ['Preferences', 'Customize', 'Reset Settings'], // Dropdown options
      isOpen: false // Tracks whether the dropdown is open
    },
    {
      name: 'Help', // Menu category
      options: ['Documentation', 'Support', 'About'], // Dropdown options
      isOpen: false // Tracks whether the dropdown is open
    }
  ];

  // Toggles the dropdown for a specific menu item, closing others
  toggleDropdown(item: any) {
    this.menuItems.forEach(menu => {
      if (menu !== item) {
        menu.isOpen = false; // Close all other dropdowns
      }
    });
    item.isOpen = !item.isOpen; // Toggle the clicked dropdown
  }

  // Handles selection of a dropdown option
  selectOption(option: string) {
    console.log(`Selected: ${option}`); // Log the selected option
    if (option === 'New File') {
      this.router.navigate(['/']); // Navigate to root route for 'New File'
    }
    this.closeAllDropdowns(); // Close all dropdowns after selection
  }

  // Closes all dropdown menus
  closeAllDropdowns() {
    this.menuItems.forEach(item => (item.isOpen = false)); // Set isOpen to false for all items
  }

  // Handles keyboard events for menu items (Enter or Space to toggle dropdown)
  handleKeydown(event: KeyboardEvent, item: any) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent default behavior (e.g., scrolling on Space)
      this.toggleDropdown(item); // Toggle the dropdown
    }
  }

  // Handles keyboard events for dropdown options (Enter or Space to select)
  handleOptionKeydown(event: KeyboardEvent, option: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent default behavior (e.g., scrolling on Space)
      this.selectOption(option); // Select the option
    }
  }
}