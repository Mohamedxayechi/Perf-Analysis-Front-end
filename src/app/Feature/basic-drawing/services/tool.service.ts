import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToolType = 'rectangle' | 'circle' | 'ellipse' | 'rectangle' | 'arrow' | 'polygon' | 'free_draw' | 'text' ;

export interface Annotation {
  id: string;
  type: string; 
  x: number;
  y: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToolService {
  private annotations: Annotation[] = [];
  private selectedAnnotationSubject = new BehaviorSubject<Annotation | null>(null);
  private activeTool: string | null = null;
  private activeToolSubject = new BehaviorSubject<string | null>(null);
 

  constructor() {}

  getAnnotations(): Annotation[] {
    return [...this.annotations];
  }

  getSelectedAnnotation(): Observable<Annotation | null> {
    return this.selectedAnnotationSubject.asObservable();
  }

  getActiveTool(): Observable<string | null> {
    return this.activeToolSubject.asObservable();
  }

  isToolActive(toolName: string): boolean {
    return this.activeTool === toolName;
  }

  
  selectAnnotation(annotation: Annotation | null): void {
    this.selectedAnnotationSubject.next(annotation);
  }

  setActiveTool(tool: string | null): void {
    if (this.activeTool !== tool) {
      this.selectAnnotation(null);
    }
    this.activeTool = tool;
    this.activeToolSubject.next(tool);
  }
}
