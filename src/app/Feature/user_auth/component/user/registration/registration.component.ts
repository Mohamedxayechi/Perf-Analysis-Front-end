import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FirstKeyPipe } from '../../../shared/pipes/first-key.pipe';
import { AuthService } from '../../../shared/services/auth.service';
import { IdentityResult } from '../../../shared/model/User';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FirstKeyPipe, RouterLink],
  templateUrl: './registration.component.html',
  styles: ``,
})
export class RegistrationComponent implements OnInit {
  form: FormGroup;
  isSubmitted = false;
  isCodeFromUrl = false;

  constructor(
    public formBuilder: FormBuilder,
    private authServie: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.formBuilder.group(
      {
        fullName: ['', Validators.required],
        email: ['', [Validators.email, Validators.required]],
        invitationCode: ['', Validators.required],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            Validators.pattern(/(?=.*[^a-zA-Z0-9 ])/),
          ],
        ],
        confirmPassword: [''],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.authServie.checkAuth().subscribe({
      next:()=>{
        this.router.navigateByUrl("dashboard")
      }
     })
    this.route.queryParams.subscribe((params) => {
      const code = params['code'];
      if (code) {
        this.form.patchValue({ invitationCode: code });
        this.isCodeFromUrl = true;
      }
    });
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
    this.isSubmitted = true;
    if (this.form.valid) {
      const { email, password } = this.form.value;
      this.authServie.createUser(this.form.value).subscribe({
        next: (res:IdentityResult) => {
          if (res.succeeded) {
            this.form.reset();
            console.log(this.form.value);
            this.isSubmitted = false;
            this.toastr.success('New user created!', 'Registration Successful');
            // Auto-login after successful registration
            this.authServie.signin({ email, password }).subscribe({
              next: () => {
                this.router.navigateByUrl('/dashboard');
              },
              error: (err) => {
                this.toastr.error('Auto-login failed');
                console.error('Login error:', err);
              },
            });

            this.form.reset();
            this.isSubmitted = false;
          }
        },
        error: (err) => {
          if (err.error.errors)
            err.error.errors.forEach((x: { code: string; description?: string }) => {
              switch (x.code) {
                case 'DuplicateUserName':
                  break;

                case 'DuplicateEmail':
                  this.toastr.error(
                    'Email is already taken.',
                    'Registration Failed'
                  );
                  break;

                case 'InvitationInvalid':
                  this.toastr.error(
                    'Your invitation is invalid or expired.',
                    'Registration Failed'
                  );
                  break;

                default:
                  this.toastr.error(
                    'Contact the developer',
                    'Registration Failed'
                  );
                  console.log(x);
                  break;
              }
            });
          else console.log('error:', err);
        },
      });
    }
  }
  hasDisplayableError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return (
      Boolean(control?.invalid) &&
      (this.isSubmitted || Boolean(control?.touched) || Boolean(control?.dirty))
    );
  }
}
