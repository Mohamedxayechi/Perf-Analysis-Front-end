
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


import { FormProjectComponent } from './Feature/createProject/components/form-project/form-project.component';
import { HttpClientModule } from '@angular/common/http';
import { ListProjectComponent } from './Feature/createProject/components/list-project/list-project.component';
import { UbloadFileComponent } from './Feature/uploadFile/ubload-file/ubload-file.component';

export const routes: Routes = [
    // { path: '', component: HomeComponent, pathMatch: 'full' }, 
    { path: 'create/project', component: FormProjectComponent }, 
    { path: 'list/project', component: ListProjectComponent }, 
    { path: 'ubload/vd', component: UbloadFileComponent }, 



];
@NgModule({
    imports: [RouterModule.forRoot(routes),HttpClientModule],
    exports: [RouterModule],
  })
  export class AppRoutingModule {}
