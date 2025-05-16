// import { Injectable } from '@angular/core';
// import { Simple2DShape } from './Simple2DShape';
// import { Complex2DShape } from './Complex2DShape';
// import { BaseShape } from './Models/BaseShape';
// import Konva from 'konva';
// import { v4 as uuidv4 } from 'uuid';

// /**
//  * Service to manage manipulation of shapes (Simple2DShape and Complex2DShape).
//  * Exposes only setPosition, setCustomProperty, getCustomProperty, and destroy.
//  * Distinguishes shapes by type ("Simple" or "Complexe").
//  */
// @Injectable({
//   providedIn: 'root',
// })
// export class ShapeAdapterClass {
//   private shapes: Map<string, BaseShape> = new Map();
// import { Injectable } from '@angular/core';
// import { Simple2DShape } from './Simple2DShape';
// import { Complex2DShape } from './Complex2DShape';
// import { BaseShape } from './Models/BaseShape';
// import Konva from 'konva';
// import { v4 as uuidv4 } from 'uuid';

// /**
//  * Service to manage manipulation of shapes (Simple2DShape and Complex2DShape).
//  * Exposes only setPosition, setCustomProperty, getCustomProperty, and destroy.
//  * Distinguishes shapes by type ("Simple" or "Complexe").
//  */
// @Injectable({
//   providedIn: 'root',
// })
// export class ShapeAdapterClass {
//   private shapes: Map<string, BaseShape> = new Map();

//   constructor() {}
//   constructor() {}

//   /**
//    * Creates a new shape of the specified type and adds it to the collection.
//    * @param type Type of shape ('simple' or 'complex').
//    * @param x Initial x-coordinate.
//    * @param y Initial y-coordinate.
//    * @returns The unique ID of the created shape.
//    * @throws Error if invalid type.
//    */
//   createShape(type: 'Simple' | 'Complexe', x: number, y: number): string {
//     const id = uuidv4();
//     let shape: BaseShape;

//     if (type === 'Simple') {
//       shape = new Simple2DShape({
//         id,
//         x,
//         y,
//         width: 100,
//         height: 50,
//         fill: 'lightblue',
//       } as Konva.ShapeConfig & { id: string });
//     } else if (type === 'Complexe') {
//       shape = new Complex2DShape({
//         id,
//         x,
//         y,
//         radius: 40,
//         fill: 'lightgreen',
//       });
//     } else {
//       throw new Error(`Invalid shape type: ${type}. Must be 'simple' or 'complex'.`);
//     }

//     if (shape.type !== 'Simple' && shape.type !== 'Complexe') {
//       throw new Error(`Invalid shape type: ${shape.type}. Must be 'Simple' or 'Complexe'.`);
//     }

//     this.shapes.set(id, shape);
//     console.log(`Created shape with ID ${id} and type ${shape.type}`);
//     return id;
//   }

//   /**
//    * Sets the position of a shape by ID.
//    * @param id The shape's ID.
//    * @param pos The new position ({ x, y }).
//    * @throws Error if shape not found.
//    */
//   setPosition(id: string, pos: { x: number; y: number }): void {
//     const shape = this.shapes.get(id);
//     if (!shape) {
//       throw new Error(`Shape with ID ${id} not found`);
//     }
//     console.log(`Setting position for shape ID ${id} (type: ${shape.type})`);
//     shape.setPosition(pos);
//   }

//   /**
//    * Sets a custom property for a shape by ID.
//    * @param id The shape's ID.
//    * @param key The property key.
//    * @param value The property value.
//    * @throws Error if shape not found.
//    */
//   setCustomProperty<K extends string, V>(id: string, key: K, value: V): void {
//     const shape = this.shapes.get(id);
//     if (!shape) {
//       throw new Error(`Shape with ID ${id} not found`);
//     }
//     console.log(`Setting custom property for shape ID ${id} (type: ${shape.type})`);
//     shape.setCustomProperty(key, value);
//   }

//   /**
//    * Gets a custom property for a shape by ID.
//    * @param id The shape's ID.
//    * @param key The property key.
//    * @returns The property value or undefined.
//    * @throws Error if shape not found.
//    */
//   getCustomProperty<K extends string, V>(id: string, key: K): V | undefined {
//     const shape = this.shapes.get(id);
//     if (!shape) {
//       throw new Error(`Shape with ID ${id} not found`);
//     }
//     console.log(`Getting custom property for shape ID ${id} (type: ${shape.type})`);
//     return shape.getCustomProperty(key);
//   }

//   /**
//    * Destroys a shape by ID, removing it from the collection.
//    * @param id The shape's ID.
//    * @throws Error if shape not found.
//    */
//   destroy(id: string): void {
//     const shape = this.shapes.get(id);
//     if (!shape) {
//       throw new Error(`Shape with ID ${id} not found`);
//     }
//     console.log(`Destroying shape ID ${id} (type: ${shape.type})`);
//     shape.destroy();
//     this.shapes.delete(id);
//   }
// }