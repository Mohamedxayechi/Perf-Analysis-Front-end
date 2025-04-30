import { Injectable, EventEmitter } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Project } from '../interfaces/interfaceProject';

@Injectable({
  providedIn: 'root'
})
export class FormProjectService {
  private latestProjectId = new BehaviorSubject<string | null>(null);
  createEvent = new EventEmitter<Project>();

  saveProject(project: Project): Observable<Project> {
    this.latestProjectId.next(project.id);
    return of(project);
  }

  getProjectId(): string | null {
    return this.latestProjectId.getValue();
  }
}