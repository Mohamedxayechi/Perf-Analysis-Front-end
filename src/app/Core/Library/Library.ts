// import { Injectable } from '@angular/core';
// import { Engine } from '../Engine';
// import { ShapeAdapterClass } from './ShapeAdapter';
// import { BaseShape } from './Models/BaseShape';
// import { eventBus, EventPayload } from '../Utility/event-bus';

// type InputShapeData = {
//   id?: string;
//   shapeName: string;
//   x: number;
//   y: number;
//   props?: Record<string, any>;
// };

// type ShapeData = {
//   id: string;
//   type: 'simple' | 'complex';
//   x: number;
//   y: number;
// } & Partial<BaseShape>;

// @Injectable({
//   providedIn: 'root',
// })
// export class Library {
//   private eventProcessing: boolean = false;

//   constructor(private adapter: ShapeAdapterClass) {}

//   handleEvent(event: EventPayload): void {
//     console.log(`[${new Date().toISOString()}] Library received event: ${event.type}, origin: ${event.origin}, processed: ${event.processed}`);
//     if (this.eventProcessing) {
//       console.warn(`[${new Date().toISOString()}] Library skipped processing event: ${event.type} due to eventProcessing`);
//       return;
//     }

//     this.eventProcessing = true;
//     try {
//       switch (event.type) {
//         case 'shape.add': {
//           const inputData: InputShapeData = event.data;
//           const shapeType = this.getShapeType(inputData.shapeName);
//           console.log(`[${new Date().toISOString()}] Processing shape: ${inputData.shapeName} (${shapeType})`);

//           const shapeId = this.adapter.createShape(shapeType, inputData.x, inputData.y);
//           const shape = this.adapter.get(shapeId);
//           if (inputData.props) {
//             this.adapter.update(shapeId, inputData.props);
//           }

//           const shapeData: ShapeData = {
//             id: shapeId,
//             type: shapeType,
//             x: inputData.x,
//             y: inputData.y,
//             ...inputData.props,
//           };

//           Engine.getInstance().emit({
//             type: 'shape.added',
//             data: shapeData,
//             origin: 'domain',
//             processed: false,
//           });
//           break;
//         }

//         case 'shape.delete': {
//           const id: string = event.data.id;
//           const success = this.adapter.delete(id);
//           if (success) {
//             Engine.getInstance().emit({
//               type: 'shape.deleted',
//               data: { id },
//               origin: 'domain',
//               processed: false,
//             });
//           } else {
//             console.error(`Failed to delete shape with ID ${id}`);
//           }
//           break;
//         }

//         case 'shape.update': {
//           const { id, properties }: { id: string; properties: Partial<BaseShape> } = event.data;
//           const success = this.adapter.update(id, properties);
//           if (success) {
//             Engine.getInstance().emit({
//               type: 'shape.updated',
//               data: { id, properties },
//               origin: 'domain',
//               processed: false,
//             });
//           } else {
//             console.error(`Failed to update shape with ID ${id}`);
//           }
//           break;
//         }

//         case 'shape.selected': {
//           const { shapeName } = event.data;
//           const type = this.getShapeType(shapeName);
//           console.log(`[${new Date().toISOString()}] Library processing shape.selected: ${shapeName}, type: ${type}`);

//           Engine.getInstance().emit({
//             type: 'shape.type.determined',
//             data: { shapeName, type },
//             origin: 'domain',
//             processed: false,
//           });
//           break;
//         }

//         case 'shapes.add': {
//           const shapes: InputShapeData[] = event.data.shapes;
//           const addedShapes: ShapeData[] = [];

//           for (const inputData of shapes) {
//             const shapeType = this.getShapeType(inputData.shapeName);
//             const shapeId = this.adapter.createShape(shapeType, inputData.x, inputData.y);
//             if (inputData.props) {
//               this.adapter.update(shapeId, inputData.props);
//             }

//             const shapeData: ShapeData = {
//               id: shapeId,
//               type: shapeType,
//               x: inputData.x,
//               y: inputData.y,
//               ...inputData.props,
//             };
//             addedShapes.push(shapeData);
//           }

//           Engine.getInstance().emit({
//             type: 'shapes.added',
//             data: { shapes: addedShapes },
//             origin: 'domain',
//             processed: false,
//           });
//           break;
//         }

//         default:
//           console.warn(`[${new Date().toISOString()}] Unhandled event type in Library: ${event.type}`);
//       }
//     } catch (error) {
//       const message = error instanceof Error ? error.message : String(error);
//       console.error(`Error in event processing: ${message}`);
//     } finally {
//       this.eventProcessing = false;
//     }
//   }

//   get(id: string): BaseShape | undefined {
//     try {
//       return this.adapter.get(id);
//     } catch (error) {
//       const message = error instanceof Error ? error.message : String(error);
//       console.error(`Error retrieving shape with ID ${id}: ${message}`);
//       return undefined;
//     }
//   }

//   getAllShapes(): BaseShape[] {
//     return this.adapter.getAll();
//   }

//   addShapes(shapes: InputShapeData[]): void {
//     Engine.getInstance().emit({
//       type: 'shapes.add',
//       data: { shapes },
//       origin: 'domain',
//       processed: false,
//     });
//   }

//   private getShapeType(shapeName: string): 'simple' | 'complex' {
//     const simpleShapes = ['rectangle', 'square', 'circle'];
//     const complexShapes = ['star', 'polygon', 'triangle'];

//     const normalizedName = shapeName.toLowerCase();
//     if (simpleShapes.includes(normalizedName)) {
//       return 'simple';
//     } else if (complexShapes.includes(normalizedName)) {
//       return 'complex';
//     } else {
//       console.warn(`Unknown shape: ${shapeName}, defaulting to simple`);
//       return 'simple';
//     }
//   }
// }