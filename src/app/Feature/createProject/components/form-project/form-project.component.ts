import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormProjectService } from '../../services/form-project.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { SnackBarService } from '../../services/snack-bar.service';
import { Router } from '@angular/router';
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
    HttpClientModule
    ],
  templateUrl: './form-project.component.html',
  styleUrl: './form-project.component.css'
})
export class FormProjectComponent {
  projectForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private formProjectService: FormProjectService,
    private snackBar: MatSnackBar,
    private snackBarService: SnackBarService,
    private router: Router
  ) {
    this.projectForm = this.fb.group({
      projectName: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)]
    });
  }

  onSubmit() {
    if (this.projectForm.valid) {
      this.isSubmitting = true;
      const projectData = {
        id: Math.floor(Math.random() * 10000), 
        projectName: this.projectForm.value.projectName,
        description: this.projectForm.value.description,
        timestamp: new Date().toISOString(),
        userId: 'user123' 
      };

      this.formProjectService.saveProject(projectData).subscribe({
        next: () => {
          this.snackBarService.showSuccess('Project created successfully!');
          this.projectForm.reset();
          this.isSubmitting = false;
          this.router.navigate(['']);
        },
        error: () => {
          this.snackBar.open('Failed to create project.', 'Close', { duration: 4000 });
          this.isSubmitting = false;
        }
      });
    }
  }
}
