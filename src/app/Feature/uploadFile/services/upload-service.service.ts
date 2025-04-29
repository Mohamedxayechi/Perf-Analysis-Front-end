import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = 'http://localhost:5252/api/ubloadfile'; 
  constructor(private http: HttpClient) {}

  uploadVideo(file: File, projectId: string): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('projectId', 'user123');

    return this.http.post(this.apiUrl, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}