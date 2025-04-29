import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Project } from '../interfaces/interfaceProject';

@Injectable({
  providedIn: 'root'
})

export class FormProjectService {
  private apiUrl = 'http://localhost:5252/api/Projects'; 
  createEvent = new EventEmitter<Project>();
  updateEvent = new EventEmitter<Project>();
  deleteEvent = new EventEmitter<number>();
  constructor(private http: HttpClient) {}

  saveProject(project: Project): Observable<any> {
    return this.http.post(this.apiUrl, project).pipe(
      tap(() => this.createEvent.emit(project)),
      catchError((error) => {
        console.error('Error saving project:', error);
        return throwError(() => new Error('Failed to save project'));
      })
    );
  }

  getProjectsByUserId(userId: string): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/user/${userId}`).pipe(
      catchError((error) => {
        console.error('Error fetching projects:', error);
        return throwError(() => new Error('Failed to fetch projects'));
      })
    );
  }

  getAllProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error fetching all projects:', error);
        return throwError(() => new Error('Failed to fetch all projects'));
      })
    );
  }

  updateProject(id: number, project: Project): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, project).pipe(
      tap(() => this.updateEvent.emit(project)),
      catchError((error) => {
        console.error('Error updating project:', error);
        return throwError(() => new Error('Failed to update project'));
      })
    );
  }
  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.deleteEvent.emit(id)),
      catchError((error) => {
        console.error('Error deleting project:', error);
        return throwError(() => new Error('Failed to delete project'));
      })
    );
  }


}
