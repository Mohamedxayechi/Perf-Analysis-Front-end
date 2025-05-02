import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadService } from '../../services/upload-service.service';
import { FileInfo } from '../../Interfaces/fileInfo';

/**
 * Component responsible for handling video file uploads via drag-and-drop or file input.
 * Displays video metadata and previews the selected video.
 */
@Component({
  selector: 'app-upload-file',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-file.component.html', // Fixed typo: 'ubload' to 'upload'
  styleUrls: ['./upload-file.component.css']
})

export class UploadFileComponent implements OnDestroy {
  // Reference to the video player element in the template
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  // State variables for file selection, video preview, and upload status
  selectedFile: File | null = null; // Currently selected video file
  videoUrl: string | null = null; // URL for previewing the selected video
  fileInfo: FileInfo | null = null; // Metadata about the selected file (name, type, size, duration)
  uploadStatus: string | null = null; // Status message for upload process
  validationError: string | null = null; // Error message for invalid file
  isDragging = false; // Tracks drag-and-drop state

  constructor(private uploadService: UploadService) {}

  /**
   * Handles the drag-over event to enable drag-and-drop functionality.
   * Prevents default behavior and sets dragging state.
   */
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  /**
   * Handles the drag-leave event to reset dragging state.
   */
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  /**
   * Handles the drop event for drag-and-drop file upload.
   * Validates and processes the dropped file.
   */
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSelectFile(files[0]);
    }
  }

  /**
   * Handles file selection via file input element.
   * Validates and processes the selected file.
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSelectFile(input.files[0]);
    }
  }

  /**
   * Validates the selected file and prepares it for preview.
   * Checks file type and size, generates a preview URL, and extracts metadata.
   * @param file The file to validate and process
   */
  validateAndSelectFile(file: File) {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB limit

    // Validate file type
    if (!validTypes.includes(file.type)) {
      this.validationError = 'Invalid file type. Please upload MP4, MOV, or AVI videos.';
      this.uploadStatus = null;
      this.uploadService.setVideoUrl(null);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      this.validationError = 'File size exceeds 2GB limit.';
      this.uploadStatus = null;
      this.uploadService.setVideoUrl(null);
      return;
    }

    // Store the selected file and generate a preview URL
    this.selectedFile = file;
    this.validationError = null;
    this.videoUrl = URL.createObjectURL(file);
    this.uploadStatus = 'Video selected successfully!';

    // Extract video metadata (duration, etc.)
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = this.formatDuration(video.duration);
      this.fileInfo = {
        name: file.name,
        type: file.type,
        size: this.formatFileSize(file.size),
        duration
      };
      // Notify the service with the video URL
      const videoUrl = this.videoUrl || 'http://url-de-video';
      this.uploadService.setVideoUrl(videoUrl);
    };
    video.src = this.videoUrl;
  }

  /**
   * Cancels the current file selection and cleans up resources.
   * Revokes the preview URL and resets component state.
   */
  cancelUpload() {
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
    }
    this.selectedFile = null;
    this.videoUrl = null;
    this.fileInfo = null;
    this.uploadStatus = null;
    this.validationError = null;
    this.uploadService.setVideoUrl(null);
  }

  /**
   * Lifecycle hook to clean up resources when the component is destroyed.
   * Revokes the preview URL to prevent memory leaks.
   */
  ngOnDestroy() {
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
    }
  }

  /**
   * Formats the file size into a human-readable string (e.g., '1.23 MB').
   * @param bytes The file size in bytes
   * @returns Formatted size string
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Formats the video duration into a 'MM:SS' string.
   * @param seconds The duration in seconds
   * @returns Formatted duration string
   */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}