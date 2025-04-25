export interface Project {
  id: string;
  name: string;
  thumbnailUrl: string;         // URL of the thumbnail image
  videoUrl: string;             // URL of the main video
  createdDate: Date;
  lastModifiedDate: Date;
  createdBy: string;            // User who created the project
  ownershipGroup: string;       // Ownership group identifier
}
