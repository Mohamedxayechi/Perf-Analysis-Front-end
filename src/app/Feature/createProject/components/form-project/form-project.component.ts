import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormProjectService } from '../../services/form-project.service';
import { SnackBarService } from '../../services/snack-bar.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UbloadFileComponent } from '../../../uploadFile/components/ubload-file/ubload-file.component';
import { v4 as uuidv4 } from 'uuid';
import { UploadService } from '../../../uploadFile/services/upload-service.service';

/**
 * Component for creating and submitting a project form with video upload integration.
 * Handles form validation, project creation, and video selection feedback.
 */
@Component({
  selector: 'app-form-project',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    UbloadFileComponent,
  ],
  templateUrl: './form-project.component.html', // Note: Ensure file name matches
  styleUrls: ['./form-project.component.css']
})
export class FormProjectComponent implements OnInit, OnDestroy {
  // Reactive form group for project data
  projectForm: FormGroup;
  // Tracks form submission state
  isSubmitting = false;
  // Tracks whether a video has been selected
  videoSelected = false;
  // Stores the URL of the selected video
  videoUrl: string | null = null;
  // Subscription for project creation events
  private createSub: Subscription | null = null;
  // Subscription for video URL updates
  private videoUrlSub: Subscription | null = null;

  /**
   * Constructor to initialize dependencies and set up the project form.
   * @param fb FormBuilder for creating reactive forms
   * @param formProjectService Service for handling project data operations
   * @param snackBarService Service for displaying notifications
   * @param uploadService Service for managing video upload state
   * @param router Router for navigation
   */
  constructor(
    private fb: FormBuilder,
    private formProjectService: FormProjectService,
    private snackBarService: SnackBarService,
    private uploadService: UploadService,
    private router: Router
  ) {
    // Initialize the project form with validation rules
    this.projectForm = this.fb.group({
      projectName: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
    });
  }

  /**
   * Lifecycle hook to set up subscriptions on component initialization.
   */
  ngOnInit() {
    this.initializeSubscriptions();
  }

  /**
   * Initializes subscriptions for project creation and video URL updates.
   */
  private initializeSubscriptions() {
    // Subscribe to project creation events
    this.createSub = this.formProjectService.createEvent.subscribe((project) => {
      this.isSubmitting = false;
      this.snackBarService.showSuccess('Project created successfully!');
      console.log('Project Created:', project);
      this.resetForm();
    });

    // Subscribe to video URL changes from the upload service
    this.videoUrlSub = this.uploadService.videoUrl$.subscribe((videoUrl) => {
      if (videoUrl) {
        this.videoUrl = videoUrl;
        this.videoSelected = true;
      } else {
        this.videoUrl = null;
        this.videoSelected = false;
      }
    });
  }

  /**
   * Handles form submission to create a new project.
   * Validates form data and video selection before saving the project.
   */
  onSubmit() {
    if (this.projectForm.valid && this.videoSelected) {
      this.isSubmitting = true;
      // Prepare project data with a unique ID and timestamp
      const projectData = {
        id: uuidv4(),
        projectName: this.projectForm.value.projectName,
        description: this.projectForm.value.description,
        timestamp: new Date().toISOString(),
        userId: 'user123', // Note: Hardcoded user ID, consider dynamic user data
        videoUrl: this.videoUrl || 'http://url-de-video' // Note: Fallback URL may need review
      };

      try {
        // Save project data via the service
        this.formProjectService.saveProject(projectData).subscribe({
          next: () => {
            // Emit creation event on success
            this.formProjectService.createEvent.emit(projectData);
          },
          error: (error) => {
            // Handle errors from the service
            this.snackBarService.showError(error.message || 'Failed to create project.');
            this.isSubmitting = false;
          }
        });
      } catch (error) {
        // Handle localStorage or unexpected errors
        this.snackBarService.showError('Failed to save project to localStorage.');
        this.isSubmitting = false;
      }
    } else {
      // Display validation errors
      if (!this.videoSelected) {
        this.snackBarService.showError('Please select a video before submitting.');
      } else if (this.projectForm.invalid) {
        this.snackBarService.showError('Please fill out all required fields.');
      }
    }
  }

  /**
   * Resets the form and video selection state after successful submission.
   */
  resetForm() {
    this.videoSelected = false;
    this.uploadService.setVideoUrl(null); // Clear video selection
  }

  /**
   * Lifecycle hook to clean up subscriptions when the component is destroyed.
   * Prevents memory leaks by unsubscribing from observables.
   */
  ngOnDestroy() {
    if (this.createSub) {
      this.createSub.unsubscribe();
    }
    if (this.videoUrlSub) {
      this.videoUrlSub.unsubscribe();
    }
  }
}