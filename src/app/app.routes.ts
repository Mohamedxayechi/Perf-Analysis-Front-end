
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './Feature/graphical_layout/components/home/home.component';

import { HttpClientModule } from '@angular/common/http';



import { FormProjectComponent } from './Feature/createProject/components/form-project/form-project.component';

import {UploadFileComponent } from './Feature/uploadFile/components/upload-file/upload-file.component';

export const routes: Routes = [
    // { path: '', component: HomeComponent, pathMatch: 'full' }, 
    { path: 'create/project', component: FormProjectComponent }, 
    { path: 'ubload/vd', component: UploadFileComponent}




];
@NgModule({
    imports: [RouterModule.forRoot(routes),HttpClientModule],
    exports: [RouterModule],
  })

  export class AppRoutingModule {}
