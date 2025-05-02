import Konva from 'konva';

export interface BaseShape {
    
    type: string;
   

    createShape(x: number, y: number): void;
    updateShape(x: number, y: number): void;
    updateFromProperties(properties: any): void;
    getShape(): Konva.Node;
    delete():void;
    getId(): string;
    setId(id: string): void;
    getProperties(): any;
    isSelected(): boolean 
  }