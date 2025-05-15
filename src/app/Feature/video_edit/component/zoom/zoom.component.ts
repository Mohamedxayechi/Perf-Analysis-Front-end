import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Engine } from '../../../../Core/Engine';
import { EventPayload } from '../../../../Core/Utility/event-bus';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-zoom',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './zoom.component.html',
  styles: ``,
})
export class ZoomComponent implements OnInit, OnDestroy {
  @Input() zoom = 1;
  @Input() minScale = 0.1;
  @Input() maxScale = 2;
  @Input() stepScale = 0.1;
  @Output() zoomChange = new EventEmitter<number>();

  private subscription: Subscription = new Subscription();

  constructor() {}

  ngOnInit(): void {
    this.subscription.add(
      Engine.getInstance()
        .getEvents()
        .on('zoom.changed', (event: EventPayload) => {
          if (event.data?.zoom !== undefined) {
            this.zoom = parseFloat(event.data.zoom.toFixed(1));
            this.zoomChange.emit(this.zoom);
            console.log(
              `[${new Date().toISOString()}] ZoomComponent: Zoom updated to ${this.zoom}`
            );
          }
        })
    );

    Engine.getInstance().emit({
      type: 'zoom.get',
      data: {},
      origin: 'component',
      processed: false,
    });
    console.log(
      `[${new Date().toISOString()}] ZoomComponent: Emitted zoom.get`
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  zoomIn(): void {
    Engine.getInstance().emit({
      type: 'zoom.in',
      data: { stepScale: this.stepScale },
      origin: 'component',
      processed: false,
    });
    console.log(
      `[${new Date().toISOString()}] ZoomComponent: Emitted zoom.in with stepScale ${this.stepScale}`
    );
  }

  zoomOut(): void {
    Engine.getInstance().emit({
      type: 'zoom.out',
      data: { stepScale: this.stepScale },
      origin: 'component',
      processed: false,
    });
    console.log(
      `[${new Date().toISOString()}] ZoomComponent: Emitted zoom.out with stepScale ${this.stepScale}`
    );
  }

  onZoomChange(): void {
    this.zoom = Math.max(this.minScale, Math.min(this.maxScale, parseFloat(this.zoom.toFixed(1))));
    Engine.getInstance().emit({
      type: 'zoom.change',
      data: { zoom: this.zoom, minScale: this.minScale, maxScale: this.maxScale },
      origin: 'component',
      processed: false,
    });
    this.zoomChange.emit(this.zoom);
    console.log(
      `[${new Date().toISOString()}] ZoomComponent: Emitted zoom.change with zoom ${this.zoom}`
    );
  }
}