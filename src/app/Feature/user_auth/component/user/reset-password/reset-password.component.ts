import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl:'./reset-password.component.html'
})
export class ResetPasswordComponent {
  form: FormGroup;
  email = '';
  token = '';
  encodedToken = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService :AuthService,
    private toastr:ToastrService
  ) {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    
    const token = this.route.snapshot.queryParamMap.get('token');
    this.encodedToken = encodeURIComponent(token!); // Encode it back // Encode it back



    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordsMatch }
    );
  }

  passwordsMatch(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirm = formGroup.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = {
        email: this.email,
        token: this.encodedToken,
        newPassword: this.form.value.password
      };
      console.log(formData.token)

      this.authService.resetPassword(formData).subscribe({
        next: () => this.toastr.success('Password reset successful'),
        error: () => this.toastr.error('Password reset successful'),
      });
    }
  }
}
