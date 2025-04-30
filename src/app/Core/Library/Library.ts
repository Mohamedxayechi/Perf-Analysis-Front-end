import { Injectable } from '@angular/core';
import { Engine } from '../Engine';
import { Simple2DShape } from './Simple2DShape';
import { Complex2DShape } from './Complex2DShape';
import { ShapeAdapterClass } from './ShapeAdapter';
import { eventBus, EventPayload } from '../Utility/event-bus';

type InputShapeData = {
  id: string;
  shapeName: string;
  props: Record<string, any>;
};

type ShapeData =
  | ({ id: string; type: 'simple' } & Partial<Simple2DShape>)
  | ({ id: string; type: 'complex' } & Partial<Complex2DShape>);

@Injectable({
  providedIn: 'root',
})
export class Library {
  private shapes: Map<string, Simple2DShape | Complex2DShape> = new Map();
  private adapter: ShapeAdapterClass;
  private eventProcessing: boolean = false;

  constructor(adapter: ShapeAdapterClass) {
    this.adapter = adapter;
  }

  handleEvent(event: EventPayload): void {
    console.log(`[${new Date().toISOString()}] Library received event: ${event.type}, origin: ${event.origin}, processed: ${event.processed}`);
    if (this.eventProcessing) {
      console.warn(`[${new Date().toISOString()}] Library skipped processing event: ${event.type} due to eventProcessing`);
      return;
    }

    this.eventProcessing = true;
    try {
      switch (event.type) {
        case 'shape.add': {
          const inputData: InputShapeData = event.data;
          const shapeType = this.getShapeType(inputData.shapeName);
          console.log(`[${new Date().toISOString()}] Processing shape: ${inputData.shapeName} (${shapeType})`);

          const shapeData: ShapeData = {
            id: inputData.id,
            type: shapeType,
            ...inputData.props,
          };

          this.adapter.setAdapter(shapeType);
          this.adapter.create(shapeData as Simple2DShape | Complex2DShape).then(success => {
            if (success) {
              this.shapes.set(shapeData.id, shapeData as Simple2DShape | Complex2DShape);
              Engine.getInstance().emit({ type: 'shape.added', data: shapeData, origin: 'domain', processed: false });
            } else {
              console.error(`Failed to add shape with ID ${shapeData.id}`);
            }
          }).catch(error => {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Error adding shape with ID ${shapeData.id}: ${message}`);
          });
          break;
        }

        case 'shape.delete': {
          const id: string = event.data.id;
          this.adapter.delete(id).then(success => {
            if (success) {
              this.shapes.delete(id);
              Engine.getInstance().emit({ type: 'shape.deleted', data: { id }, origin: 'domain', processed: false });
            } else {
              console.error(`Failed to delete shape with ID ${id}`);
            }
          }).catch(error => {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Error deleting shape with ID ${id}: ${message}`);
          });
          break;
        }

        case 'shape.update': {
          const { id, properties }: { id: string; properties: ShapeData } = event.data;
          if (properties.type) {
            this.adapter.setAdapter(properties.type);
          }
          this.adapter.update(id, properties).then(success => {
            if (success) {
              const existingShape = this.shapes.get(id);
              if (existingShape) {
                Object.assign(existingShape, properties);
                this.shapes.set(id, existingShape);
                Engine.getInstance().emit({ type: 'shape.updated', data: { id, properties }, origin: 'domain', processed: false });
              } else {
                console.error(`Shape with ID ${id} not found for update`);
              }
            } else {
              console.error(`Failed to update shape with ID ${id}`);
            }
          }).catch(error => {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Error updating shape with ID ${id}: ${message}`);
          });
          break;
        }

        case 'shape.selected': {
          const { shapeName } = event.data;
          const type = this.getShapeType(shapeName);
          console.log(`[${new Date().toISOString()}] Library processing shape.selected: ${shapeName}, type: ${type}`);

          try {
            console.log(`[${new Date().toISOString()}] Library emitting shape.type.determined for ${shapeName}, origin: domain`);
            Engine.getInstance().emit({
              type: 'shape.type.determined',
              data: { shapeName, type },
              origin: 'domain',
              processed: false, // New event, not processed
            });
          } finally {
            this.eventProcessing = false;
          }
          break;
        }

        default:
          console.warn(`[${new Date().toISOString()}] Unhandled event type in Library: ${event.type}`);
      }
    } catch (error) {
      console.error('Error in event processing:', error);
    } finally {
      this.eventProcessing = false;
    }
  }

  async get(id: string): Promise<Simple2DShape | Complex2DShape | undefined> {
    try {
      const shape = await this.adapter.get(id);
      return shape;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error retrieving shape with ID ${id}: ${message}`);
      return undefined;
    }
  }

  getAllShapes(): Array<Simple2DShape | Complex2DShape> {
    return Array.from(this.shapes.values());
  }

  private getShapeType(shapeName: string): 'simple' | 'complex' {
    const simpleShapes = ['rectangle', 'square', 'circle'];
    const complexShapes = ['star', 'polygon', 'triangle'];

    if (simpleShapes.includes(shapeName.toLowerCase())) {
      return 'simple';
    } else if (complexShapes.includes(shapeName.toLowerCase())) {
      return 'complex';
    } else {
      console.warn(`Unknown shape: ${shapeName}, defaulting to simple`);
      return 'simple';
    }
  }
}