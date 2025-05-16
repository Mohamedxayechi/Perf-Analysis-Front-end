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

  /**
   * Initializes the component with NgZone for handling events outside Angular's change detection.
   * @param ngZone The NgZone service for running code outside Angular's zone.
   */
  constructor(private ngZone: NgZone) {}

  /**
   * Sets up event listeners for engine events on component initialization.
   */
  ngOnInit(): void {
    this.setupEngineListeners();
  }

  /**
   * Subscribes to engine events to update media list, cursor position, distance per time, and playback state.
   */
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

  /**
   * Emits an event to split a media item at the current cursor time.
   */
  onSplit(): void {
    const time = this.cursorX / this.distancePerTime;
    Engine.getInstance().emit({
      type: 'media.split',
      data: { time },
      origin: 'component',
      processed: false,
    });
  }

  /**
   * Toggles playback state and emits an event with the current time.
   */
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

  /**
   * Emits an event to trigger the media import file picker.
   */
  onClicImportMedia(): void {
    Engine.getInstance().emit({
      type: 'media.import.trigger',
      origin: 'component',
      processed: false,
    });
  }

  /**
   * Emits an event to update the distance per time (pixels per second) for the timeline.
   * @param distancePerTime The new distance per time value.
   */
  updateDistancePerTime(distancePerTime: number): void {
    Engine.getInstance().emit({
      type: 'parameters.distancePerTimeUpdated',
      data: { distancePerTime },
      origin: 'component',
      processed: false,
    });
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}