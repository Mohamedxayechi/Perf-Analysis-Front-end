import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Media } from '../../../models/time-period.model';
import { Engine } from '../../../../../Core/Engine';
import { EventPayload } from '../../../../../Core/Utility/event-bus';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-actions-bar',
  standalone: true,
  imports: [MatButtonModule, MatDividerModule, MatIconModule, FormsModule, CommonModule],
  templateUrl: './actions-bar.component.html',
  styleUrl: './actions-bar.component.css',
})
export class ActionsBarComponent implements OnInit, OnDestroy {
  medias: Media[] = [];
  private distancePerTime = 50;
  private cursorX = 0;
  isPlaying = false;
  volume = 0.5;
  playbackSpeed = 1;
  availableSpeeds = [0.5, 1, 1.5, 2];
  skipInterval = 5; // Default skip interval (5s)
  availableSkipIntervals = [5, 10, 30]; // Options for skip interval
  private subscription: Subscription = new Subscription();

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    console.log(`[${new Date().toISOString()}] ActionsBar: Available speeds:`, this.availableSpeeds);
    console.log(`[${new Date().toISOString()}] ActionsBar: Available skip intervals:`, this.availableSkipIntervals);
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
              case 'volume.changed':
                this.volume = event.data?.volume ?? this.volume;
                console.log(`[${new Date().toISOString()}] ActionsBar: Volume updated, volume: ${this.volume}`);
                break;
              case 'playback.speed.changed':
                this.playbackSpeed = event.data?.playbackSpeed ?? this.playbackSpeed;
                console.log(`[${new Date().toISOString()}] ActionsBar: Playback speed updated, speed: ${this.playbackSpeed}`);
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
    this.isPlaying = !this.isPlaying;
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

  onVolumeChange(volume: number): void {
    console.log(`[${new Date().toISOString()}] ActionsBar: Volume change requested, volume: ${volume}`);
    Engine.getInstance().emit({
      type: 'volume.changed',
      data: { volume },
      origin: 'component',
      processed: false,
    });
  }

  onSpeedChange(speed: number | string): void {
    const parsedSpeed = typeof speed === 'string' ? parseFloat(speed) : speed;
    if (isNaN(parsedSpeed)) {
      console.warn(`[${new Date().toISOString()}] ActionsBar: Invalid speed value: ${speed}`);
      return;
    }
    console.log(`[${new Date().toISOString()}] ActionsBar: Speed change requested, newSpeed: ${parsedSpeed}, type: ${typeof parsedSpeed}`);
    Engine.getInstance().emit({
      type: 'playback.speed.changed',
      data: { playbackSpeed: parsedSpeed },
      origin: 'component',
      processed: false,
    });
    console.log(`[${new Date().toISOString()}] ActionsBar: Emitted playback.speed.changed event with speed: ${parsedSpeed}`);
  }

  onSkipIntervalChange(interval: number | string): void {
    const parsedInterval = typeof interval === 'string' ? parseFloat(interval) : interval;
    if (isNaN(parsedInterval) || !this.availableSkipIntervals.includes(parsedInterval)) {
      console.warn(`[${new Date().toISOString()}] ActionsBar: Invalid skip interval: ${interval}`);
      return;
    }
    this.skipInterval = parsedInterval;
    console.log(`[${new Date().toISOString()}] ActionsBar: Skip interval changed to ${this.skipInterval}s`);
  }

  skipForward(): void {
    const currentSecond = this.cursorX / this.distancePerTime;
    const newSecond = currentSecond + this.skipInterval;
    console.log(`[${new Date().toISOString()}] ActionsBar: Skipping forward ${this.skipInterval}s, from ${currentSecond} to ${newSecond}`);
    Engine.getInstance().emit({
      type: 'playback.seek',
      data: { seekTime: newSecond },
      origin: 'component',
      processed: false,
    });
  }

  skipBackward(): void {
    const currentSecond = this.cursorX / this.distancePerTime;
    const newSecond = Math.max(0, currentSecond - this.skipInterval);
    console.log(`[${new Date().toISOString()}] ActionsBar: Skipping backward ${this.skipInterval}s, from ${currentSecond} to ${newSecond}`);
    Engine.getInstance().emit({
      type: 'playback.seek',
      data: { seekTime: newSecond },
      origin: 'component',
      processed: false,
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}