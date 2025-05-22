import { Component, OnInit, OnDestroy } from '@angular/core';
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
  isPlaying = false;
  volume = 0.5;
  playbackSpeed = 1;
  skipInterval = 5;
  availableSpeeds = [0.5, 1, 1.5, 2];
  availableSkipIntervals = [5, 10, 30];
  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    // console.log(`[${new Date().toISOString()}] ActionsBar: Available speeds:`, this.availableSpeeds);
    // console.log(`[${new Date().toISOString()}] ActionsBar: Available skip intervals:`, this.availableSkipIntervals);
    this.setupEngineListeners();
  }

  private setupEngineListeners(): void {
    const eventsObservable = Engine.getInstance().getEvents();
    // console.log(`[${new Date().toISOString()}] ActionsBar: Subscribing to Engine events`);
    this.subscription.add(
      eventsObservable.on('*', (event: EventPayload) => {
        // console.log(`[${new Date().toISOString()}] ActionsBar: Received event: ${event.type}, processed: ${event.processed}, data:`, event.data);
        switch (event.type) {
          case 'Display.media.initialized':
          case 'Display.media.imported':
          case 'Display.media.resized.completed':
            if (event.data?.updatedMedias) {
              this.medias = event.data.updatedMedias;
              // console.log(`[${new Date().toISOString()}] ActionsBar: Updated medias, count: ${this.medias.length}`);
            }
            break;
          case 'Display.playback.toggled':
            this.isPlaying = event.data?.isPlaying ?? this.isPlaying;
            // console.log(`[${new Date().toISOString()}] ActionsBar: Playback toggled, isPlaying: ${this.isPlaying}`);
            break;
          case 'Display.volume.changed':
            this.volume = event.data?.volume ?? this.volume;
            console.log(`[${new Date().toISOString()}] ActionsBar: Volume updated, volume: ${this.volume}`);
            break;
          case 'Display.playback.speed.changed':
            this.playbackSpeed = event.data?.playbackSpeed ?? this.playbackSpeed;
            console.log(`[${new Date().toISOString()}] ActionsBar: Playback speed updated, speed: ${this.playbackSpeed}`);
            break;
          case 'Display.skip.interval.updated':
            this.skipInterval = event.data?.skipInterval ?? this.skipInterval;
            console.log(`[${new Date().toISOString()}] ActionsBar: Skip interval updated to ${this.skipInterval}s`);
            break;
        }
      })
    );
  }

  onSplit(): void {
    // console.log(`[${new Date().toISOString()}] ActionsBar: Emitting split media request`);
    Engine.getInstance().emit({
      type: 'ActionsBarComponent.media.split',
      data: {},
      origin: 'component',
      processed: false,
    });
  }

  onTogglePlayPause(): void {
    this.isPlaying = !this.isPlaying;
    // console.log(`[${new Date().toISOString()}] ActionsBar: Emitting toggle play/pause, isPlaying: ${this.isPlaying}`);
    Engine.getInstance().emit({
      type: 'ActionsBarComponent.playback.toggle',
      data: {},
      origin: 'component',
      processed: false,
    });
  }

  onClicImportMedia(): void {
    Engine.getInstance().emit({
      type: 'ActionsBarComponent.media.import.trigger',
      origin: 'component',
      processed: false,
    });
  }

  onConvertToMP4(): void {
    console.log(`[${new Date().toISOString()}] ActionsBar: Emitting convert to MP4 request`);
    Engine.getInstance().emit({
      type: 'ActionsBarComponent.media.convertToMP4',
      data: {},
      origin: 'component',
      processed: false,
    });
  }


 

  onVolumeChange(volume: number): void {
    console.log(`[${new Date().toISOString()}] ActionsBar: Volume change requested, volume: ${volume}`);
    Engine.getInstance().emit({
      type: 'ActionsBarComponent.volume.changed',
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
    // console.log(`[${new Date().toISOString()}] ActionsBar: Speed change requested, newSpeed: ${parsedSpeed}`);
    Engine.getInstance().emit({
      type: 'ActionsBarComponent.playback.speed.changed',
      data: { playbackSpeed: parsedSpeed },
      origin: 'component',
      processed: false,
    });
  }

  onSkipIntervalChange(interval: number | string): void {
    const parsedInterval = typeof interval === 'string' ? parseFloat(interval) : interval;
    // console.log(`[${new Date().toISOString()}] ActionsBar: Emitting skip interval change, interval: ${parsedInterval}`);
    Engine.getInstance().emit({
      type: 'ActionsBarComponent.skip.interval.changed',
      data: { skipInterval: parsedInterval },
      origin: 'component',
      processed: false,
    });
  }

  skipForward(): void {
    console.log(`[${new Date().toISOString()}] ActionsBar: Emitting skip forward`);
    Engine.getInstance().emit({
      type: 'ActionsBarComponent.playback.skip.forward',
      data: {},
      origin: 'component',
      processed: false,
    });
  }

  skipBackward(): void {
    console.log(`[${new Date().toISOString()}] ActionsBar: Emitting skip backward`);
    Engine.getInstance().emit({
      type: 'ActionsBarComponent.playback.skip.backward',
      data: {},
      origin: 'component',
      processed: false,
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}