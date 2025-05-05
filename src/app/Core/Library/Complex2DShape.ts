// // ====================
// // src/app/models/complex-2d-shape.ts
// // ====================
// import Konva from 'konva';
// import { BaseShape } from './Models/BaseShape';
// import { CustomPropertyHandler } from './Models/CustomPropertyHandler';

// // Configuration for the complex shape
// export interface ComplexShapeConfig extends Konva.GroupConfig {
//     id: string;
//     x: number;
//     y: number;
//     radius: number; // Used for the internal circle
//     fill: string;   // Used for the internal circle
// }

// /**
//  * Represents a complex shape composed of multiple Konva nodes (using Konva.Group).
//  * Implements BaseShape directly (doesn't use the mixin).
//  */
// export class Complex2DShape extends Konva.Group implements BaseShape {
//   public readonly id: string;
//   private customProperties = new CustomPropertyHandler();
//   private circle: Konva.Circle; // Keep reference to internal circle
//   private label: Konva.Text;   // Keep reference to internal label

//   constructor(config: ComplexShapeConfig) {
//     // Pass positional/draggable config to Konva.Group constructor
//     super({ x: config.x, y: config.y, draggable: true, ...config });
//     this.id = config.id;

//     // Create internal components relative to the group's origin (0,0)
//     this.circle = new Konva.Circle({
//       radius: config.radius,
//       fill: config.fill,
//       // name: 'internalCircle' // Optional: for finding later
//     });

//     // Center the label text above the circle
//     const labelYOffset = -config.radius - 15; // Position above circle + padding
//     this.label = new Konva.Text({
//       text: config.id,
//       fontSize: 12,
//       fill: 'black',
//       y: labelYOffset,
//       width: config.radius * 2, // Width for alignment
//       align: 'center',
//       offsetX: config.radius,   // Offset X by half width to center text at group's X=0
//       // name: 'internalLabel' // Optional
//     });

//     this.add(this.circle, this.label); // Add children to the group

//     // Configure appearance for the group itself and add listeners
//     this.configureAppearance();
//     this.on('click', this.toggleScale);
//     this.on('dragend', this.onDragEnd); // Add dragend listener similar to Simple2DShape
//   }

//   private onDragEnd = () => {
//      // console.log(ComplexShape ${this.id} moved to x: ${this.x()}, y: ${this.y()}); // Log removed
//   };

//   private toggleScale = () => {
//     const scale = this.scaleX() === 1 ? 1.2 : 1;
//     this.scale({ x: scale, y: scale });
//     // console.log(Complex2DShape ${this.id} scaled to ${scale}); // Log removed
//   };

//   /**
//    * Configures appearance for the Group node itself (e.g., shadows affect all children).
//    * Called once in the constructor.
//    */
//   protected configureAppearance(): void {
//     // Example: Apply shadow to the entire group
//     this.shadowColor('rgba(0, 0, 0, 0.4)');
//     this.shadowBlur(8);
//     this.shadowOffset({ x: 4, y: 4 });
//     this.shadowEnabled(true); // Ensure group shadow is enabled
//   }

//   // --- BaseShape Implementation ---
//   setPosition(x: number, y: number): void {
//     super.setPosition({ x, y });
//     // console.log(Complex2DShape ${this.id} position set to x: ${x}, y: ${y}); // Log removed
//   }

//   setCustomProperty<K extends string, V>(key: K, value: V): void {
//     this.customProperties.set(key, value);
//   }

//   getCustomProperty<K extends string, V>(key: K): V | undefined {
//     return this.customProperties.get(key);
//   }

//   /**
//    * Destroys the group, its children, and cleans up listeners.
//    */
//   destroy(): void {
//     this.off('click', this.toggleScale);
//     this.off('dragend', this.onDragEnd);
//     this.customProperties.clear();
//     // Konva.Group's destroy automatically destroys children (circle, label)
//     super.destroy();
//   }

//   // Override Konva's draw only if needed for custom per-frame logic.
//   // draw(): this {
//   //     return super.draw();
//   // }
// }

