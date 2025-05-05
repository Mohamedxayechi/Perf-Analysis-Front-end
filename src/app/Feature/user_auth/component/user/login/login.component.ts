import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink,Router } from '@angular/router';
import {  ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../shared/services/auth.service';




@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styles: ``
})
export class LoginComponent implements OnInit{
  form:FormGroup;
  isSubmitted =false;
  googleLoginClicked=false;
  constructor(
    private formBuilder : FormBuilder,
    private authServie :AuthService,
    private router :Router,
    private toastr:ToastrService
  )
  {
    this.form=this.formBuilder.group({
      email:["",Validators.required],
      password:["",Validators.required]
    })
  }

  ngOnInit(): void {
    this.authServie.checkAuth().subscribe({
      next:()=>{
        this.router.navigateByUrl("dashboard")
      }
     })
  }

  hasDisplayableError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control?.invalid) &&
      (this.isSubmitted || Boolean(control?.touched)|| Boolean(control?.dirty))
  }
  onSubmit(){
    this.isSubmitted=true;
    if(this.form.valid){
      this.authServie.signin(this.form.value).subscribe({
        next:()=>{
          this.router.navigateByUrl("/dashboard")
        },
        error:err=>{
          if (err.status==400)
            this.toastr.error("Incorrect email or password","Login failed");
          else
          console.log("err",err)
        }
      })

    }
  }



}
