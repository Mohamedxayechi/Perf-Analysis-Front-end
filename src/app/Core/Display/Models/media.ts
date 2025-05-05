// media.model.ts
export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video'
  }
  
  export class Media {
    filePath: string;
    mediaType: MediaType;
    title: string;
    description: string;
    createdAt: Date;
    fileSize: number;
    file?: File; // Optional: for handling file uploads
  
    private validImageExtensions: string[] = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    private validVideoExtensions: string[] = ['.mp4', '.avi', '.mov', '.wmv'];
  
    constructor(
      filePath: string,
      mediaType: MediaType,
      title: string = '',
      description: string = '',
      file?: File
    ) {
      this.filePath = filePath;
      this.mediaType = mediaType;
      this.title = title;
      this.description = description;
      this.createdAt = new Date();
      this.fileSize = file ? file.size : 0;
      this.file = file;
  
      this.validateFileExtension();
    }
  
    private validateFileExtension(): void {
      const fileExtension = this.filePath.substring(this.filePath.lastIndexOf('.')).toLowerCase();
      
      if (this.mediaType === MediaType.IMAGE && !this.validImageExtensions.includes(fileExtension)) {
        throw new Error(`Invalid image file extension: ${fileExtension}`);
      } else if (this.mediaType === MediaType.VIDEO && !this.validVideoExtensions.includes(fileExtension)) {
        throw new Error(`Invalid video file extension: ${fileExtension}`);
      }
    }
  
    getMetadata(): object {
      return {
        filePath: this.filePath,
        mediaType: this.mediaType,
        title: this.title,
        description: this.description,
        createdAt: this.createdAt,
        fileSizeBytes: this.fileSize,
        fileSizeMB: this.fileSize ? (this.fileSize / (1024 * 1024)).toFixed(2) : 0
      };
    }
  
    updateDetails(title?: string, description?: string): void {
      if (title !== undefined) {
        this.title = title;
      }
      if (description !== undefined) {
        this.description = description;
      }
    }
  }