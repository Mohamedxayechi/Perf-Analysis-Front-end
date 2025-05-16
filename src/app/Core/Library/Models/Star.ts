// ====================
// src/app/models/star.ts
// ====================
import Konva from 'konva';
import { Simple2DShapeMixin } from './shape-mixin';

// Specific configuration interface extending Konva's for type safety
export interface StarConfig extends Konva.StarConfig {
  id: string;
  x: number;
  y: number;
  innerRadius: number;
  outerRadius: number;
  numPoints: number;
  fill: string;
}

/**
 * Represents a Star shape, combining Konva.Star with Simple2DShape features via the mixin.
 */
export class Star extends Simple2DShapeMixin(Konva.Star) {
  constructor(config: StarConfig) {
    // Pass the full config up. Mixin handles distributing it.
    super(config);

    // Configure specific appearance after base setup.
    this.configureAppearance();
  }

  /**
   * Overrides the base appearance configuration to add Star-specific styles.
   */
  protected override configureAppearance(): void {
    super.configureAppearance(); // Apply base stroke/width

    // Add Star-specific appearance settings
    this.shadowColor('rgba(255, 215, 0, 0.5)');
    this.shadowBlur(8);
    this.shadowOffsetX(3);
    this.shadowOffsetY(3);

    // Other properties (numPoints, radii, fill) set via config -> Konva.Star logic.
  }

  /**
   * Example of a Star-specific method using Konva.Star's API.
   */
  setPoints(numPoints: number): void {
    this.numPoints(numPoints); // Use Konva.Star's inherited method
    // console.log(Star ${this.id} points set to ${numPoints}); // Log removed
  }
}
