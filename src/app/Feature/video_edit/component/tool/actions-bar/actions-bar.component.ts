import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { Media } from '../../../models/time-period.model';
import { Engine } from '../../../../../Core/Engine';
import { EventPayload } from '../../../../../Core/Utility/event-bus';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-actions-bar',
  standalone: true,
  imports: [MatButtonModule, MatDividerModule, MatIconModule],
  templateUrl: './actions-bar.component.html',
  styleUrl: './actions-bar.component.css',
})
export class ActionsBarComponent implements OnInit, OnDestroy {
  medias: Media[] = [];
  private distancePerTime = 50;
  private cursorX = 0;
  isPlaying = false;
  private subscription: Subscription = new Subscription();

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.setupEngineListeners();
  }

  private setupEngineListeners(): void {
    this.subscription.add(
      Engine.getInstance()
        .getEvents()
        .on('*', (event: EventPayload) => {
          if (event.processed) return;
          this.ngZone.run(() => {
            switch (event.type) {
              case 'media.initialized':
              case 'media.imported':
              case 'media.resized.completed':
                if (event.data?.updatedMedias) {
                  this.medias = event.data.updatedMedias;
                }
                break;
              case 'cursor.updated':
                this.cursorX = event.data?.cursorX || this.cursorX;
                break;
              case 'parameters.distancePerTimeUpdated':
                this.distancePerTime = event.data?.distancePerTime || this.distancePerTime;
                break;
              case 'playback.toggled':
                this.isPlaying = event.data?.isPlaying ?? this.isPlaying;
                console.log(`[${new Date().toISOString()}] ActionsBar: Playback toggled, isPlaying: ${this.isPlaying}`);
                break;
            }
          });
        })
    );
  }

  onSplit(): void {
    const time = this.cursorX / this.distancePerTime;
    Engine.getInstance().emit({
      type: 'media.split',
      data: { time },
      origin: 'component',
      processed: false,
    });
  }

  onTogglePlayPause(): void {
    this.isPlaying = !this.isPlaying; // Local toggle as fallback
    const currentSecond = this.cursorX / this.distancePerTime;
    console.log(`[${new Date().toISOString()}] ActionsBar: Toggle play/pause, isPlaying: ${this.isPlaying}, currentSecond: ${currentSecond}`);
    Engine.getInstance().emit({
      type: 'playback.toggle',
      data: { currentSecond },
      origin: 'component',
      processed: false,
    });
  }

  onClicImportMedia(): void {
    Engine.getInstance().emit({
      type: 'media.import.trigger',
      origin: 'component',
      processed: false,
    });
  }

  updateDistancePerTime(distancePerTime: number): void {
    Engine.getInstance().emit({
      type: 'parameters.distancePerTimeUpdated',
      data: { distancePerTime },
      origin: 'component',
      processed: false,
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}