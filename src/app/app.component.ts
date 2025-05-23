import { Component, OnInit, EnvironmentInjector } from '@angular/core';
import { MainVideoEditComponent } from './Feature/video_edit/component/main-video-edit/main-video-edit.component';
import { HttpClientModule } from '@angular/common/http';
import { Engine } from '../app/Core/Engine';
import { Display } from '../app/Core/Display/Display';
import { Logs } from '../app/Core/Logs/Logs';
import { Domain } from '../app/Core/Engine';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainVideoEditComponent, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor(private injector: EnvironmentInjector) {
    const engine = Engine.getInstance();
    // Get injected domain instances
    const domains: Domain[] = [
      this.injector.get(Display),
      this.injector.get(Logs), // Ensures Logs has HttpClient
    ];
    // Initialize Engine and override default domains
    engine.init(); // Runs new Logs() but will be overridden
    (engine as any).domains = []; // Clear private domains array
    domains.forEach(domain => engine.registerDomain(domain));
    (engine as any).isInitialized = true; // Set initialized flag
    console.log(`[${new Date().toISOString()}] AppComponent: Engine initialized with injected domains`);
  }

  ngOnInit(): void {
    // Additional setup if needed
  }
}