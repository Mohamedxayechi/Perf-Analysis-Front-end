import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-top-screen-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-screen-menu.component.html',
  styleUrl: './top-screen-menu.component.scss'
})
export class TopScreenMenuComponent {
  constructor(private router: Router) {}
  menuItems = [
    {
      name: 'File',
      options: ['New File', 'Open File', 'Save File'],
      isOpen: false
    },
    {
      name: 'Tools',
      options: ['Tool Option 1', 'Tool Option 2', 'Tool Option 3'],
      isOpen: false
    },
    {
      name: 'View',
      options: ['Zoom In', 'Zoom Out', 'Reset View'],
      isOpen: false
    },
    {
      name: 'Settings',
      options: ['Preferences', 'Customize', 'Reset Settings'],
      isOpen: false
    },
    {
      name: 'Help',
      options: ['Documentation', 'Support', 'About'],
      isOpen: false
    }
  ];

  // Toggle dropdown visibility
  toggleDropdown(item: any) {
    this.menuItems.forEach(menu => {
      if (menu !== item) {
        menu.isOpen = false;
      }
    });
    item.isOpen = !item.isOpen;
  }

  // Handle option selection
  selectOption(option: string) {
    console.log(`Selected: ${option}`);
    if (option === 'New File') {
      this.router.navigate(['/']);
    }
    this.closeAllDropdowns();
  }

  // Close all dropdowns
  closeAllDropdowns() {
    this.menuItems.forEach(item => item.isOpen = false);
  }
}