import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './Feature/graphical_layout/components/home/home.component';

import { HttpClientModule } from '@angular/common/http';

export const routes: Routes = [
    { path: '', component: HomeComponent, pathMatch: 'full' }, 



];
@NgModule({
    imports: [RouterModule.forRoot(routes),HttpClientModule],
    exports: [RouterModule],
  })
  export class AppRoutingModule {}