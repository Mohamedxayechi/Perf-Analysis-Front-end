import { Component, Input } from '@angular/core';
import { UploadService } from '../services/upload-service.service';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SnackBarService } from '../../createProject/services/snack-bar.service';

@Component({
  selector: 'app-ubload-file',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ubload-file.component.html',
  styleUrl: './ubload-file.component.css'
})
export class UbloadFileComponent {
  @Input() idProject: string = '3'; // Default project ID
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  uploadStatus: string = '';
  isDragging: boolean = false;
  supportedFormats: string[] = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  supportedExtensions: string[] = ['.mp4', '.mov', '.avi'];
  maxFileSize: number = 2 * 1024 * 1024 * 1024; // 2GB in bytes
  validationError: string = '';

  private targetProgress: number = 0;
  private progressInterval: any;

  constructor(
    private uploadService: UploadService,
    private snackBarService: SnackBarService,
    private http: HttpClient
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.validationError = '';
    this.uploadStatus = '';

    if (!this.isValidFileType(file)) {
      this.validationError = 'Invalid file format. Please upload MP4, MOV, or AVI files.';
      this.snackBarService.showError(this.validationError);
      this.selectedFile = null;
      return;
    }

    if (!this.isValidFileSize(file)) {
      this.validationError = `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit.`;
      this.snackBarService.showError(this.validationError);
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
    this.uploadStatus = `File selected: ${file.name}`;
    this.snackBarService.showSuccess(this.uploadStatus);
  }

  private isValidFileType(file: File): boolean {
    const isValidMimeType = this.supportedFormats.includes(file.type);
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidExtension = fileExtension ? this.supportedExtensions.includes(fileExtension) : false;
    return isValidMimeType && isValidExtension;
  }

  private isValidFileSize(file: File): boolean {
    return file.size <= this.maxFileSize;
  }

  uploadVideo(): void {
    if (!this.selectedFile) {
      this.snackBarService.showError('Please select a valid file');
      this.uploadStatus = 'Please select a valid file';
      return;
    }
    if (!this.idProject) {
      this.snackBarService.showError('Please provide a project ID');
      this.uploadStatus = 'Please provide a project ID';
      return;
    }

    this.uploadProgress = 0;
    this.targetProgress = 0;
    this.validationError = '';
    this.startProgressAnimation();

    this.uploadService.uploadVideo(this.selectedFile, this.idProject)
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.targetProgress = Math.round((100 * event.loaded) / event.total);
          } else if (event instanceof HttpResponse) {
            this.targetProgress = 100;
            this.uploadStatus = 'Upload complete!';
            this.snackBarService.showSuccess('Upload complete!');
            clearInterval(this.progressInterval);
            this.uploadProgress = 100;
            this.selectedFile = null;
          }
        },
        error: (error) => {
          const errorMessage = `Upload failed: ${error.error?.Message || error.message}`;
          this.uploadStatus = errorMessage;
          this.snackBarService.showError(errorMessage);
          this.uploadProgress = 0;
          this.targetProgress = 0;
          clearInterval(this.progressInterval);
        }
      });
  }

  private startProgressAnimation(): void {
    const step = 2;
    const intervalTime = 100;

    this.progressInterval = setInterval(() => {
      if (this.uploadProgress < this.targetProgress) {
        this.uploadProgress = Math.min(this.uploadProgress + step, this.targetProgress);
      }
      if (this.uploadProgress >= 100) {
        clearInterval(this.progressInterval);
      }
    }, intervalTime);
  }
}