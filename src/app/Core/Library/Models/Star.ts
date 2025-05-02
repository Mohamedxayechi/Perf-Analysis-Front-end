import Konva from 'konva';
import { Simple2DShape } from '../Simple2DShape';

export interface StarProperties {
  x?: number;
  y?: number;
  numPoints?: number;
  innerRadius?: number;
  outerRadius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  opacity?: number;
}

export class StarShape extends Simple2DShape {
  private star: Konva.Star;
  

  constructor(config: Konva.StarConfig = { numPoints: 5, innerRadius: 20, outerRadius: 50 }) {
    super();
    // Validate critical properties
    if (config.numPoints && config.numPoints < 3) {
      throw new Error('Star must have at least 3 points');
    }
    if (config.innerRadius && config.outerRadius && config.innerRadius > config.outerRadius) {
      throw new Error('Inner radius must be less than outer radius');
    }

    this.star = new Konva.Star({
      x: config.x || 0,
      y: config.y || 0,
    //   numPoints: config.numPoints || 5,
    //   innerRadius: config.innerRadius || 20,
    //   outerRadius: config.outerRadius || 50,
      fill: config.fill || 'yellow',
      stroke: config.stroke || 'black',
      strokeWidth: config.strokeWidth || 2,
      rotation: config.rotation || 0,
      opacity: config.opacity || 1,
      ...config,
    });
  }

  override createShape(x: number, y: number): void {
    this.star.position({ x, y });
  }

  override updateShape(x: number, y: number): void {
    this.star.position({ x, y });
  }

  override updateFromProperties(properties: StarProperties): void {
    // Validate properties before applying
    if (properties.numPoints && properties.numPoints < 3) {
      throw new Error('Star must have at least 3 points');
    }
    if (
      properties.innerRadius &&
      properties.outerRadius &&
      properties.innerRadius > properties.outerRadius
    ) {
      throw new Error('Inner radius must be less than outer radius');
    }
    this.star.setAttrs(properties);
  }

  override getProperties(): StarProperties {
    return {
      x: this.star.x(),
      y: this.star.y(),
      numPoints: this.star.numPoints(),
      innerRadius: this.star.innerRadius(),
      outerRadius: this.star.outerRadius(),
      fill: this.star.fill(),
      stroke: this.star.stroke(),
      strokeWidth: this.star.strokeWidth(),
      rotation: this.star.rotation(),
      opacity: this.star.opacity(),
    };
  }

  override getShape(): Konva.Node {
    return this.star;
  }

 

  override delete(): void {
    this.star.destroy();
    super.delete();
  }

  override isSelected(): boolean {
    return false; // Placeholder
  }

  getKonvaStar(): Konva.Star {
    return this.star;
  }
}