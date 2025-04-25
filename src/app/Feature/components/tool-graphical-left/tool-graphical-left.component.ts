// tool-graphical-left.component.ts
import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { ToolPropertiesRightService } from '../../Services/tool-properties-right.service';

type MenuKey = 'line' | 'polygon' | 'shape3D' | null;

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

  @ViewChild('lineButton',    { read: ElementRef }) lineButton!: ElementRef;
  @ViewChild('polygonButton', { read: ElementRef }) polygonButton!: ElementRef;
  @ViewChild('shape3DButton', { read: ElementRef }) shape3DButton!: ElementRef;

  constructor(private toolPropertiesRightService: ToolPropertiesRightService) {}

  private positionDropdown(button: ElementRef, dropdownClass: string) {
    setTimeout(() => {
      const btnRect = button.nativeElement.getBoundingClientRect();
      const dropdown = document.querySelector(`.${dropdownClass}`) as HTMLElement | null;
      if (dropdown) {
        const ddHeight = dropdown.offsetHeight;
        const topPos  = btnRect.top + (btnRect.height - ddHeight) / 2;
        // dropdown.style.left = '140px';
        dropdown.style.top  = `${topPos}px`;
      }
    }, 0);
  }

  toggleMenu(menu: Exclude<MenuKey, null>) {
    this.currentMenu = (this.currentMenu === menu) ? null : menu;
    if (this.currentMenu) {
      const mapping: Record<Exclude<MenuKey, null>, { button: ElementRef, cls: string }> = {
        line:    { button: this.lineButton,    cls: 'line-styles-dropdown'    },
        polygon: { button: this.polygonButton, cls: 'polygon-shapes-dropdown' },
        shape3D: { button: this.shape3DButton, cls: 'polygon-shapes-dropdown' } // même dropdown
      };
      const { button, cls } = mapping[this.currentMenu];
      this.positionDropdown(button, cls);
    }
    
  }

  selectLineStyle(style: string) {
    console.log(`Style de ligne : ${style}`);
    this.currentMenu = null;
  }

  selectPolygonShape(shape: string) {
    console.log(`Forme 2D : ${shape}`);
    this.currentMenu = null;
  }

  selectShape3D(shape: string) {
    console.log(`Forme 3D : ${shape}`);
    this.currentMenu = null;
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
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
}
