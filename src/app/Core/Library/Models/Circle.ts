import Konva from 'konva';
import { Simple2DShape } from '../Simple2DShape';
import { Canvas } from 'konva/types/Canvas';
import { Node } from 'konva/types/Node';

export interface CircleProperties {
  x?: number;
  y?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export class CircleShape extends Simple2DShape {
  
  private circle: Konva.Circle;


  constructor(config: Konva.CircleConfig = { radius: 50 }) {
    super();
    this.circle = new Konva.Circle({
      x: config.x || 0,
      y: config.y || 0,
      fill: config.fill || 'blue',
      stroke: config.stroke || 'black',
      strokeWidth: config.strokeWidth || 2,
      ...config,
    });
  }

  override createShape(x: number, y: number): void {
    this.circle.position({ x, y });
  }

  override updateShape(x: number, y: number): void {
    this.circle.position({ x, y });
  }

  override updateFromProperties(properties: CircleProperties): void {
    this.circle.setAttrs(properties);
  }

  override getProperties(): CircleProperties {
    return {
      x: this.circle.x(),
      y: this.circle.y(),
      radius: this.circle.radius(),
      fill: this.circle.fill(),
      stroke: this.circle.stroke(),
      strokeWidth: this.circle.strokeWidth(),
    };
  }

  override getShape(): Konva.Node {
    return this.circle;
  }


  override drawScene(canvas?: Canvas, top?: Node): void {
    throw new Error('Method not implemented.');
}
override drawHit(canvas?: Canvas, top?: Node): void {
    throw new Error('Method not implemented.');
}


  override delete(): void {
    this.circle.destroy();
    super.delete();
  }

  override isSelected(): boolean {
    return false; // Placeholder
  }

  getKonvaCircle(): Konva.Circle {
    return this.circle;
  }
}