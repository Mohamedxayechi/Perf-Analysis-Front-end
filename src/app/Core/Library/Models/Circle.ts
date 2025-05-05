// src/app/models/circle.ts
// ====================
import Konva from 'konva';
import { Simple2DShapeMixin } from './shape-mixin';

// Specific configuration interface extending Konva's for type safety
export interface CircleConfig extends Konva.CircleConfig {
  id: string;
  x: number;
  y: number;
  radius: number;
  fill: string;
}

/**
 * Represents a Circle shape, combining Konva.Circle with Simple2DShape features via the mixin.
 */
export class Circle extends Simple2DShapeMixin(Konva.Circle) {
  constructor(config: CircleConfig) {
    // Pass the full config up. The mixin constructor handles calling both
    // Simple2DShape constructor and Konva.Circle.call(this, config).
    super(config);

    // Configure specific appearance after base class and mixin setup are complete.
    // This ensures the correct override is called.
    this.configureAppearance();
  }

  

  /**
   * Example of a Circle-specific method using Konva.Circle's API.
   */
  setRadius(radius: number): void {
    this.radius(radius); // Use Konva.Circle's inherited method
    // console.log(Circle ${this.id} radius set to ${radius}); // Log removed
  }
}


