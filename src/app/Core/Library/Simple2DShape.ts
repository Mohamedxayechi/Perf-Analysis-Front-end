// src/app/models/Simple2DShape.ts

import Konva from 'konva';
import { BaseShape } from './Models/BaseShape';
import { CustomPropertyHandler } from './Models/CustomPropertyHandler';

/**
 * Base abstract class for shapes derived directly from Konva.Shape.
 * Provides common ID, custom props handling, position setting, base appearance,
 * and default drag behavior.
 */
export abstract class Simple2DShape extends Konva.Shape implements BaseShape {
  public  readonly id: string;
  private customProperties = new CustomPropertyHandler();

  constructor(config: Konva.ShapeConfig & { id: string }) {
    super({ ...config, draggable: true });
    this.id = config.id;

    this.configureAppearance();
    this.on('dragend', this.onDragEnd);
  }

  private onDragEnd = () => {
    // Implement logic or remove if not needed
     console.log(`Shape ${this.id} moved to x: ${this.x()}, y: ${this.y()}`);
  };

  protected configureAppearance(): void {
    this.stroke('black');
    this.strokeWidth(1);
  }

   setPosition(pos: { x: number; y: number }): this {
    super.setPosition(pos);
    return this;
  }

  setCustomProperty<K extends string, V>(key: K, value: V): void {
    this.customProperties.set(key, value);
  }

  getCustomProperty<K extends string, V>(key: K): V | undefined {
    return this.customProperties.get(key);
  }

  override destroy(): this {
    this.off('dragend', this.onDragEnd);
    this.customProperties.clear();
    return super.destroy();
  }
}