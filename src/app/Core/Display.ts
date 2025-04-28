import { Injectable } from '@angular/core';
import Konva from 'konva';
import { Engine } from './Engine';
import { eventBus, EventPayload } from './event-bus';

type ShapeData = {
  id: string;
  type: 'simple' | 'complex';
  props: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    color?: string;
    numPoints?: number;
    innerRadius?: number;
    outerRadius?: number;
  };
};

@Injectable({
  providedIn: 'root',
})
export class Display {
  private stage: Konva.Stage | null = null;
  private layer: Konva.Layer | null = null;
  private shapes: Map<string, Konva.Shape> = new Map();
  private engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  handleEvent(event: EventPayload): void {
    switch (event.type) {
      case 'engine.init': {
        const { container } = event.data as { container: HTMLDivElement };
        if (!(container instanceof HTMLDivElement)) {
          console.error('Invalid container provided for canvas initialization');
          return;
        }
        this.initializeCanvas(container);
        break;
      }

      case 'shape.added': {
        const shapeData = event.data as ShapeData;
        if (!this.layer) {
          console.warn('Canvas not initialized; cannot add shape');
          return;
        }
        try {
          const konvaShape = this.createKonvaShape(shapeData);
          if (konvaShape) {
            konvaShape.id(shapeData.id);
            this.shapes.set(shapeData.id, konvaShape);
            this.layer.add(konvaShape);
            this.layer.draw();
          } else {
            console.error(`Failed to create Konva shape for ID ${shapeData.id}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Error adding shape with ID ${shapeData.id}: ${message}`);
        }
        break;
      }

      case 'shape.update.fromDisplay': {
        const { id, props } = event.data as { id: string; props: Record<string, any> };
        if (!this.layer) {
          console.warn('Canvas not initialized; cannot update shape');
          return;
        }
        try {
          const konvaShape = this.shapes.get(id);
          if (konvaShape) {
            konvaShape.setAttrs(props);
            this.layer.draw();
          } else {
            console.error(`Konva shape with ID ${id} not found`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Error updating shape with ID ${id}: ${message}`);
        }
        break;
      }

      case 'state.shape.updated': {
        const { shapes } = event.data as { shapes: ShapeData[] };
        if (!this.layer) {
          console.warn('Canvas not initialized; cannot update shapes');
          return;
        }
        try {
          this.shapes.clear();
          this.layer.removeChildren();
          shapes.forEach(shapeData => {
            const konvaShape = this.createKonvaShape(shapeData);
            if (konvaShape) {
              konvaShape.id(shapeData.id);
              this.shapes.set(shapeData.id, konvaShape);
              this.layer!.add(konvaShape);
            }
          });
          this.layer.draw();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Error updating shapes: ${message}`);
        }
        break;
      }

      default:
        console.warn(`Unhandled event type in Display: ${event.type}`);
    }
  }

  private initializeCanvas(container: HTMLDivElement): void {
    try {
      this.stage = new Konva.Stage({
        container: container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
      });
      this.layer = new Konva.Layer();
      this.stage.add(this.layer);

      this.layer.on('dragend', (e) => {
        const shape = e.target as Konva.Shape;
        const id = shape.id();
        const { x, y } = shape.position();
        this.engine.emit({ type: 'ui.shape.dragged', data: { id, props: { x, y } } });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to initialize canvas: ${message}`);
    }
  }

  private createKonvaShape(shapeData: ShapeData): Konva.Shape | null {
    try {
      const { type, props } = shapeData;
      if (type === 'simple') {
        if (
          typeof props.x !== 'number' ||
          typeof props.y !== 'number' ||
          typeof props.width !== 'number' ||
          typeof props.height !== 'number'
        ) {
          throw new Error('Missing required properties for simple shape');
        }
        return new Konva.Rect({
          x: props.x,
          y: props.y,
          width: props.width,
          height: props.height,
          fill: props.color || 'black',
          draggable: true,
        });
      } else if (type === 'complex') {
        if (
          typeof props.x !== 'number' ||
          typeof props.y !== 'number' ||
          typeof props.numPoints !== 'number' ||
          typeof props.innerRadius !== 'number' ||
          typeof props.outerRadius !== 'number'
        ) {
          throw new Error('Missing required properties for complex shape');
        }
        return new Konva.Star({
          x: props.x,
          y: props.y,
          numPoints: props.numPoints,
          innerRadius: props.innerRadius,
          outerRadius: props.outerRadius,
          fill: props.color || 'black',
          draggable: true,
        });
      }
      throw new Error(`Invalid shape type: ${type}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to create Konva shape: ${message}`);
      return null;
    }
  }

  getStage(): Konva.Stage | null {
    return this.stage;
  }
}