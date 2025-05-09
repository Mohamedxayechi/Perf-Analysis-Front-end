import { Component, OnInit, OnDestroy } from '@angular/core';
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

  constructor() {}

  ngOnInit(): void {
    console.log(`[${new Date().toISOString()}] ActionsBar: Initializing`);
    this.setupEngineListeners();
  }

  private setupEngineListeners(): void {
    this.subscription.add(
      Engine.getInstance()
        .getEvents()
        .on('*', (event: EventPayload) => {
          console.log(`[${new Date().toISOString()}] ActionsBar received event: ${event.type}, origin: ${event.origin}, processed: ${event.processed}`);
          if (event.processed) return;

          switch (event.type) {
            case 'media.initialized':
              if (event.data?.medias) {
                this.medias = event.data.medias;
                console.log(`[${new Date().toISOString()}] ActionsBar: Initialized medias, count: ${this.medias.length}, medias:`, this.medias.map(m => m.label));
              }
              break;
            case 'media.imported':
              if (event.data?.updatedMedias) {
                this.medias = event.data.updatedMedias;
                console.log(`[${new Date().toISOString()}] ActionsBar: Updated medias, count: ${this.medias.length}, medias:`, this.medias.map(m => m.label));
              }
              break;
            case 'media.resized.completed':
              if (event.data?.updatedMedias) {
                this.medias = event.data.updatedMedias;
                console.log(`[${new Date().toISOString()}] ActionsBar: Updated medias after resize at index ${event.data.index}, new time: ${event.data.time}`);
              }
              break;
            case 'cursor.updated':
              this.cursorX = event.data?.cursorX || this.cursorX;
              console.log(`[${new Date().toISOString()}] ActionsBar: Cursor updated to ${this.cursorX}`);
              break;
            case 'playback.toggled':
              this.isPlaying = event.data?.isPlaying || false;
              console.log(`[${new Date().toISOString()}] ActionsBar: isPlaying updated to ${this.isPlaying}`);
              break;
            case 'parameters.distancePerTimeUpdated':
              this.distancePerTime = event.data?.distancePerTime || this.distancePerTime;
              console.log(`[${new Date().toISOString()}] ActionsBar: distancePerTime updated to ${this.distancePerTime}`);
              break;
            default:
              console.warn(`[${new Date().toISOString()}] ActionsBar: Unhandled event: ${event.type}`);
          }
        })
    );
  }

  onSplit(): void {
    const time = this.cursorX / this.distancePerTime;
    console.log(`[${new Date().toISOString()}] ActionsBar: Emitting media.split, time: ${time}`);
    Engine.getInstance().emit({
      type: 'media.split',
      data: { time },
      origin: 'component',
      processed: false,
    });
  }

  onTogglePlayPause(): void {
    const currentSecond = this.cursorX / this.distancePerTime;
    console.log(`[${new Date().toISOString()}] ActionsBar: Emitting playback.toggle, currentSecond: ${currentSecond}, isPlaying: ${this.isPlaying}`);
    Engine.getInstance().emit({
      type: 'playback.toggle',
      data: { currentSecond },
      origin: 'component',
      processed: false,
    });
  }

  onClicImportMedia(): void {
    console.log(`[${new Date().toISOString()}] ActionsBar: Emitting media.import.trigger`);
    Engine.getInstance().emit({
      type: 'media.import.trigger',
      data: {},
      origin: 'component',
      processed: false,
    });
  }

  updateDistancePerTime(distancePerTime: number): void {
    console.log(`[${new Date().toISOString()}] ActionsBar: Emitting parameters.distancePerTimeUpdated with ${distancePerTime}`);
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