import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
//import { HomeComponent } from './Feature/graphical_layout/components/home/home.component';
import { HttpClientModule } from '@angular/common/http';
import { FormProjectComponent } from './Feature/createProject/components/form-project/form-project.component';
import {UploadFileComponent } from './Feature/uploadFile/components/upload-file/upload-file.component';
import { UserComponent } from './Feature/user_auth/component/user/user.component';
import { RegistrationComponent } from './Feature/user_auth/component/user/registration/registration.component';
import { LoginComponent } from './Feature/user_auth/component/user/login/login.component';
import { ForgotPasswordComponent } from './Feature/user_auth/component/user/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './Feature/user_auth/component/user/reset-password/reset-password.component';
import { authGuard } from './Feature/user_auth/shared/guard/auth.guard';
import { MainLayoutComponent } from './Feature/user_auth/component/layouts/main-layout/main-layout.component';
import { DashboardComponent } from './Feature/user_auth/component/dashboard/dashboard.component';
import { authRedirectGuard } from './Feature/user_auth/shared/guard/auth-redirect.guard';

// import { authGuard } from './Feature/UserAuth/shared/auth.guard';

export const routes: Routes = [
    // { path: '', component: HomeComponent, pathMatch: 'full' }, 
    { path: 'create/project', component: FormProjectComponent }, 
    { path: 'ubload/vd', component: UploadFileComponent},
    {
        path: 'user', component: UserComponent,

        children: [
          { path: '', redirectTo: 'signin', pathMatch: 'full' },
          { path: 'signup', component: RegistrationComponent,canActivate: [authRedirectGuard] },
          { path: 'signin', component: LoginComponent,canActivate: [authRedirectGuard] },
          { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [authRedirectGuard]},
          { path: 'reset-password', component: ResetPasswordComponent ,canActivate: [authRedirectGuard]}
        ]
      },
      {
        path:'',
        component:MainLayoutComponent,
        canActivate:[authGuard],
        canActivateChild:[authGuard],
        children:[
          { 
            path: 'dashboard',
             component: DashboardComponent,
          },
        ]
        },
];
@NgModule({
    imports: [RouterModule.forRoot(routes),HttpClientModule],
    exports: [RouterModule],
  })

  export class AppRoutingModule {}

