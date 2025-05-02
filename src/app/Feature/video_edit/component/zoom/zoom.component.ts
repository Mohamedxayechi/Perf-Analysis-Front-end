import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-zoom',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './zoom.component.html',
    styles: ``
})

export class ZoomComponent {
  @Input() zoom = 1;
  @Input() minScale = 1;
  @Input() maxScale = 1;
  @Input() stepScale = 0.1;
  @Output() zoomChange = new EventEmitter<number>();
  zoomIn() {
    if (this.zoom < 2) {
      this.zoom = parseFloat((this.zoom + this.stepScale).toFixed(1));
      this.applyZoom();
    }
  }
  
  zoomOut() {
    if (this.zoom > 1) {
      this.zoom = parseFloat((this.zoom - this.stepScale).toFixed(1));
      this.applyZoom();
    }
  }
  
  onZoomChange() {
    this.zoom = Math.max(1, Math.min(2, parseFloat(this.zoom.toFixed(1))));
    this.applyZoom();
  }
  
  applyZoom() {
    this.zoomChange.emit(this.zoom);
  }
}
