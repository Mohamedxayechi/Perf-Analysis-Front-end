import { Injectable } from '@angular/core';
import { Simple2DShape } from './Simple2DShape'
import { Complex2DShape } from './Complex2DShape';
@Injectable({
  providedIn: 'root',
})
export class ShapeAdapterClass {
  private adapter: Simple2DShape | Complex2DShape;

  constructor() {
    // Default to simple shapes
    this.adapter = new Simple2DShape();
  }

  setAdapter(type: 'simple' | 'complex'): void {
    this.adapter = type === 'simple' ? new Simple2DShape() : new Complex2DShape();
  }

  async create(shape: Simple2DShape | Complex2DShape): Promise<boolean> {
    if (this.adapter instanceof Simple2DShape && shape.type === 'simple') {
      return this.adapter.create(shape);
    } else if (this.adapter instanceof Complex2DShape && shape.type === 'complex') {
      return this.adapter.create(shape);
    }
    throw new Error('Invalid shape type for current adapter');
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(id);
  }

  async isSelected(id: string): Promise<boolean> {
    return this.adapter.isSelected(id);
  }

  async update(id: string, properties: Partial<Simple2DShape> | Partial<Complex2DShape>): Promise<boolean> {
    if (this.adapter instanceof Simple2DShape && (!properties.type || properties.type === 'simple')) {
      return this.adapter.update(id, properties as Partial<Simple2DShape>);
    } else if (this.adapter instanceof Complex2DShape && (!properties.type || properties.type === 'complex')) {
      return this.adapter.update(id, properties as Partial<Complex2DShape>);
    }
    throw new Error('Invalid properties type for current adapter');
  }

  async get(id: string): Promise<Simple2DShape | Complex2DShape> {
    return this.adapter.get(id);
  }
}