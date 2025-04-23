import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { TopScreenMenuComponent } from "./component/top-screen-menu/top-screen-menu.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, TopScreenMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-test';
}
