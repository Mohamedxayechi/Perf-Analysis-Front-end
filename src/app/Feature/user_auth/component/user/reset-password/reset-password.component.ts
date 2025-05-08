import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { FirstKeyPipe } from '../../../shared/pipes/first-key.pipe';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule,FirstKeyPipe],
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
        password: ['', [Validators.required, Validators.minLength(6),Validators.pattern(/(?=.*[^a-zA-Z0-9 ])/),]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator: ValidatorFn = (control: AbstractControl): null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value != confirmPassword.value)
      confirmPassword?.setErrors({ passwordMismatch: true });
    else confirmPassword?.setErrors(null);

    return null;
  };

  onSubmit() {
    if (this.form.valid) {
      const formData = {
        email: this.email,
        token: this.encodedToken,
        newPassword: this.form.value.password
      };


      this.authService.resetPassword(formData).subscribe({
        next: () => this.toastr.success('Password reset successful'),
        error: () => this.toastr.error('Password reset successful'),
      });
    }
  }

  hasDisplayableError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return (
      Boolean(control?.invalid) &&
      ( Boolean(control?.touched) || Boolean(control?.dirty))
    );
  }
}
