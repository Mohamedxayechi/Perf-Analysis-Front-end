// Import necessary Angular core modules and decorators
import { Component, ElementRef, ViewChild, HostListener } from '@angular/core'; // Component for defining the component, ElementRef for DOM access, ViewChild for referencing child elements, HostListener for event listening

// Import Angular Material modules for UI components
import { MatIconModule } from '@angular/material/icon'; // For Material icons
import { MatFormFieldModule } from '@angular/material/form-field'; // For form fields
import { MatInputModule } from '@angular/material/input'; // For input fields
import { MatButtonModule } from '@angular/material/button'; // For buttons
import { MatMenuModule } from '@angular/material/menu'; // For dropdown menus
import { CommonModule } from '@angular/common'; // Provides common Angular directives like ngIf, ngFor

// Import custom interfaces for type safety
import { DropdownItem, MenuKey, Section, Tool } from '../../interfaces/InterfaceToolGraphical'; // Interfaces for dropdown items, menu keys, sections, and tools

// Component decorator to define metadata for the ToolGraphicalLeftComponent
@Component({
  selector: 'app-tool-graphical-left', // Unique selector for the component
  standalone: true, // Marks this as a standalone component (no NgModule required)
  imports: [
    CommonModule, // Import common Angular directives
    MatIconModule, // Import Material icon module
    MatFormFieldModule, // Import Material form field module
    MatInputModule, // Import Material input module
    MatButtonModule, // Import Material button module
    MatMenuModule // Import Material menu module for dropdowns
  ],
  templateUrl: './tool-graphical-left.component.html', // Path to the component's HTML template
  styleUrls: ['./tool-graphical-left.component.scss'] // Path to the component's styles
})
export class ToolGraphicalLeftComponent {
  // Tracks the currently active dropdown menu (null if none)
  currentMenu: MenuKey = null;

  // Reference to the hidden file input element for image uploads
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Array of sections (2D and 3D tools) with their respective tools
  sections: Section[] = [
    {
      title: '2D', // Section title
      tools: [
        { type: 'button', icon: 'title' }, // Button tool for text
        { type: 'image-upload', icon: 'image', action: () => this.triggerFileInput() }, // Image upload tool with action to trigger file input
        { type: 'button', icon: 'crop_square' }, // Button tool for square crop
        { type: 'dropdown', icon: 'gesture', menuKey: 'gesture' }, // Dropdown for gesture tools
        { type: 'dropdown', icon: 'timeline', menuKey: 'line' }, // Dropdown for line styles
        { type: 'dropdown', icon: 'pentagon', menuKey: 'polygon' }, // Dropdown for polygon shapes
        { type: 'button', icon: 'straighten' }, // Button tool for measurement
        { type: 'button', icon: 'grid_on' } // Button tool for grid
      ]
    },
    {
      title: '3D', // Section title
      tools: [
        { type: 'button', icon: '3d_rotation' }, // Button tool for 3D rotation
        { type: 'button', icon: 'edit' }, // Button tool for editing
        { type: 'button', icon: 'circle' }, // Button tool for circle
        { type: 'dropdown', icon: 'change_history', menuKey: 'shape3D' } // Dropdown for 3D shapes
      ]
    }
  ];

  // Object mapping menu keys to their respective dropdown items
  dropdownItems: Record<Exclude<MenuKey, null>, DropdownItem[]> = {
    line: [
      { value: 'solid', label: 'Solid', previewClass: 'solid-line' }, // Solid line option
      { value: 'dashed', label: 'Dashed', previewClass: 'dashed-line' }, // Dashed line option
      { value: 'dotted', label: 'Dotted', previewClass: 'dotted-line' }, // Dotted line option
      { value: 'wavy', label: 'Wavy', previewClass: 'wavy-line' }, // Wavy line option
      { value: 'zigzag', label: 'Zigzag', previewClass: 'zigzag-line' } // Zigzag line option
    ],
    polygon: [
      { value: 'circle', label: 'Circle', previewClass: 'circle-shape' }, // Circle shape option
      { value: 'rectangle', label: 'Rectangle', previewClass: 'rectangle-shape' }, // Rectangle shape option
      { value: 'square', label: 'Square', previewClass: 'square-shape' }, // Square shape option
      { value: 'pentagon3D', label: 'Pentagon', previewClass: 'pentagon3d-shape' } // Pentagon shape option
    ],
    shape3D: [
      { value: 'circle', label: 'Circle', previewClass: 'circle-shape' }, // Circle shape option for 3D
      { value: 'rectangle', label: 'Rectangle', previewClass: 'rectangle-shape' }, // Rectangle shape option for 3D
      { value: 'square', label: 'Square', previewClass: 'square-shape' }, // Square shape option for 3D
      { value: 'pentagon3D', label: 'Pentagon 3D', previewClass: 'pentagon3d-shape' } // Pentagon 3D shape option
    ],
    gesture: [
      { value: 'circle', label: 'Circle', previewClass: 'circle-shape' }, // Circle gesture option
      { value: 'rectangle', label: 'Rectangle', previewClass: 'rectangle-shape' }, // Rectangle gesture option
      { value: 'square', label: 'Square', previewClass: 'square-shape' }, // Square gesture option
      { value: 'pentagon3D', label: 'Pentagon 3D', previewClass: 'pentagon3d-shape' } // Pentagon gesture option
    ]
  };

  // Toggles the specified dropdown menu (opens if closed, closes if open)
  toggleMenu(menu: Exclude<MenuKey, null>) {
    this.currentMenu = this.currentMenu === menu ? null : menu;
  }

  // Handles selection of a dropdown item and logs the selection
  selectItem(menu: Exclude<MenuKey, null>, value: string) {
    console.log(`${menu} sélectionné: ${value}`); // Log the selected menu and value
    this.currentMenu = null; // Close the dropdown after selection
  }

  // Handles keyboard events for accessibility (Enter or Space to select)
  onKeyUp(event: KeyboardEvent, menu: Exclude<MenuKey, null>, value: string) {
    // Trigger selection on Enter or Space key
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent default behavior (e.g., scrolling on Space)
      this.selectItem(menu, value); // Call selectItem to handle selection
    }
  }

  // Programmatically triggers the hidden file input for image uploads
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  // Handles file selection from the file input
  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      console.log('Image uploadée:', input.files[0]); // Log the uploaded file
      input.value = ''; // Clear the input after selection
    }
  }

  // Listens for clicks outside the tool buttons to close open dropdowns
  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement) {
    // Close dropdown if click is outside elements with class 'tool-button-wrapper'
    if (!target.closest('.tool-button-wrapper')) {
      this.currentMenu = null;
    }
  }

  // Retrieves dropdown items for a given menu key
  getDropdownItems(menuKey: Exclude<MenuKey, null>): DropdownItem[] {
    return this.dropdownItems[menuKey]; // Return the array of dropdown items
  }

  // TrackBy function for sections to optimize ngFor rendering
  trackByTitle(_: number, section: Section): string {
    return section.title; // Use section title as unique identifier
  }

  // TrackBy function for tools to optimize ngFor rendering
  trackByIcon(_: number, tool: Tool): string {
    return tool.icon; // Use tool icon as unique identifier
  }

  // TrackBy function for dropdown items to optimize ngFor rendering
  trackByValue(_: number, item: DropdownItem): string {
    return item.value; // Use item value as unique identifier
  }
}