import Konva from 'konva';
import { BaseShape } from './Models/BaseShape';

export class Complex2DShape implements BaseShape {
  
  
  public type: string = 'complex';
  createShape(x: number, y: number): void {
    throw new Error('Method not implemented.');
  }
  updateShape(x: number, y: number): void {
    throw new Error('Method not implemented.');
  }
  updateFromProperties(properties: any): void {
    throw new Error('Method not implemented.');
  }
  getShape(): Konva.Node {
    throw new Error('Method not implemented.');
  }
  getId(): string {
    throw new Error('Method not implemented.');
  }
  setId(id: string): void {
    throw new Error('Method not implemented.');
  }
  getProperties() {
    throw new Error('Method not implemented.');
  }
  delete(): void {
    throw new Error('Method not implemented.');
  }
  isSelected(): boolean {
    throw new Error('Method not implemented.');
  }

 }
  