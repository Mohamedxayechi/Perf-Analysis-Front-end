import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Project } from '../../interfaces/interfaceProject';
import { FormProjectService } from '../../services/form-project.service';
import { EditProjectComponent } from '../edit-project/edit-project.component';
import { MatDialog } from '@angular/material/dialog';
import { SnackBarService } from '../../services/snack-bar.service';
@Component({
  selector: 'app-list-project',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './list-project.component.html',
  styleUrl: './list-project.component.css'
})
export class ListProjectComponent implements OnInit {
  projects: Project[] = [];

  constructor(
    private formProjectService: FormProjectService,
    private snackBar: MatSnackBar,
     private dialog: MatDialog,
     private snackBarService: SnackBarService
  ) {}

  ngOnInit() {
    this.loadAllProjects();
  }

  loadAllProjects() {
    this.formProjectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.snackBar.open('Projects loaded successfully.', 'Close', { duration: 3000,horizontalPosition: 'center',verticalPosition: 'top' });
      },
      error: () => {
        this.snackBar.open('Failed to load projects.', 'Close', { duration: 3000 ,horizontalPosition: 'center',verticalPosition: 'top'});
      }
    });
  }

  editProject(project: Project) {
    const dialogRef = this.dialog.open(EditProjectComponent, {
      width: '400px',
      data: { ...project } // Pass a copy to avoid direct mutation
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.formProjectService.updateProject(result.id, result).subscribe({
          next: () => {
            this.snackBar.open(`Project ${result.projectName} updated successfully.`, 'Close', { duration: 3000 });
            this.loadAllProjects(); // Refresh the list
          },
          error: () => {
            this.snackBar.open('Failed to update project.', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
  deleteProject(project: Project) {
    this.formProjectService.deleteProject(project.id).subscribe({
      next: () => {
        this.snackBarService.showSuccess(`Project ${project.projectName} deleted successfully.`);
        this.loadAllProjects(); // Refresh the list
      },
      error: () => {
        this.snackBarService.showError('Failed to delete project.');
      }
    });
  }
}
