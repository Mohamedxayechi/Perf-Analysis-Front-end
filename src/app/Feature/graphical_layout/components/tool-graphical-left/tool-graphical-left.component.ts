import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { DropdownItem, MenuKey, Section, Tool } from '../../interfaces/InterfaceToolGraphical';

@Component({
  selector: 'app-tool-graphical-left',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './tool-graphical-left.component.html',
  styleUrls: ['./tool-graphical-left.component.scss']
})
export class ToolGraphicalLeftComponent {
  currentMenu: MenuKey = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  sections: Section[] = [
    {
      title: '2D',
      tools: [
        { type: 'button', icon: 'title' },
        { type: 'image-upload', icon: 'image', action: () => this.triggerFileInput() },
        { type: 'button', icon: 'crop_square' },
        { type: 'dropdown', icon: 'gesture', menuKey: 'gesture' },
        { type: 'dropdown', icon: 'timeline', menuKey: 'line' },
        { type: 'dropdown', icon: 'pentagon', menuKey: 'polygon' },
        { type: 'button', icon: 'straighten' },
        { type: 'button', icon: 'grid_on' }
      ]
    },
    {
      title: '3D',
      tools: [
        { type: 'button', icon: '3d_rotation' },
        { type: 'button', icon: 'edit' },
        { type: 'button', icon: 'circle' },
        { type: 'dropdown', icon: 'change_history', menuKey: 'shape3D' },
        { type: 'button', icon: 'star' }
      ]
    }
  ];

  dropdownItems: Record<Exclude<MenuKey, null>, DropdownItem[]> = {
    line: [
      { value: 'solid', label: 'Solid', previewClass: 'solid-line' },
      { value: 'dashed', label: 'Dashed', previewClass: 'dashed-line' },
      { value: 'dotted', label: 'Dotted', previewClass: 'dotted-line' },
      { value: 'wavy', label: 'Wavy', previewClass: 'wavy-line' },
      { value: 'zigzag', label: 'Zigzag', previewClass: 'zigzag-line' }
    ],
    polygon: [
      { value: 'circle', label: 'Circle', previewClass: 'circle-shape' },
      { value: 'rectangle', label: 'Rectangle', previewClass: 'rectangle-shape' },
      { value: 'square', label: 'Square', previewClass: 'square-shape' },
      { value: 'pentagon3D', label: 'Pentagon', previewClass: 'pentagon3d-shape' }
    ],
    shape3D: [
      { value: 'circle', label: 'Circle', previewClass: 'circle-shape' },
      { value: 'rectangle', label: 'Rectangle', previewClass: 'rectangle-shape' },
      { value: 'square', label: 'Square', previewClass: 'square-shape' },
      { value: 'pentagon3D', label: 'Pentagon 3D', previewClass: 'pentagon3d-shape' }
    ],
    gesture: [
      { value: 'circle', label: 'Circle', previewClass: 'circle-shape' },
      { value: 'rectangle', label: 'Rectangle', previewClass: 'rectangle-shape' },
      { value: 'square', label: 'Square', previewClass: 'square-shape' },
      { value: 'pentagon3D', label: 'Pentagon 3D', previewClass: 'pentagon3d-shape' }
    ]
  };

  constructor() {}

  toggleMenu(menu: Exclude<MenuKey, null>) {
    this.currentMenu = this.currentMenu === menu ? null : menu;
  }

  selectItem(menu: Exclude<MenuKey, null>, value: string) {
    console.log(`${menu} sélectionné: ${value}`);
    this.currentMenu = null;
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      console.log('Image uploadée:', input.files[0]);
      input.value = '';
    }
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement) {
    if (!target.closest('.tool-button-wrapper')) {
      this.currentMenu = null;
    }
  }

  // Helper method to get dropdown items with type safety
  getDropdownItems(menuKey: Exclude<MenuKey, null>): DropdownItem[] {
    return this.dropdownItems[menuKey];
  }
  trackByTitle(_: number, section: Section): string {
    return section.title;
  }
  trackByIcon(_: number, tool: Tool): string {
    return tool.icon;
  }
  trackByValue(_: number, item: DropdownItem): string {
    return item.value;
  }
}