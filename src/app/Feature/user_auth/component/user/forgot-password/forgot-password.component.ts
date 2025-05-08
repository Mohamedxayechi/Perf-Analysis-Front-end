import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder,private authService:AuthService,private toastr:ToastrService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.authService.forgotPassword(this.form.value).subscribe({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        next:(res:any)=>{
          console.log(res)
          this.toastr.success('If this email exists, a reset link was sent');
          this.form.reset();
        },
        error:(err)=>
          console.error(err)
      }
    )
    }
  }

}
