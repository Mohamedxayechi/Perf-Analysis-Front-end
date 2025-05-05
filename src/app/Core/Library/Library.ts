import { Injectable } from '@angular/core';
import { Engine } from '../Engine';
import { ShapeAdapterClass } from './ShapeAdapter';
import { BaseShape } from './Models/BaseShape';
import { eventBus, EventPayload } from '../Utility/event-bus';

type InputShapeData = {
  id?: string;
  shapeName: string;
  x: number;
  y: number;
  props?: Record<string, any>;
};

type ShapeData = {
  id: string;
  type: 'simple' | 'complex';
  x: number;
  y: number;
} & Partial<BaseShape>;

@Injectable({
  providedIn: 'root',
})
export class Library {
  private eventProcessing: boolean = false;

  constructor(private adapter: ShapeAdapterClass) {}

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

          const shapeId = this.adapter.createShape(shapeType, inputData.x, inputData.y);
          if (inputData.props) {
            this.updateShapeProperties(shapeId, inputData.props);
          }

          const shapeData: ShapeData = {
            id: shapeId,
            type: shapeType,
            x: inputData.x,
            y: inputData.y,
            ...inputData.props,
          };

          Engine.getInstance().emit({
            type: 'shape.added',
            data: shapeData,
            origin: 'domain',
            processed: false,
          });
          break;
        }

        case 'shape.delete': {
          const id: string = event.data.id;
          try {
            this.adapter.destroy(id);
            Engine.getInstance().emit({
              type: 'shape.deleted',
              data: { id },
              origin: 'domain',
              processed: false,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Failed to delete shape with ID ${id}: ${message}`);
          }
          break;
        }

        case 'shape.selected': {
          const { shapeName } = event.data;
          const type = this.getShapeType(shapeName);
          console.log(`[${new Date().toISOString()}] Library processing shape.selected: ${shapeName}, type: ${type}`);

          Engine.getInstance().emit({
            type: 'shape.type.determined',
            data: { shapeName, type },
            origin: 'domain',
            processed: false,
          });
          break;
        }

       

        default:
          console.warn(`[${new Date().toISOString()}] Unhandled event type in Library: ${event.type}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error in event processing: ${message}`);
    } finally {
      this.eventProcessing = false;
    }
  }

  

  

 
}