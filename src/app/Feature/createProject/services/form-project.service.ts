import { Injectable, EventEmitter } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Project } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class FormProjectService {
private latestProjectId = new BehaviorSubject<string | null>(null);
  createEvent = new EventEmitter<Project>();

  // Save project to localStorage
  saveProject(project: Project): Observable<Project> {
    try {
      // Get existing projects from localStorage or initialize an empty array
      const projects: Project[] = JSON.parse(localStorage.getItem('projects') || '[]');
      // Add the new project
      projects.push(project);
      // Save back to localStorage
      localStorage.setItem('projects', JSON.stringify(projects));
      // Update latest project ID
      this.latestProjectId.next(project.id);
      return of(project);
    } catch (error) {
      throw new Error('Failed to save project to localStorage');
    }
  }

}