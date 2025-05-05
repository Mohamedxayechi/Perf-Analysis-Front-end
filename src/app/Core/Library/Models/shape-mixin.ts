import Konva from 'konva';
import { Simple2DShape } from '../Simple2DShape';
import { BaseShape } from './BaseShape';

type KonvaNodeConstructor<T extends Konva.Shape = Konva.Shape> = new (...args: any[]) => T;

type MixinResult<TBase extends KonvaNodeConstructor> = TBase & {
  new (...args: ConstructorParameters<TBase>): BaseShape & InstanceType<TBase>;
};

/**
 * Mixin function to combine Simple2DShape functionality (ID, custom props, base appearance, etc.)
 * with a specific Konva Node class (like Konva.Circle, Konva.Star).
 *
 * @param Base The specific Konva constructor (e.g., Konva.Circle).
 * @returns A new class that extends the Base Konva class and incorporates Simple2DShape logic.
 */
export function Simple2DShapeMixin<TBase extends KonvaNodeConstructor>(Base: TBase) {
  class Mixed extends Base {
    constructor(config: Konva.ShapeConfig & { id: string }) {
      super(config); // Call the Konva Base class constructor
      // Initialize Simple2DShape properties
      Object.assign(this, new Simple2DShape(config));
    }

    // Override methods as needed to ensure compatibility
    hitFunc(ctx: Konva.Context, shape: this): void {
      super.hitFunc?.(ctx, shape);
    }

    // Optional: Override configureAppearance or other methods from Simple2DShape
  }

  return Mixed as MixinResult<TBase>;
}