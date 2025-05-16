import Konva from 'konva';
import { Simple2DShapeMixin } from './shape-mixin';

// Define CircleConfig to extend Konva.CircleConfig with required properties
export interface CircleConfig extends Konva.CircleConfig {
  id: string;
  x: number;
  y: number;
  radius: number;
  fill: string;
}

/**
 * Circle class extending a Konva.Circle with Simple2DShape functionality.
 * Provides a circle shape with ID, position, radius, fill, and drag behavior.
 */
export class Circle extends Simple2DShapeMixin(Konva.Circle) {
  constructor(config: CircleConfig) {
    super(config as Konva.ShapeConfig & Konva.CircleConfig & { id: string });
  }

  /**
   * Sets the radius of the circle.
   * @param radius - The new radius value.
   */
  setRadius(radius: number): void {
    this.radius(radius); // Use Konva.Circle's radius setter
  }
}