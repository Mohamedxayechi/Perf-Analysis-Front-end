// Import necessary Angular core modules, services, and third-party libraries
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid'; // UUID library for generating unique IDs
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormProjectService } from '../../services/form-project.service';
import { SnackBarService } from '../../services/snack-bar.service';
import { UploadService } from '../../../uploadFile/services/upload-service.service';
import { UploadFileComponent } from '../../../uploadFile/components/upload-file/upload-file.component';
import { AuthService } from '../../services/auth-service.service';

// Component decorator defining metadata for the Angular component
@Component({
  selector: 'app-form-project', // Component's HTML tag
  standalone: true, // Indicates this is a standalone component (no NgModule required)
  imports: [
    CommonModule, // Provides common Angular directives like *ngIf, *ngFor
    ReactiveFormsModule, // Enables reactive forms for form handling
    MatFormFieldModule, // Material design form field module
    MatInputModule, // Material design input module
    MatButtonModule, // Material design button module
    MatSnackBarModule, // Material design snackbar for notifications
    UploadFileComponent, // Custom component for file uploads
  ],
  templateUrl: './form-project.component.html', // Path to the component's HTML template
  styleUrls: ['./form-project.component.css'], // Path to the component's CSS styles
})
export class FormProjectComponent implements OnInit, OnDestroy {
  // Reactive form group for managing project form inputs
  projectForm: FormGroup;
  // Flag to indicate if form submission is in progress
  isSubmitting = false;
  // Flag to indicate if a video has been selected
  videoSelected = false;
  // Stores the URL of the uploaded video
  videoUrl: string | null = null;
  // Subscription for handling project creation events
  private createSub: Subscription | null = null;
  // Subscription for handling video URL updates
  private videoUrlSub: Subscription | null = null;

  // Constructor with dependency injection for required services
  constructor(
    private fb: FormBuilder, // Service for creating reactive forms
    private formProjectService: FormProjectService, // Service for project-related operations
    private snackBarService: SnackBarService, // Service for displaying snackbar notifications
    private uploadService: UploadService, // Service for handling file uploads
    private router: Router, // Service for navigation between routes
    private authService: AuthService // Service for authentication and user management
  ) {
    // Initialize the reactive form with fields and validators
    this.projectForm = this.fb.group({
      projectName: ['', [Validators.required, Validators.maxLength(100)]], // Required field with max length of 100
      description: ['', Validators.maxLength(500)], // Optional field with max length of 500
    });
  }

  // Lifecycle hook: Runs when the component is initialized
  ngOnInit() {
    // Check if the user is logged in and has the "user" role
    if (!this.authService.isUser()) {
      // Display error notification if user is not authorized
      this.snackBarService.showError('You must be logged in as a user to create a project.');
      // Redirect to login page
      this.router.navigate(['/login']);
      return;
    }
    // Initialize subscriptions for project creation and video URL updates
    this.initializeSubscriptions();
  }

  // Private method to set up subscriptions for reactive updates
  private initializeSubscriptions() {
    // Subscribe to project creation events
    this.createSub = this.formProjectService.createEvent.subscribe((project) => {
      // Reset submitting state when project is created
      this.isSubmitting = false;
      // Show success notification
      this.snackBarService.showSuccess('Project created successfully!');
      // Log the created project for debugging
      console.log('Project Created:', project);
      // Reset the form after successful submission
      this.resetForm();
    });

    // Subscribe to video URL updates from the upload service
    this.videoUrlSub = this.uploadService.videoUrl$.subscribe((videoUrl) => {
      if (videoUrl) {
        // Update video URL and mark video as selected
        this.videoUrl = videoUrl;
        this.videoSelected = true;
      } else {
        // Clear video URL and reset selection state
        this.videoUrl = null;
        this.videoSelected = false;
      }
    });
  }

  // Method to handle form submission
  onSubmit() {
    // Check if the form is valid and a video is selected
    if (this.projectForm.valid && this.videoSelected) {
      // Set submitting state to true
      this.isSubmitting = true;

      // Get the currently logged-in user
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        // Show error if no user is logged in
        this.snackBarService.showError('No user is logged in.');
        this.isSubmitting = false;
        return;
      }

      // Create project data object with form values and additional metadata
      const projectData = {
        id: uuidv4(), // Generate unique ID for the project
        projectName: this.projectForm.value.projectName, // Get project name from form
        description: this.projectForm.value.description, // Get description from form
        timestamp: new Date().toISOString(), // Record creation timestamp
        userId: currentUser.id, // Associate project with user's ID
        createdBy: currentUser.username, // Store username of creator
        videoUrl: this.videoUrl || 'http://url-de-video', // Use uploaded video URL or fallback
      };

      try {
        // Save project data via the project service
        this.formProjectService.saveProject(projectData).subscribe({
          next: () => {
            // Emit create event on successful save
            this.formProjectService.createEvent.emit(projectData);
          },
          error: (error) => {
            // Show error notification if save fails
            this.snackBarService.showError(error.message || 'Failed to create project.');
            // Reset submitting state
            this.isSubmitting = false;
          },
        });
      } catch {
        // Handle localStorage save errors
        this.snackBarService.showError('Failed to save project to localStorage.');
        this.isSubmitting = false;
      }
    } else {
      // Handle validation errors
      if (!this.videoSelected) {
        // Show error if no video is selected
        this.snackBarService.showError('Please select a video before submitting.');
      } else if (this.projectForm.invalid) {
        // Show error if form fields are invalid
        this.snackBarService.showError('Please fill out all required fields.');
      }
    }
  }

  // Method to reset the form and related states
  resetForm() {
    // Reset form fields to their initial state
    this.projectForm.reset();
    // Clear video selection state
    this.videoSelected = false;
    // Clear video URL in the upload service
    this.uploadService.setVideoUrl(null);
  }

  // Lifecycle hook: Runs when the component is destroyed
  ngOnDestroy() {
    // Unsubscribe from project creation subscription to prevent memory leaks
    if (this.createSub) {
      this.createSub.unsubscribe();
    }
    // Unsubscribe from video URL subscription to prevent memory leaks
    if (this.videoUrlSub) {
      this.videoUrlSub.unsubscribe();
    }
  }
}