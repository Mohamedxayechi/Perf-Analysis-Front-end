import { Injectable } from '@angular/core';
import { Simple2DShape } from './Simple2DShape';
import { Complex2DShape } from './Complex2DShape';
import { BaseShape } from './Models/BaseShape';

@Injectable({
  providedIn: 'root',
})
export class ShapeAdapterClass {
  private shapes: Map<string, BaseShape> = new Map();

  constructor() {}

  setAdapter(type: 'simple' | 'complex', x: number, y: number): string {
    const shape: BaseShape = type === 'simple' ? new Simple2DShape() : new Complex2DShape();
    const id = shape.getId();
    shape.createShape(x, y);
    this.shapes.set(id, shape);
    return id;
  }

  createShape(type: 'simple' | 'complex', x: number, y: number): string {
    return this.setAdapter(type, x, y);
  }

  update(id: string, properties: Partial<Record<keyof BaseShape, any>>): boolean {
    const shape = this.shapes.get(id);
    if (!shape) {
      throw new Error(`Shape with ID ${id} not found`);
    }
    shape.updateFromProperties(properties);
    return true;
  }

  delete(id: string): boolean {
    const shape = this.shapes.get(id);
    if (!shape) {
      throw new Error(`Shape with ID ${id} not found`);
    }
    shape.delete();
    this.shapes.delete(id);
    return true;
  }

  isSelected(id: string): boolean {
    const shape = this.shapes.get(id);
    if (!shape) {
      throw new Error(`Shape with ID ${id} not found`);
    }
    return shape.isSelected();
  }

  get(id: string): BaseShape {
    const shape = this.shapes.get(id);
    if (!shape) {
      throw new Error(`Shape with ID ${id} not found`);
    }
    return shape;
  }

  getAll(): BaseShape[] {
    return Array.from(this.shapes.values());
  }
}