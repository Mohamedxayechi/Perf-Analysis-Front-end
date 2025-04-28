import { Engine } from './Engine';
import { Simple2DShape } from './Simple2DShape';
import { Complex2DShape } from './Complex2DShape';
import { ShapeAdapterClass } from './ShapeAdapter';
import { eventBus, EventPayload } from './event-bus';

// Define ShapeData to ensure id and type are required for create/update
type ShapeData =
  | ({ id: string; type: 'simple' } & Partial<Simple2DShape>)
  | ({ id: string; type: 'complex' } & Partial<Complex2DShape>);

export class Library {
  private shapes: Map<string, Simple2DShape | Complex2DShape> = new Map();
  private adapter: ShapeAdapterClass;

  constructor(adapter: ShapeAdapterClass) {
    this.adapter = adapter;
  }

  handleEvent(event: EventPayload): void {
    switch (event.type) {
      case 'shape.add': {
        const shapeData: ShapeData = event.data;
        this.adapter.setAdapter(shapeData.type);
        this.adapter.create(shapeData as Simple2DShape | Complex2DShape).then(success => {
          if (success) {
            this.shapes.set(shapeData.id, shapeData as Simple2DShape | Complex2DShape);
            Engine.getInstance().emit({ type: 'shape.added', data: shapeData });
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
            Engine.getInstance().emit({ type: 'shape.deleted', data: { id } });
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
              Engine.getInstance().emit({ type: 'shape.updated', data: { id, properties } });
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

      case 'shape.isSelected': {
        const id: string = event.data.id;
        this.adapter.isSelected(id).then(isSelected => {
          Engine.getInstance().emit({ type: 'shape.selection', data: { id, isSelected } });
        }).catch(error => {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Error checking selection for shape with ID ${id}: ${message}`);
        });
        break;
      }

      default:
        console.warn(`Unhandled event type in Library: ${event.type}`);
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
}