import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './component/home/home.component';
import { TopScreenMenuComponent } from './component/top-screen-menu/top-screen-menu.component';
import { NgModule } from '@angular/core';

export const routes: Routes = [
    { path: '', component: HomeComponent, pathMatch: 'full' }, 
 

];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
  })
  export class AppRoutingModule {}