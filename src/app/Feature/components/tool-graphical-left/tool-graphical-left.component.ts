import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { ToolPropertiesRightService } from '../../Services/tool-properties-right.service';

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
  showLineStyles = false;
  selectedLineStyle: string = 'solid'; 
  showPolygonShapes = false;
  selectedPolygonShape: string = '';
  showShape3DMenu = false; // Nouvelle variable pour le menu 3D
  selectedShape3D: string = ''; // Nouvelle variable pour stocker la forme 3D sélectionnée
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('lineButton') lineButton!: ElementRef;
  @ViewChild('polygonButton') polygonButton!: ElementRef;
  @ViewChild('shape3DButton') shape3DButton!: ElementRef; // Référence au bouton 3D

  constructor(private toolPropertiesRightService: ToolPropertiesRightService) {}

  private positionDropdown(button: ElementRef, dropdownClass: string) {
    setTimeout(() => {
      const buttonRect = button.nativeElement.getBoundingClientRect();
      const dropdown = document.querySelector(`.${dropdownClass}`) as HTMLElement | null;
      if (dropdown) {
        const dropdownHeight = dropdown.offsetHeight;
        const buttonHeight = buttonRect.height;
        const topPosition = buttonRect.top + (buttonHeight - dropdownHeight) / 2;
        dropdown.style.left = '180px';
        dropdown.style.top = `${topPosition}px`;
      }
    }, 0);
  }

  toggleLineStyles() {
    this.showLineStyles = !this.showLineStyles;
    this.showPolygonShapes = false; 
    this.showShape3DMenu = false; // Ferme le menu 3D
    if (this.showLineStyles) {
      this.positionDropdown(this.lineButton, 'line-styles-dropdown');
    }
    this.onToolButtonClick();
  }

  togglePolygonShapes() {
    this.showPolygonShapes = !this.showPolygonShapes;
    this.showLineStyles = false; 
    this.showShape3DMenu = false; // Ferme le menu 3D
    if (this.showPolygonShapes) {
      this.positionDropdown(this.polygonButton, 'polygon-shapes-dropdown');
    }
    this.onToolButtonClick();
  }

  // Nouvelle méthode pour basculer le menu 3D
  toggleShape3DMenu() {
    this.showShape3DMenu = !this.showShape3DMenu;
    this.showLineStyles = false; 
    this.showPolygonShapes = false; 
    if (this.showShape3DMenu) {
      this.positionDropdown(this.shape3DButton, 'polygon-shapes-dropdown');
    }
    this.onToolButtonClick();
  }

  selectPolygonShape(shape: string) {
    this.selectedPolygonShape = shape;
    console.log(`Forme de polygone sélectionnée : ${shape}`);
    if (shape === 'pentagon3D') {
      console.log('Pentagon 3D sélectionné - Ajoutez ici votre logique pour 3D');
    }
    this.showPolygonShapes = false;
  }

  // Nouvelle méthode pour sélectionner une forme 3D
  selectShape3D(shape: string) {
    this.selectedShape3D = shape;
    console.log(`Forme 3D sélectionnée : ${shape}`);
    if (shape === 'pentagon3D') {
      console.log('Pentagon 3D sélectionné dans la section 3D - Ajoutez ici votre logique pour 3D');
    }
    this.showShape3DMenu = false;
  }

  selectLineStyle(style: string) {
    this.selectedLineStyle = style;
    console.log(`Style de ligne sélectionné : ${style}`);
    this.showLineStyles = false;
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const selectedFile = input.files[0];
      console.log('Image téléchargée :', selectedFile);
      this.fileInput.nativeElement.value = '';
    }
  }

  onToolButtonClick() {
    this.toolPropertiesRightService.togglePropertiesPanel();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.tool-button-wrapper')) {
      this.showLineStyles = false;
      this.showPolygonShapes = false;
      this.showShape3DMenu = false; // Ferme le menu 3D
    }
  }
}