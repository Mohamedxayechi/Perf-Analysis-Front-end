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

// import { authGuard } from './Feature/UserAuth/shared/auth.guard';

export const routes: Routes = [
    // { path: '', component: HomeComponent, pathMatch: 'full' }, 
    { path: 'create/project', component: FormProjectComponent }, 
    { path: 'ubload/vd', component: UploadFileComponent},
    {
        path: 'user', component: UserComponent,
        children: [
          { path: 'signup', component: RegistrationComponent },
          { path: 'signin', component: LoginComponent },
          { path: 'forgot-password', component: ForgotPasswordComponent }
        ]
      },
      // {
      //   path:'',
      //   component:MainLayoutComponent,
      //   canActivate:[authGuard],
      //   canActivateChild:[authGuard],
      //   children:[
      //     { 
      //       path: 'dashboard',
      //        component: DashboardComponent,
             
      //     },
      //   },
];
@NgModule({
    imports: [RouterModule.forRoot(routes),HttpClientModule],
    exports: [RouterModule],
  })

  export class AppRoutingModule {}

