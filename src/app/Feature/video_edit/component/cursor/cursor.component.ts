import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Engine } from '../../../../Core/Engine';
import { EventPayload } from '../../../../Core/Utility/event-bus';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cursor',
  standalone: true,
  imports: [],
  templateUrl: './cursor.component.html',
  styleUrl: './cursor.component.css',
})
export class CursorComponent implements OnInit, OnDestroy {
  @Input() spaceBefore = 15;
  @Input() scale = 1;
  @Input() cursorX = 0;
  @Input() distancePerTime = 50;
  seconds = 0;
  private subscription: Subscription = new Subscription();
  private isDragging = false;

  constructor() {}

  /**
   * Initializes the component by setting up event listeners and updating the seconds display.
   */
  ngOnInit(): void {
    this.setupEngineListeners();
    this.updateSeconds();
  }

  /**
   * Subscribes to engine events to update cursor position and distance per time.
   */
  private setupEngineListeners(): void {
    this.subscription.add(
      Engine.getInstance()
        .getEvents()
        .on('*', (event: EventPayload) => {
          // console.log(`[${new Date().toISOString()}] CursorComponent received event: ${event.type}`);
          switch (event.type) {
            case 'Display.cursor.updated':
              if (event.data?.cursorX !== undefined) {
                this.cursorX = event.data.cursorX;
                this.updateSeconds();
                // console.log(`[${new Date().toISOString()}] CursorComponent: Updated cursorX to ${this.cursorX}`);
              }
              break;
            case 'Display.parameters.distancePerTimeUpdated':
              if (event.data?.distancePerTime) {
                this.distancePerTime = event.data.distancePerTime;
                this.updateSeconds();
                // console.log(`[${new Date().toISOString()}] CursorComponent: Updated distancePerTime to ${this.distancePerTime}`);
              }
              break;
            default:
              console.warn(`[${new Date().toISOString()}] Unhandled event in CursorComponent: ${event.type}`);
          }
        })
    );
  }

  /**
   * Updates the seconds value based on the current cursor position and distance per time.
   */
  private updateSeconds(): void {
    this.seconds = this.distancePerTime > 0 ? this.cursorX / this.distancePerTime : 0;
    // console.log(`[${new Date().toISOString()}] CursorComponent: Updated seconds to ${this.seconds}`);
  }


  /**
   * Cleans up subscriptions and event listeners when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
 
  }
}