import Konva from 'konva';
import { BaseShape } from './Models/BaseShape';
import { Canvas } from 'konva/types/Canvas';
import { Node } from 'konva/types/Node';

export class Simple2DShape extends Konva.Node implements BaseShape {
  

  public type: string = 'Simple';

  constructor() {
    super();
    this.setId(`shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }

  createShape(x: number, y: number): void {
    // Default: Set position on the node itself
    this.position({ x, y });
  }

  updateShape(x: number, y: number): void {
    // Default: Update position
    this.position({ x, y });
  }

  updateFromProperties(properties: any): void {
    // Default: Apply properties to the node
    this.setAttrs(properties);
  }

  getProperties(): any {
    // Default: Return node attributes
    return this.getAttrs();
  }

  getShape(): Konva.Node {
    // Default: Return the node itself
    return this;
  }

  

  getId(): string {
    return this.id();
  }

  override setId(id: string): this {
    super.setId(id);
    return this;
  }

  delete(): void {
    this.destroy(); // Remove from Konva parent
  }

  isSelected(): boolean {
    return false; // Default: Not selected
  }

  override drawScene(canvas?: Canvas, top?: Node): void {
    throw new Error('Method not implemented.');
  }
  override drawHit(canvas?: Canvas, top?: Node): void {
    throw new Error('Method not implemented.');
  }
}