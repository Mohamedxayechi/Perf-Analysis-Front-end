import Konva from 'konva';
import { BaseShape } from './Models/BaseShape';
import { Canvas } from 'konva/types/Canvas';
import { Node } from 'konva/types/Node';

export class Simple2DShape extends Konva.Node implements BaseShape {
  public type: string = 'Simple';

  constructor() {
    super();
    const id = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setId(id);
  }

  createShape(x: number, y: number): void {
    this.position({ x, y });
  }

  updateShape(x: number, y: number): void {
    this.position({ x, y });
  }

  updateFromProperties(properties: any): void {
    this.setAttrs(properties);
  }

  getProperties(): any {
    return this.getAttrs();
  }

  getShape(): Konva.Node {
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
    this.destroy();
  }

  isSelected(): boolean {
    return false;
  }

  drawScene(canvas?: Canvas, top?: Node): void {
    throw new Error('Method not implemented.');
  }

  drawHit(canvas?: Canvas, top?: Node): void {
    throw new Error('Method not implemented.');
  }
}