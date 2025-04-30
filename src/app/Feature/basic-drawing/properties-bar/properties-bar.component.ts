import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Konva from 'konva';
import { ShapeDrawingService } from '../services/shape-drawing.service';


@Component({
  selector: 'app-properties-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './properties-bar.component.html',
  styleUrls: ['./properties-bar.component.scss']
})
export class PropertiesBarComponent {
  @Input() shapeUpdated!: Konva.Shape | Konva.Group | Konva.Text;

  constructor(
    private shapeDrawingService: ShapeDrawingService
  ) {}
  get x(): number {
    return this.shapeUpdated.x();
  }


  set x(val: number) {
    this.shapeUpdated.x(val);
    this.shapeUpdated.getLayer()?.draw();
  }

 
  get y(): number {
    return this.shapeUpdated.y();
  }
  set y(val: number) {
    this.shapeUpdated.y(val);
    this.shapeUpdated.getLayer()?.draw();
  }

  get width(): number {
    if (this.shapeUpdated instanceof Konva.Shape) {
      if (typeof this.shapeUpdated.getSelfRect === 'function') {
        const rect = this.shapeUpdated.getSelfRect();
        return rect.width * this.shapeUpdated.scaleX();
      }
      
      return this.shapeUpdated.width() * this.shapeUpdated.scaleX();}  else {

      const rect = this.getGroupLogicalBoundingBox(this.shapeUpdated);
      return rect.width;
    }
  }
  set width(val: number) {
    if (this.shapeUpdated instanceof Konva.Shape) {
      this.shapeUpdated.scaleX(val / this.shapeUpdated.width());
    } else {
      
      const rect = this.getGroupLogicalBoundingBox(this.shapeUpdated);
    const currentWidth = rect.width;
    if (currentWidth !== 0) {
      const scaleFactor = val / currentWidth;
      this.shapeUpdated.scaleX(this.shapeUpdated.scaleX() * scaleFactor);
    }

    }
    this.shapeUpdated.getLayer()?.draw();
  }

  
  get height(): number {
    if (this.shapeUpdated instanceof Konva.Shape) {
      if (typeof this.shapeUpdated.getSelfRect === 'function') {
        const rect = this.shapeUpdated.getSelfRect();
        return rect.height * this.shapeUpdated.scaleY();
      }
      
      return this.shapeUpdated.height() * this.shapeUpdated.scaleY();} 
      else {
      
      const rect = this.getGroupLogicalBoundingBox(this.shapeUpdated);
    return rect.height;
    }
  }
  set height(val: number) {
    if (this.shapeUpdated instanceof Konva.Shape) {
      
      this.shapeUpdated.scaleY(val / this.shapeUpdated.height());
    } else {
      
      const rect = this.getGroupLogicalBoundingBox(this.shapeUpdated);
    const currentHeight = rect.height;
    if (currentHeight !== 0) {
      const scaleFactor = val / currentHeight;
      this.shapeUpdated.scaleY(this.shapeUpdated.scaleY() * scaleFactor);
    }
    }
    this.shapeUpdated.getLayer()?.draw();
   
  }

  get text(): string {
    if (this.shapeUpdated instanceof Konva.Text) {
      return this.shapeUpdated.text();
    }
    return '';
  }

  
  set text(value: string) {
    if (this.shapeUpdated instanceof Konva.Text) {
      this.shapeUpdated.text(value);
      
      this.shapeUpdated.getLayer()?.batchDraw();
    }
  }

  
  get rotation(): number {
    return this.shapeUpdated.rotation();
  }
  set rotation(val: number) {
    this.shapeUpdated.rotation(val);
    this.shapeUpdated.getLayer()?.draw();
  }

  get isText(): boolean {
    return this.shapeUpdated instanceof Konva.Text;
  }

 


 
  updateColor(color: string) {
    if (this.shapeUpdated) {
      
    }
  } 
 
  

  private getGroupLogicalBoundingBox(group: Konva.Group): { x: number; y: number; width: number; height: number } {
    
    const originalRotation = group.rotation();
    const originalScaleX = group.scaleX();
    const originalScaleY = group.scaleY();

    group.rotation(0);

    const rect = group.getClientRect({
      skipTransform: false, 
      relativeTo: group.getLayer() || undefined,
    });
  
    group.rotation(originalRotation);
  
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width * originalScaleX,
      height: rect.height * originalScaleY,
    };
  }
}
