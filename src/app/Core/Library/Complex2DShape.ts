import Konva from 'konva';
import { BaseShape } from './Models/BaseShape';
import { CustomPropertyHandler } from './Models/CustomPropertyHandler';

// Configuration for the complex shape
export interface ComplexShapeConfig extends Konva.ContainerConfig {
  id: string;
  x: number;
  y: number;
  radius: number; // Used for the internal circle
  fill: string; // Used for the internal circle
}

/**
 * Represents a complex shape composed of multiple Konva nodes (using Konva.Group).
 * Implements BaseShape directly (doesn't use the mixin).
 */
export class Complex2DShape extends Konva.Group implements BaseShape {
    type="Complexe";
  private customProperties = new CustomPropertyHandler();
  private circle: Konva.Circle; // Keep reference to internal circle
  private label: Konva.Text; // Keep reference to internal label

  constructor(config: ComplexShapeConfig) {
    // Pass config to Konva.Group constructor, avoiding duplicate x/y
    super({ draggable: true, ...config });
    this.id(config.id); // Use Konva.Group's id setter

    // Create internal circle with shadow properties
    this.circle = new Konva.Circle({
      radius: config.radius,
      fill: config.fill,
      shadowColor: 'rgba(0, 0, 0, 0.4)', // Apply shadow to circle
      shadowBlur: 8,
      shadowOffset: { x: 4, y: 4 },
      shadowEnabled: true,
    });

    // Center the label text above the circle
    const labelYOffset = -config.radius - 15; // Position above circle + padding
    this.label = new Konva.Text({
      text: config.id,
      fontSize: 12,
      fill: 'black',
      y: labelYOffset,
      width: config.radius * 2, // Width for alignment
      align: 'center',
      offsetX: config.radius, // Offset X by half width to center text at group's X=0
    });

    this.add(this.circle, this.label); // Add children to the group

    // Configure additional appearance settings if needed
    this.configureAppearance();
    this.on('click', this.toggleScale);
    this.on('dragend', this.onDragEnd);
  }

  private onDragEnd = () => {
    // Log position after drag, consistent with Simple2DShape
    console.log(`Shape ${this.id()} moved to x: ${this.x()}, y: ${this.y()}`);
  };

  private toggleScale = () => {
    const scale = this.scaleX() === 1 ? 1.2 : 1;
    this.scale({ x: scale, y: scale });
  };

  /**
   * Configures additional appearance for the group or its children.
   * Called once in the constructor.
   */
  protected configureAppearance(): void {
    // Example: Add styling to label or other group-level properties
    // this.label.fontStyle('bold'); // Uncomment to style label
  }

  // --- BaseShape Implementation ---
  override setPosition(pos: { x: number; y: number }): this {
    super.setPosition(pos);
    return this;
  }

  setCustomProperty<K extends string, V>(key: K, value: V): void {
    this.customProperties.set(key, value);
  }

  getCustomProperty<K extends string, V>(key: K): V | undefined {
    return this.customProperties.get(key);
  }

  /**
   * Destroys the group, its children, and cleans up listeners.
   */
  override destroy(): this {
    this.off('click', this.toggleScale);
    this.off('dragend', this.onDragEnd);
    this.customProperties.clear();
    // Konva.Group's destroy automatically destroys children (circle, label)
    return super.destroy();
  }
}